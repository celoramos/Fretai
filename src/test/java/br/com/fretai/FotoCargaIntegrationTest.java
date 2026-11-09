package br.com.fretai;

import br.com.fretai.calendario.domain.FeriadoGateway;
import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.rota.domain.Rota;
import br.com.fretai.rota.domain.RotaGateway;
import br.com.fretai.support.Login;
import com.jayway.jsonpath.JsonPath;
import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Fotos que o cliente manda com o pedido, para o motorista decidir: só o dono envia, até 5, antes de fechar. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Fotos da carga via HTTP")
class FotoCargaIntegrationTest {

    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 9, 9};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 1, 2};

    @Autowired private MockMvc mvc;

    @MockitoBean private EnderecoGateway enderecoGateway;
    @MockitoBean private GeocodificacaoGateway geocodificacaoGateway;
    @MockitoBean private RotaGateway rotaGateway;
    @MockitoBean private FeriadoGateway feriadoGateway;

    @BeforeEach
    void simularServicosExternos() {
        when(feriadoGateway.nacionaisDoAno(anyInt())).thenReturn(List.of());
        when(enderecoGateway.buscarPorCep(anyString()))
                .thenReturn(new Endereco("40140-000", "Av. Paulo VI", "Pituba", "Salvador", "BA"));
        when(geocodificacaoGateway.localizar(any(), any()))
                .thenReturn(Optional.of(new Coordenadas(-12.9935, -38.4562)));
        when(rotaGateway.calcular(any(), any())).thenReturn(new Rota(new BigDecimal("22"), true));
    }

    @Test
    @DisplayName("O dono envia a foto e qualquer pessoa logada vê a lista, com link que abre")
    void donoEnviaEVeALista() throws Exception {
        RequestPostProcessor cliente = cadastrarCliente("27182818809", "fotos1@email.com");
        String freteId = pedir(cliente);
        cadastrarMotorista("27182818981", "fotos.motorista@email.com", "FOT1A11");

        enviar(freteId, cliente, PNG)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.url").exists());

        String lista = mvc.perform(get("/api/fretes/{id}/fotos", freteId).with(Login.como(mvc, "fotos.motorista@email.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andReturn().getResponse().getContentAsString();
        String url = JsonPath.read(lista, "$[0].url");
        mvc.perform(get(URI.create(url).getPath())).andExpect(status().isOk());
    }

    @Test
    @DisplayName("A sexta foto volta 422")
    void sextaFotoVolta422() throws Exception {
        RequestPostProcessor cliente = cadastrarCliente("27182819015", "fotos2@email.com");
        String freteId = pedir(cliente);
        for (int i = 0; i < 5; i++) {
            enviar(freteId, cliente, JPEG).andExpect(status().isCreated());
        }
        enviar(freteId, cliente, JPEG)
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value("Até 5 fotos por pedido."));
    }

    @Test
    @DisplayName("Outro cliente não envia foto no pedido de alguém")
    void outroClienteNaoEnvia() throws Exception {
        String freteId = pedir(cadastrarCliente("27182819104", "fotos3@email.com"));
        RequestPostProcessor outro = cadastrarCliente("31415927308", "fotos4@email.com");
        enviar(freteId, outro, PNG)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Só quem pediu o frete envia fotos."));
    }

    @Test
    @DisplayName("Arquivo que não é JPEG nem PNG volta 422")
    void arquivoQueNaoEhFoto() throws Exception {
        RequestPostProcessor cliente = cadastrarCliente("31415927480", "fotos5@email.com");
        String freteId = pedir(cliente);
        enviar(freteId, cliente, "%PDF-1.4 nao e foto".getBytes())
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value("A foto da carga deve ser JPEG ou PNG."));
    }

    @Test
    @DisplayName("Depois do aceite a foto não entra mais")
    void fotoDepoisDoAceiteVolta422() throws Exception {
        RequestPostProcessor cliente = cadastrarCliente("31415927561", "fotos6@email.com");
        String freteId = pedir(cliente);
        String motoristaId = cadastrarMotorista("31415927642", "fotos.aceite@email.com", "FOT2B22");
        mvc.perform(post("/api/fretes/{id}/aceite", freteId).with(Login.como(mvc, "fotos.aceite@email.com"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motoristaId\": \"%s\"}".formatted(motoristaId)))
                .andExpect(status().isOk());

        enviar(freteId, cliente, PNG)
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value("As fotos entram antes de o frete fechar."));
    }

    private ResultActions enviar(String freteId, RequestPostProcessor quem, byte[] conteudo) throws Exception {
        return mvc.perform(multipart("/api/fretes/{id}/fotos", freteId)
                .file(new MockMultipartFile("foto", "carga.png", "image/png", conteudo)).with(quem));
    }

    private RequestPostProcessor cadastrarCliente(String cpf, String email) throws Exception {
        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Juliana Matos", "email": "%s",
                         "senha": "senhaForte1", "telefone": "(71) 98877-1234"}
                        """.formatted(cpf, email)))
                .andExpect(status().isCreated());
        return Login.como(mvc, email);
    }

    private String cadastrarMotorista(String cpf, String email, String placa) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Edvaldo Santos", "email": "%s", "senha": "senhaForte1",
                         "telefone": "71988771234", "tipoVeiculo": "VAN", "placa": "%s"}
                        """.formatted(cpf, email, placa)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id");
    }

    private String pedir(RequestPostProcessor cliente) throws Exception {
        String eu = mvc.perform(get("/api/auth/eu").with(cliente)).andReturn().getResponse().getContentAsString();
        String clienteId = JsonPath.read(eu, "$.id");
        return JsonPath.read(mvc.perform(post("/api/fretes").with(cliente).contentType(MediaType.APPLICATION_JSON).content("""
                        {"clienteId": "%s",
                         "coleta":  {"cep": "41810-000", "numero": "1200"},
                         "entrega": {"cep": "42700-000", "numero": "40"},
                         "nomeDestinatario": "Juliana Matos", "telefoneDestinatario": "71988771234",
                         "descricaoCarga": "Mudança de 1 quarto", "pesoKg": 700, "valor": 380.00,
                         "dataColeta": "2099-11-14", "categoriaVeiculo": "VAN", "tipoCarga": "MUDANCA"}
                        """.formatted(clienteId)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id");
    }
}
