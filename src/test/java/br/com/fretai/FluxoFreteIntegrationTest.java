package br.com.fretai;

import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Sobe a aplicação inteira (Flyway + JPA + MVC) contra o H2 do perfil "test".
 * Só o ViaCEP é simulado, para o teste não depender da internet.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Fluxo completo de frete via HTTP")
class FluxoFreteIntegrationTest {

    @Autowired private MockMvc mvc;
    @Autowired private FreteRepository freteRepository;
    @Autowired private MotoristaRepository motoristaRepository;
    @Autowired private TransactionTemplate tx;

    @MockitoBean
    private EnderecoGateway enderecoGateway;

    @BeforeEach
    void simularViaCep() {
        when(enderecoGateway.buscarPorCep(anyString()))
                .thenReturn(new Endereco("01001-000", "Praça da Sé", "Sé", "São Paulo", "SP"));
    }

    @Test
    @DisplayName("Cadastro → solicitação → aceite → transporte → entrega")
    void fluxoCompleto() throws Exception {
        String clienteId = cadastrarCliente("52998224725", "carlos@email.com");
        String motoristaId = cadastrarMotorista("11144477735", "marcos@email.com", "ABC1D23");
        String freteId = solicitarFrete(clienteId);

        mvc.perform(get("/api/fretes").param("status", "PENDENTE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(freteId));

        mvc.perform(post("/api/fretes/{id}/aceite", freteId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motoristaId\": \"%s\"}".formatted(motoristaId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACEITO"))
                .andExpect(jsonPath("$.motorista.placa").value("ABC1D23"));

        mvc.perform(post("/api/fretes/{id}/inicio", freteId))
                .andExpect(jsonPath("$.status").value("EM_TRANSITO"));

        mvc.perform(post("/api/fretes/{id}/conclusao", freteId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ENTREGUE"))
                .andExpect(jsonPath("$.concluidoEm").exists());

        // Concluir de novo não é permitido
        mvc.perform(post("/api/fretes/{id}/conclusao", freteId))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Resposta de cadastro nunca expõe senha nem CPF")
    void cadastroNaoExpoeDadosSensiveis() throws Exception {
        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(clienteJson("06390199007", "ana@email.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.senhaHash").doesNotExist())
                .andExpect(jsonPath("$.cpf").doesNotExist());
    }

    @Test
    @DisplayName("CPF já cadastrado → 409")
    void cpfDuplicado() throws Exception {
        cadastrarCliente("12345678909", "primeiro@email.com");

        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON)
                        .content(clienteJson("123.456.789-09", "segundo@email.com")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Dois motoristas aceitando o mesmo frete: o segundo é barrado pelo @Version")
    void aceiteConcorrente() throws Exception {
        String clienteId = cadastrarCliente("71428793860", "cliente2@email.com");
        UUID motoristaA = UUID.fromString(cadastrarMotorista("26676451034", "a@email.com", "AAA1111"));
        UUID motoristaB = UUID.fromString(cadastrarMotorista("87748248800", "b@email.com", "BBB2222"));
        UUID freteId = UUID.fromString(solicitarFrete(clienteId));

        // O motorista B abre o app e vê o frete ainda PENDENTE (versão 0)...
        Frete vistoPeloB = tx.execute(s -> freteRepository.findById(freteId).orElseThrow());

        // ...enquanto isso o motorista A aceita primeiro.
        mvc.perform(post("/api/fretes/{id}/aceite", freteId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motoristaId\": \"%s\"}".formatted(motoristaA)))
                .andExpect(status().isOk());

        // B tenta gravar o aceite em cima da versão antiga → conflito, e o frete continua com A.
        assertThrows(ObjectOptimisticLockingFailureException.class, () -> tx.executeWithoutResult(s -> {
            Motorista b = motoristaRepository.findById(motoristaB).orElseThrow();
            vistoPeloB.aceitar(b);
            freteRepository.saveAndFlush(vistoPeloB);
        }));

        mvc.perform(get("/api/fretes/{id}", freteId))
                .andExpect(jsonPath("$.motorista.id").value(motoristaA.toString()));
    }

    // ---------- auxiliares ----------

    private static String clienteJson(String cpf, String email) {
        return """
                {"cpf": "%s", "nome": "Carlos Silva", "email": "%s",
                 "senha": "senhaForte1", "telefone": "(11) 99999-8888"}
                """.formatted(cpf, email);
    }

    private String cadastrarCliente(String cpf, String email) throws Exception {
        String corpo = mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(clienteJson(cpf, email)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }

    private String cadastrarMotorista(String cpf, String email, String placa) throws Exception {
        String corpo = mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Marcos Souza", "email": "%s", "senha": "senhaForte1",
                         "telefone": "11988887777", "tipoVeiculo": "UTILITARIO", "placa": "%s"}
                        """.formatted(cpf, email, placa)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }

    private String solicitarFrete(String clienteId) throws Exception {
        String corpo = mvc.perform(post("/api/fretes").contentType(MediaType.APPLICATION_JSON).content("""
                        {"clienteId": "%s",
                         "coleta":  {"cep": "01001-000", "numero": "100"},
                         "entrega": {"cep": "20040-002", "numero": "50"},
                         "nomeDestinatario": "Ana Pereira", "telefoneDestinatario": "21977776666",
                         "descricaoCarga": "Caixa de peças", "pesoKg": 12, "valor": 180.00}
                        """.formatted(clienteId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }
}
