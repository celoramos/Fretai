package br.com.fretai;

import br.com.fretai.calendario.domain.FeriadoGateway;
import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.frete.domain.Autor;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.rota.domain.Rota;
import br.com.fretai.rota.domain.RotaGateway;
import br.com.fretai.support.Login;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import com.jayway.jsonpath.JsonPath;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
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
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Sobe a aplicação inteira (Flyway + JPA + MVC) contra o H2 do perfil "test".
 * As integrações externas (CEP, geocodificação, rota) são simuladas, para o
 * teste não depender da internet.
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
    @MockitoBean
    private GeocodificacaoGateway geocodificacaoGateway;
    @MockitoBean
    private RotaGateway rotaGateway;
    @MockitoBean
    private FeriadoGateway feriadoGateway;

    @BeforeEach
    void simularServicosExternos() {
        when(feriadoGateway.nacionaisDoAno(anyInt())).thenReturn(List.of());
        when(enderecoGateway.buscarPorCep(anyString()))
                .thenReturn(new Endereco("01001-000", "Praça da Sé", "Sé", "São Paulo", "SP"));
        when(geocodificacaoGateway.localizar(any(), any()))
                .thenReturn(Optional.of(new Coordenadas(-23.5503898, -46.633081)));
        when(rotaGateway.calcular(any(), any())).thenReturn(new Rota(new BigDecimal("12.4"), true));
    }

    @Test
    @DisplayName("Cadastro → solicitação → aceite → transporte → entrega")
    void fluxoCompleto() throws Exception {
        String clienteId = cadastrarCliente("52998224725", "carlos@email.com");
        String motoristaId = cadastrarMotorista("11144477735", "marcos@email.com", "ABC1D23");
        RequestPostProcessor cliente = Login.como(mvc, "carlos@email.com");
        RequestPostProcessor motorista = Login.como(mvc, "marcos@email.com");
        String freteId = solicitarFrete(clienteId, cliente);

        mvc.perform(get("/api/fretes").param("status", "PENDENTE").with(motorista))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(freteId));

        // Relido do banco: coordenadas e distância passaram pela migration V2. Quem pediu vê as coordenadas.
        mvc.perform(get("/api/fretes/{id}", freteId).with(cliente))
                .andExpect(jsonPath("$.distanciaKm").value(12.4))
                .andExpect(jsonPath("$.coleta.latitude").value(-23.5503898));

        mvc.perform(post("/api/fretes/{id}/aceite", freteId).with(motorista).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motoristaId\": \"%s\"}".formatted(motoristaId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACEITO"))
                .andExpect(jsonPath("$.motorista.placa").value("ABC1D23"));

        // Quem inicia o transporte é o motorista, não o cliente.
        mvc.perform(post("/api/fretes/{id}/inicio", freteId).with(cliente))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/fretes/{id}/inicio", freteId).with(motorista))
                .andExpect(jsonPath("$.status").value("EM_TRANSITO"));

        mvc.perform(post("/api/fretes/{id}/conclusao", freteId).with(motorista))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ENTREGUE"))
                .andExpect(jsonPath("$.concluidoEm").exists());

        // Concluir de novo não é permitido
        mvc.perform(post("/api/fretes/{id}/conclusao", freteId).with(motorista))
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
        UUID freteId = UUID.fromString(solicitarFrete(clienteId, Login.como(mvc, "cliente2@email.com")));
        RequestPostProcessor a = Login.como(mvc, "a@email.com");

        // O motorista B abre o app e vê o frete ainda PUBLICADO (versão 0)...
        Frete vistoPeloB = tx.execute(s -> {
            Frete f = freteRepository.findById(freteId).orElseThrow();
            f.getEventos().size(); // o app de B carregou o frete inteiro, histórico incluído
            return f;
        });

        // ...enquanto isso o motorista A aceita primeiro.
        mvc.perform(post("/api/fretes/{id}/aceite", freteId).with(a).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motoristaId\": \"%s\"}".formatted(motoristaA)))
                .andExpect(status().isOk());

        // B tenta gravar o aceite em cima da versão antiga → conflito, e o frete continua com A.
        assertThrows(ObjectOptimisticLockingFailureException.class, () -> tx.executeWithoutResult(s -> {
            Motorista b = motoristaRepository.findById(motoristaB).orElseThrow();
            vistoPeloB.aceitarPeloValorAnunciado(b, null, new Autor(b.getId(), Papel.MOTORISTA));
            freteRepository.saveAndFlush(vistoPeloB);
        }));

        mvc.perform(get("/api/fretes/{id}", freteId).with(a))
                .andExpect(jsonPath("$.motorista.id").value(motoristaA.toString()));
    }

    @Test
    @DisplayName("Cliente lista os próprios fretes; outro cliente não vê a lista dele")
    void listaDoCliente() throws Exception {
        String clienteId = cadastrarCliente("98765432100", "lista@email.com");
        String outroId = cadastrarCliente("24681357928", "outro.cliente@email.com");
        RequestPostProcessor cliente = Login.como(mvc, "lista@email.com");
        RequestPostProcessor outro = Login.como(mvc, "outro.cliente@email.com");
        String freteId = solicitarFrete(clienteId, cliente);

        mvc.perform(get("/api/fretes/cliente/{id}", clienteId).with(cliente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].id").value(freteId))
                .andExpect(jsonPath("$.content[0].cliente.id").value(clienteId))
                .andExpect(jsonPath("$.content[0].nomeDestinatario").value("Ana Pereira"));

        mvc.perform(get("/api/fretes/cliente/{id}", clienteId).with(outro))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/fretes/cliente/{id}", outroId).with(outro))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    @DisplayName("Pedido vazio, do jeito que o formulário do cliente manda: um erro por campo")
    void pedidoVazioDoFormulario() throws Exception {
        String clienteId = cadastrarCliente("71673015824", "vazio@email.com");
        mvc.perform(post("/api/fretes").with(Login.como(mvc, "vazio@email.com")).contentType(MediaType.APPLICATION_JSON).content("""
                        {"clienteId": "%s",
                         "coleta":  {"cep": "", "numero": null, "complemento": null, "pontoReferencia": null},
                         "entrega": {"cep": "", "numero": null, "complemento": null, "pontoReferencia": null},
                         "nomeDestinatario": "", "telefoneDestinatario": "", "descricaoCarga": "",
                         "pesoKg": 0, "valor": 0, "dataColeta": ""}
                        """.formatted(clienteId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros['coleta.cep']").exists())
                .andExpect(jsonPath("$.erros['entrega.cep']").exists())
                .andExpect(jsonPath("$.erros.nomeDestinatario").exists())
                .andExpect(jsonPath("$.erros.telefoneDestinatario").exists())
                .andExpect(jsonPath("$.erros.descricaoCarga").exists())
                .andExpect(jsonPath("$.erros.pesoKg").exists())
                .andExpect(jsonPath("$.erros.valor").exists())
                .andExpect(jsonPath("$.erros.dataColeta").value("A data da coleta é obrigatória."))
                .andExpect(jsonPath("$.erros.categoriaVeiculo").value("Escolha o tamanho do veículo."))
                .andExpect(jsonPath("$.erros.tipoCarga").value("Escolha o que vai levar."));
    }

    @Test
    @DisplayName("O pedido guarda o tamanho do veículo e o tipo de carga")
    void pedidoGuardaTamanhoETipo() throws Exception {
        String clienteId = cadastrarCliente("31415927138", "tamanho@email.com");
        RequestPostProcessor cliente = Login.como(mvc, "tamanho@email.com");
        String freteId = solicitarFrete(clienteId, cliente, "VAN");

        mvc.perform(get("/api/fretes/{id}", freteId).with(cliente))
                .andExpect(jsonPath("$.categoriaVeiculo").value("VAN"))
                .andExpect(jsonPath("$.tipoCarga").value("CAIXAS"));
    }

    @Test
    @DisplayName("Moto não é tamanho de veículo de frete")
    void motoNaoEhTamanho() throws Exception {
        String clienteId = cadastrarCliente("31415927219", "moto@email.com");
        mvc.perform(post("/api/fretes").with(Login.como(mvc, "moto@email.com")).contentType(MediaType.APPLICATION_JSON)
                        .content(pedidoJson(clienteId, "MOTO")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Motorista com veículo menor que o pedido não aceita; com o tamanho certo, aceita")
    void veiculoMenorNaoAceita() throws Exception {
        String clienteId = cadastrarCliente("31415926670", "mudanca@email.com");
        String pequeno = cadastrarMotorista("31415926751", "fiorino@email.com", "FIO1A11", "UTILITARIO");
        String grande = cadastrarMotorista("31415926832", "bau@email.com", "BAU1A11", "CAMINHAO");
        String freteId = solicitarFrete(clienteId, Login.como(mvc, "mudanca@email.com"), "CAMINHAO");

        mvc.perform(post("/api/fretes/{id}/aceite", freteId).with(Login.como(mvc, "fiorino@email.com"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motoristaId\": \"%s\"}".formatted(pequeno)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value("Este frete precisa de caminhão."));
        mvc.perform(post("/api/fretes/{id}/aceite", freteId).with(Login.como(mvc, "bau@email.com"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motoristaId\": \"%s\"}".formatted(grande)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Motorista com veículo menor que o pedido não manda proposta")
    void veiculoMenorNaoPropoe() throws Exception {
        String clienteId = cadastrarCliente("31415926913", "obra@email.com");
        cadastrarMotorista("31415927057", "van@email.com", "VAN1A11", "VAN");
        String freteId = solicitarFrete(clienteId, Login.como(mvc, "obra@email.com"), "CAMINHAO");

        mvc.perform(post("/api/fretes/{id}/propostas", freteId).with(Login.como(mvc, "van@email.com"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"valor\": 250.00, \"adiantamentoPercentual\": 0}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value("Este frete precisa de caminhão."));
    }

    @Test
    @DisplayName("Motorista de fora vê só bairro, cidade e UF; nada de quem recebe")
    void motoristaDeForaVeSoBairroECidade() throws Exception {
        String clienteId = cadastrarCliente("16180339805", "privado@email.com");
        cadastrarMotorista("16180339996", "curioso@email.com", "CUR1A11");
        String freteId = solicitarFrete(clienteId, Login.como(mvc, "privado@email.com"));
        RequestPostProcessor curioso = Login.como(mvc, "curioso@email.com");

        mvc.perform(get("/api/fretes/{id}", freteId).with(curioso))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coleta.cidade").value("São Paulo"))
                .andExpect(jsonPath("$.coleta.bairro").value("Sé"))
                .andExpect(jsonPath("$.coleta.logradouro").doesNotExist())
                .andExpect(jsonPath("$.coleta.numero").doesNotExist())
                .andExpect(jsonPath("$.coleta.cep").doesNotExist())
                .andExpect(jsonPath("$.coleta.latitude").doesNotExist())
                .andExpect(jsonPath("$.coleta.enderecoCompleto").doesNotExist())
                .andExpect(jsonPath("$.entrega.logradouro").doesNotExist())
                .andExpect(jsonPath("$.nomeDestinatario").doesNotExist())
                .andExpect(jsonPath("$.telefoneDestinatario").doesNotExist());

        mvc.perform(get("/api/fretes").param("status", "PUBLICADO").with(curioso))
                .andExpect(jsonPath("$.content[?(@.id == '%s')].coleta.logradouro".formatted(freteId))
                        .value(org.hamcrest.Matchers.contains(org.hamcrest.Matchers.nullValue())))
                .andExpect(jsonPath("$.content[?(@.id == '%s')].telefoneDestinatario".formatted(freteId))
                        .value(org.hamcrest.Matchers.contains(org.hamcrest.Matchers.nullValue())));
    }

    @Test
    @DisplayName("Depois do aceite o motorista do frete vê o endereço completo e quem recebe")
    void motoristaDoFreteVeTudoDepoisDoAceite() throws Exception {
        String clienteId = cadastrarCliente("16180340064", "aceito@email.com");
        String motoristaId = cadastrarMotorista("16180340145", "fechou@email.com", "FEC1A11");
        String freteId = solicitarFrete(clienteId, Login.como(mvc, "aceito@email.com"));
        RequestPostProcessor motorista = Login.como(mvc, "fechou@email.com");
        mvc.perform(post("/api/fretes/{id}/aceite", freteId).with(motorista).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motoristaId\": \"%s\"}".formatted(motoristaId)))
                .andExpect(status().isOk());

        mvc.perform(get("/api/fretes/{id}", freteId).with(motorista))
                .andExpect(jsonPath("$.coleta.logradouro").value("Praça da Sé"))
                .andExpect(jsonPath("$.coleta.numero").value("100"))
                .andExpect(jsonPath("$.telefoneDestinatario").value("21977776666"));
    }

    @Test
    @DisplayName("Quem pediu o frete vê tudo")
    void clienteDonoVeTudo() throws Exception {
        String clienteId = cadastrarCliente("16180340226", "dono@email.com");
        RequestPostProcessor dono = Login.como(mvc, "dono@email.com");
        String freteId = solicitarFrete(clienteId, dono);

        mvc.perform(get("/api/fretes/{id}", freteId).with(dono))
                .andExpect(jsonPath("$.coleta.logradouro").value("Praça da Sé"))
                .andExpect(jsonPath("$.coleta.latitude").value(-23.5503898))
                .andExpect(jsonPath("$.nomeDestinatario").value("Ana Pereira"));
    }

    @Test
    @DisplayName("O contato só aparece depois que o frete fecha")
    void contatoAntesDoAceite() throws Exception {
        String clienteId = cadastrarCliente("16180340307", "contato1@email.com");
        RequestPostProcessor cliente = Login.como(mvc, "contato1@email.com");
        String freteId = solicitarFrete(clienteId, cliente);

        mvc.perform(get("/api/fretes/{id}/contato", freteId).with(cliente))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value("O contato aparece depois que o frete fecha."));
    }

    @Test
    @DisplayName("Depois do aceite, cada lado recebe o nome e o telefone do outro")
    void contatoDepoisDoAceiteDosDoisLados() throws Exception {
        String clienteId = cadastrarCliente("16180340498", "contato2@email.com");
        String motoristaId = cadastrarMotorista("16180340579", "contato.motorista@email.com", "CON2B22");
        RequestPostProcessor cliente = Login.como(mvc, "contato2@email.com");
        RequestPostProcessor motorista = Login.como(mvc, "contato.motorista@email.com");
        String freteId = solicitarFrete(clienteId, cliente);
        mvc.perform(post("/api/fretes/{id}/aceite", freteId).with(motorista).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motoristaId\": \"%s\"}".formatted(motoristaId)))
                .andExpect(status().isOk());

        mvc.perform(get("/api/fretes/{id}/contato", freteId).with(cliente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Marcos Souza"))
                .andExpect(jsonPath("$.telefone").value("11988887777"));
        mvc.perform(get("/api/fretes/{id}/contato", freteId).with(motorista))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Carlos Silva"))
                .andExpect(jsonPath("$.telefone").value("11999998888"));
    }

    @Test
    @DisplayName("Quem não participa do frete não vê o contato")
    void contatoDeQuemNaoParticipa() throws Exception {
        String clienteId = cadastrarCliente("16180340650", "contato3@email.com");
        String motoristaId = cadastrarMotorista("16180340730", "contato.dono@email.com", "CON3C33");
        cadastrarMotorista("16180340811", "contato.outro@email.com", "CON4D44");
        String freteId = solicitarFrete(clienteId, Login.como(mvc, "contato3@email.com"));
        mvc.perform(post("/api/fretes/{id}/aceite", freteId).with(Login.como(mvc, "contato.dono@email.com"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motoristaId\": \"%s\"}".formatted(motoristaId)))
                .andExpect(status().isOk());

        mvc.perform(get("/api/fretes/{id}/contato", freteId).with(Login.como(mvc, "contato.outro@email.com")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Só quem participa do frete vê o contato."));
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
        return cadastrarMotorista(cpf, email, placa, "UTILITARIO");
    }

    private String cadastrarMotorista(String cpf, String email, String placa, String tipoVeiculo) throws Exception {
        String corpo = mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Marcos Souza", "email": "%s", "senha": "senhaForte1",
                         "telefone": "11988887777", "tipoVeiculo": "%s", "placa": "%s"}
                        """.formatted(cpf, email, tipoVeiculo, placa)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }

    private static String pedidoJson(String clienteId, String categoriaVeiculo) {
        return """
                {"clienteId": "%s",
                 "coleta":  {"cep": "01001-000", "numero": "100"},
                 "entrega": {"cep": "20040-002", "numero": "50"},
                 "nomeDestinatario": "Ana Pereira", "telefoneDestinatario": "21977776666",
                 "descricaoCarga": "Caixa de peças", "pesoKg": 12, "valor": 180.00,
                 "dataColeta": "2099-01-07", "categoriaVeiculo": "%s", "tipoCarga": "CAIXAS"}
                """.formatted(clienteId, categoriaVeiculo);
    }

    private String solicitarFrete(String clienteId, RequestPostProcessor cliente) throws Exception {
        return solicitarFrete(clienteId, cliente, "UTILITARIO");
    }

    private String solicitarFrete(String clienteId, RequestPostProcessor cliente, String categoriaVeiculo) throws Exception {
        String corpo = mvc.perform(post("/api/fretes").with(cliente).contentType(MediaType.APPLICATION_JSON)
                        .content(pedidoJson(clienteId, categoriaVeiculo)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PUBLICADO"))
                .andExpect(jsonPath("$.distanciaKm").value(12.4))
                .andExpect(jsonPath("$.distanciaEstimada").value(true))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }
}
