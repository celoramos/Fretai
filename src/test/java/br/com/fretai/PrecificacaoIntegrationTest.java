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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Piso e alertas no frete publicado. Rota MT → PA, que nenhum outro teste usa,
 * para a média das "rotas parecidas" depender só dos fretes daqui.
 */
@SpringBootTest(properties = {
        "fretai.admin.email=admin.preco@fretai.dev", "fretai.admin.senha=senhaDoAdmin123",
        "fretai.admin.cpf=23012345760"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Piso ANTT e alertas de preço nos fretes")
class PrecificacaoIntegrationTest {

    @Autowired private MockMvc mvc;

    @MockitoBean private EnderecoGateway enderecoGateway;
    @MockitoBean private GeocodificacaoGateway geocodificacaoGateway;
    @MockitoBean private RotaGateway rotaGateway;
    @MockitoBean private FeriadoGateway feriadoGateway;
    @MockitoBean private EmpresaGateway empresaGateway;

    // Estáticos: o JUnit cria uma instância por teste, e a empresa é cadastrada uma vez só.
    private static RequestPostProcessor empresa;
    private static String empresaId;

    @BeforeEach
    void preparar() throws Exception {
        when(feriadoGateway.nacionaisDoAno(anyInt())).thenReturn(List.of());
        when(enderecoGateway.buscarPorCep("78005-000"))
                .thenReturn(new Endereco("78005-000", "Av. Getúlio Vargas", "Centro", "Cuiabá", "MT"));
        when(enderecoGateway.buscarPorCep("66010-000"))
                .thenReturn(new Endereco("66010-000", "Av. Presidente Vargas", "Campina", "Belém", "PA"));
        when(geocodificacaoGateway.localizar(any(), any())).thenReturn(Optional.empty());
        when(rotaGateway.calcular(any(), any())).thenReturn(new Rota(new BigDecimal("2000"), false));
        when(empresaGateway.buscarPorCnpj(anyString())).thenAnswer(i -> new DadosCnpj(
                i.getArgument(0), "Grãos do Norte Ltda", null, "ATIVA", LocalDate.of(2000, 1, 1),
                "Comércio de grãos", "Cuiabá", "MT", "78005000"));
        if (empresa == null) {
            empresaId = JsonPath.read(mvc.perform(post("/api/empresas").contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"cnpj": "70008147547650", "tipo": "EMBARCADOR", "telefone": "6533334444",
                                     "responsavel": {"cpf": "21481481509", "nome": "Responsável",
                                                     "email": "graos@empresa.com", "senha": "senhaForte1",
                                                     "telefone": "65999998888"}}"""))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString(), "$.id");
            empresa = Login.como(mvc, "graos@empresa.com");
        }
    }

    @Test
    @DisplayName("Piso calculado com os coeficientes de EXEMPLO e o menor eixo aceito; abaixo dele, alerta")
    void piso() throws Exception {
        // Carreta = 5 eixos. Coeficientes de exemplo para 5 eixos: CCD 3,50 e CC 350,00.
        // 2000 km × 3,50 + 350 = 7.350,00.
        mvc.perform(post("/api/fretes/empresa/{id}", empresaId).with(empresa)
                        .contentType(MediaType.APPLICATION_JSON).content(frete("5000.00", "GRANEL_SOLIDO")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.preco.pisoMinimo").value(7350.00))
                .andExpect(jsonPath("$.preco.eixosConsiderados").value(5))
                .andExpect(jsonPath("$.preco.coeficientesDeExemplo").value(true))
                .andExpect(jsonPath("$.preco.abaixoDoPiso").value(true));
    }

    @Test
    @DisplayName("Com 5 fretes parecidos a ~R$ 5/km, um de R$ 25/km é marcado como suspeito")
    void fretao() throws Exception {
        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/fretes/empresa/{id}", empresaId).with(empresa)
                            .contentType(MediaType.APPLICATION_JSON).content(frete("10000.00", "NEOGRANEL")))
                    .andExpect(jsonPath("$.preco.acimaDaMedia").value(false));
        }
        mvc.perform(post("/api/fretes/empresa/{id}", empresaId).with(empresa)
                        .contentType(MediaType.APPLICATION_JSON).content(frete("50000.00", "NEOGRANEL")))
                .andExpect(jsonPath("$.preco.acimaDaMedia").value(true))
                .andExpect(jsonPath("$.preco.mediaRotaPorKm").exists());
    }

    @Test
    @DisplayName("Só o administrador atualiza a tabela; com a fonte preenchida, o piso deixa de ser exemplo")
    void tabelaEditavel() throws Exception {
        String coeficiente = """
                {"ccd": 2.5, "cc": 200.00, "fonte": "Tabela de teste"}""";
        mvc.perform(put("/api/piso-antt/CONTEINERIZADA/5").with(empresa).contentType(MediaType.APPLICATION_JSON)
                        .content(coeficiente))
                .andExpect(status().isForbidden());

        RequestPostProcessor admin = Login.como(mvc, "admin.preco@fretai.dev", "senhaDoAdmin123");
        mvc.perform(put("/api/piso-antt/CONTEINERIZADA/5").with(admin).contentType(MediaType.APPLICATION_JSON)
                        .content(coeficiente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exemplo").value(false));

        mvc.perform(post("/api/fretes/empresa/{id}", empresaId).with(empresa)
                        .contentType(MediaType.APPLICATION_JSON).content(frete("9000.00", "CONTEINERIZADA")))
                .andExpect(jsonPath("$.preco.pisoMinimo").value(5200.00))
                .andExpect(jsonPath("$.preco.coeficientesDeExemplo").value(false))
                .andExpect(jsonPath("$.preco.abaixoDoPiso").value(false));
    }

    @Test
    @DisplayName("Calculadora: custo da viagem, piso e margem")
    void calculadora() throws Exception {
        mvc.perform(post("/api/calculadora/frete").with(empresa).contentType(MediaType.APPLICATION_JSON).content("""
                        {"distanciaKm": 1000, "consumoKmPorLitro": 2.5, "precoDieselLitro": 6.00,
                         "pedagio": 300, "outrosCustos": 100, "tipoCargaAntt": "CARGA_GERAL", "numeroEixos": 2,
                         "valorOferecido": 3000}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.custo.combustivel").value(2400.00))
                .andExpect(jsonPath("$.custo.total").value(2800.00))
                .andExpect(jsonPath("$.margem").value(200.00))
                // Exemplo, 2 eixos: 1000 × 2,00 + 200 = 2.200,00.
                .andExpect(jsonPath("$.piso.valor").value(2200.00))
                .andExpect(jsonPath("$.abaixoDoPiso").value(false));

        mvc.perform(get("/api/piso-antt").with(empresa))
                .andExpect(jsonPath("$.length()").value(84));
    }

    private static String frete(String valor, String tipoCarga) {
        return """
                {"coleta":  {"cep": "78005-000", "latitude": -15.60, "longitude": -56.10},
                 "entrega": {"cep": "66010-000", "latitude": -1.45, "longitude": -48.50},
                 "descricaoCarga": "Carga de teste", "especieCarga": "Grãos", "tipoCargaAntt": "%s",
                 "pesoKg": 30000, "valor": %s, "dataColeta": "2099-03-10", "veiculosAceitos": ["CARRETA", "BITREM"]}
                """.formatted(tipoCarga, valor);
    }
}
