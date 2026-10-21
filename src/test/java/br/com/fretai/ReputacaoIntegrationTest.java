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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Avaliação bidirecional e perfis")
class ReputacaoIntegrationTest {

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
                i.getArgument(0), "Avaliada Ltda", null, "ATIVA", LocalDate.of(2000, 1, 1),
                "Comércio", "São Paulo", "SP", "01001000"));
    }

    @Test
    @DisplayName("Depois da entrega, cada lado avalia uma vez; perfis mostram média e fretes concluídos")
    void avaliacaoEPerfis() throws Exception {
        String empresaId = JsonPath.read(mvc.perform(post("/api/empresas").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"cnpj": "70009505472290", "tipo": "EMBARCADOR", "telefone": "1133334444",
                                 "responsavel": {"cpf": "23777777838", "nome": "Responsável",
                                                 "email": "avaliada@empresa.com", "senha": "senhaForte1",
                                                 "telefone": "11999998888"}}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        RequestPostProcessor empresa = Login.como(mvc, "avaliada@empresa.com");
        String motoristaId = JsonPath.read(mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"cpf": "24543209915", "nome": "Avaliado", "email": "avaliado@email.com",
                                 "senha": "senhaForte1", "telefone": "11988887777", "tipoVeiculo": "CAMINHAO",
                                 "placa": "AVA1A11"}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        RequestPostProcessor motorista = Login.como(mvc, "avaliado@email.com");
        String veiculoId = JsonPath.read(mvc.perform(post("/api/motoristas/{id}/veiculos", motoristaId).with(motorista)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"placa": "AVA2B22", "rntrc": "12345678", "tipo": "TRUCK", "carroceria": "BAU",
                                 "numeroEixos": 3, "rastreador": false}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");
        String freteId = JsonPath.read(mvc.perform(post("/api/fretes/empresa/{id}", empresaId).with(empresa)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"coleta": {"cep": "01001-000"}, "entrega": {"cep": "01310-100"},
                                 "descricaoCarga": "Caixas", "especieCarga": "Diversos", "tipoCargaAntt": "CARGA_GERAL",
                                 "pesoKg": 5000, "valor": 2500.00, "dataColeta": "2099-03-10"}"""))
                .andReturn().getResponse().getContentAsString(), "$.id");

        mvc.perform(post("/api/fretes/{id}/aceite", freteId).with(motorista).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motoristaId\": \"%s\", \"veiculoId\": \"%s\"}".formatted(motoristaId, veiculoId)))
                .andExpect(status().isOk());

        // Antes da entrega, não.
        mvc.perform(post("/api/fretes/{id}/avaliacoes", freteId).with(empresa).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nota\": 5}"))
                .andExpect(status().isUnprocessableContent());

        mvc.perform(post("/api/fretes/{id}/inicio", freteId).with(motorista)).andExpect(status().isOk());
        mvc.perform(post("/api/fretes/{id}/conclusao", freteId).with(motorista)).andExpect(status().isOk());

        mvc.perform(post("/api/fretes/{id}/avaliacoes", freteId).with(empresa).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nota\": 5, \"comentario\": \"Pontual e cuidadoso.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lado").value("CONTRATANTE"))
                .andExpect(jsonPath("$.avaliadoTipo").value("MOTORISTA"));
        mvc.perform(post("/api/fretes/{id}/avaliacoes", freteId).with(motorista).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nota\": 4}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.avaliadoTipo").value("EMPRESA"));
        mvc.perform(post("/api/fretes/{id}/avaliacoes", freteId).with(motorista).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nota\": 1}"))
                .andExpect(status().isConflict());

        mvc.perform(get("/api/empresas/{id}/perfil", empresaId).with(motorista))
                .andExpect(jsonPath("$.mediaNotas").value(4.0))
                .andExpect(jsonPath("$.fretesPublicados").value(1))
                .andExpect(jsonPath("$.fretesConcluidos").value(1));
        mvc.perform(get("/api/motoristas/{id}/perfil", motoristaId).with(empresa))
                .andExpect(jsonPath("$.mediaNotas").value(5.0))
                .andExpect(jsonPath("$.fretesConcluidos").value(1))
                .andExpect(jsonPath("$.cpf").doesNotExist());
        mvc.perform(get("/api/motoristas/{id}/avaliacoes", motoristaId).with(empresa))
                .andExpect(jsonPath("$.content[0].comentario").value("Pontual e cuidadoso."));
    }
}
