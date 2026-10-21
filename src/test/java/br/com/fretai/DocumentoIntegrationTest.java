package br.com.fretai;

import br.com.fretai.calendario.domain.FeriadoGateway;
import br.com.fretai.empresa.domain.DadosCnpj;
import br.com.fretai.empresa.domain.EmpresaGateway;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.rota.domain.Rota;
import br.com.fretai.rota.domain.RotaGateway;
import br.com.fretai.support.Login;
import com.jayway.jsonpath.JsonPath;
import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
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
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "fretai.admin.email=admin.docs@fretai.dev", "fretai.admin.senha=senhaDoAdmin123",
        "fretai.admin.cpf=27604938302"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Documentos: upload, link assinado, permissão e registro de acesso")
class DocumentoIntegrationTest {

    /** Cabeçalho de PNG seguido de lixo: basta para o tipo ser reconhecido pelos primeiros bytes. */
    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};

    @Autowired private MockMvc mvc;

    @MockitoBean private EnderecoGateway enderecoGateway;
    @MockitoBean private GeocodificacaoGateway geocodificacaoGateway;
    @MockitoBean private RotaGateway rotaGateway;
    @MockitoBean private FeriadoGateway feriadoGateway;
    @MockitoBean private EmpresaGateway empresaGateway;

    @BeforeEach
    void simularServicosExternos() {
        when(feriadoGateway.nacionaisDoAno(anyInt())).thenReturn(List.of());
        when(enderecoGateway.buscarPorCep(anyString()))
                .thenReturn(new Endereco("01001-000", "Praça da Sé", "Sé", "São Paulo", "SP"));
        when(geocodificacaoGateway.localizar(any(), any())).thenReturn(Optional.empty());
        when(rotaGateway.calcular(any(), any())).thenReturn(new Rota(new BigDecimal("50"), false));
        when(empresaGateway.buscarPorCnpj(anyString())).thenAnswer(i -> new DadosCnpj(
                i.getArgument(0), "Documentada Ltda", null, "ATIVA", LocalDate.of(2000, 1, 1),
                "Comércio", "São Paulo", "SP", "01001000"));
    }

    @Test
    @DisplayName("Empresa só vê os documentos depois de aceitar a proposta; cada link fica registrado")
    void fluxo() throws Exception {
        String empresaId = JsonPath.read(mvc.perform(post("/api/empresas").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"cnpj": "70010863396878", "tipo": "EMBARCADOR", "telefone": "1133334444",
                                 "responsavel": {"cpf": "25308642095", "nome": "Responsável",
                                                 "email": "docs@empresa.com", "senha": "senhaForte1",
                                                 "telefone": "11999998888"}}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        RequestPostProcessor empresa = Login.como(mvc, "docs@empresa.com");
        String motoristaId = cadastrarMotorista("26074074194", "docs@email.com", "DOC1A11");
        cadastrarMotorista("26839506240", "intruso@email.com", "INT1A11");
        RequestPostProcessor motorista = Login.como(mvc, "docs@email.com");
        RequestPostProcessor intruso = Login.como(mvc, "intruso@email.com");
        String veiculoId = JsonPath.read(mvc.perform(post("/api/motoristas/{id}/veiculos", motoristaId).with(motorista)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"placa": "DOC2B22", "rntrc": "12345678", "tipo": "TRUCK", "carroceria": "BAU",
                                 "numeroEixos": 3, "rastreador": false}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        String freteId = JsonPath.read(mvc.perform(post("/api/fretes/empresa/{id}", empresaId).with(empresa)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"coleta": {"cep": "01001-000"}, "entrega": {"cep": "01310-100"},
                                 "descricaoCarga": "Caixas", "especieCarga": "Diversos", "tipoCargaAntt": "CARGA_GERAL",
                                 "pesoKg": 5000, "valor": 2500.00, "dataColeta": "2099-03-10"}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        String propostaId = JsonPath.read(mvc.perform(post("/api/fretes/{id}/propostas", freteId).with(motorista)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"veiculoId": "%s", "valor": 2400.00, "adiantamentoPercentual": 30}"""
                                .formatted(veiculoId)))
                .andReturn().getResponse().getContentAsString(), "$.id");

        // Quem não negocia o frete não envia documento para ele.
        mvc.perform(multipart("/api/fretes/{id}/documentos", freteId).file(arquivo(PNG)).param("tipo", "CNH")
                        .with(intruso))
                .andExpect(status().isForbidden());
        // Conteúdo que não é PDF/PNG/JPEG é recusado, mesmo declarando image/png.
        mvc.perform(multipart("/api/fretes/{id}/documentos", freteId).file(arquivo("texto".getBytes()))
                        .param("tipo", "CNH").with(motorista))
                .andExpect(status().isUnprocessableContent());

        String documentoId = JsonPath.read(mvc.perform(multipart("/api/fretes/{id}/documentos", freteId)
                        .file(arquivo(PNG)).param("tipo", "CNH").with(motorista))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contentType").value("image/png"))
                .andReturn().getResponse().getContentAsString(), "$.id");

        // Antes do aceite, a empresa não vê nada.
        mvc.perform(get("/api/fretes/{id}/documentos", freteId).with(empresa))
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(post("/api/documentos/{id}/link", documentoId).with(empresa))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/propostas/{id}/aceite", propostaId).with(empresa)).andExpect(status().isOk());

        mvc.perform(get("/api/fretes/{id}/documentos", freteId).with(empresa))
                .andExpect(jsonPath("$.length()").value(1));
        String url = JsonPath.read(mvc.perform(post("/api/documentos/{id}/link", documentoId).with(empresa))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expiraEm").exists())
                .andReturn().getResponse().getContentAsString(), "$.url");

        // O link abre sem login (a permissão foi conferida ao gerá-lo) e devolve o arquivo.
        String caminho = URI.create(url).getPath();
        mvc.perform(get(caminho))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(PNG));
        mvc.perform(get(caminho.substring(0, caminho.length() - 2) + "xx")).andExpect(status().isNotFound());

        mvc.perform(get("/api/documentos/{id}/acessos", documentoId).with(motorista))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].papel").value("EMPRESA"));
        mvc.perform(get("/api/documentos/{id}/acessos", documentoId).with(empresa))
                .andExpect(status().isForbidden());

        RequestPostProcessor admin = Login.como(mvc, "admin.docs@fretai.dev", "senhaDoAdmin123");
        mvc.perform(post("/api/documentos/{id}/verificacao", documentoId).with(motorista))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/documentos/{id}/verificacao", documentoId).with(admin))
                .andExpect(jsonPath("$.verificado").value(true));
        mvc.perform(get("/api/motoristas/{id}/perfil", motoristaId).with(empresa))
                .andExpect(jsonPath("$.documentosVerificados[0]").value("CNH"));
    }

    private static MockMultipartFile arquivo(byte[] conteudo) {
        return new MockMultipartFile("arquivo", "cnh.png", "image/png", conteudo);
    }

    private String cadastrarMotorista(String cpf, String email, String placa) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Motorista", "email": "%s", "senha": "senhaForte1",
                         "telefone": "11988887777", "tipoVeiculo": "CAMINHAO", "placa": "%s"}
                        """.formatted(cpf, email, placa)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id");
    }
}
