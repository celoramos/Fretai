package br.com.fretai;

import br.com.fretai.support.Login;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** O veículo de quem faz frete de pessoa física: tipo, modelo e placa bastam; dados de caminhão são opcionais. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Veículos do motorista via HTTP")
class VeiculoIntegrationTest {

    @Autowired private MockMvc mvc;

    @Test
    @DisplayName("Cadastro só com tipo, modelo e placa")
    void cadastroSoComCategoriaModeloEPlaca() throws Exception {
        String id = cadastrarMotorista("27182818205", "veic1@email.com", "VEI0A01", "VAN");
        mvc.perform(post("/api/motoristas/{id}/veiculos", id).with(Login.como(mvc, "veic1@email.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"placa\": \"VEI1A11\", \"categoria\": \"VAN\", \"modelo\": \"Master\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.categoria").value("VAN"))
                .andExpect(jsonPath("$.modelo").value("Master"))
                .andExpect(jsonPath("$.rntrc").doesNotExist());
    }

    @Test
    @DisplayName("Sem o tipo do veículo: 400 no campo")
    void veiculoSemCategoria() throws Exception {
        String id = cadastrarMotorista("27182818396", "veic2@email.com", "VEI0B02", "UTILITARIO");
        mvc.perform(post("/api/motoristas/{id}/veiculos", id).with(Login.como(mvc, "veic2@email.com"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"placa\": \"VEI2B22\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.categoria").value("Escolha o tipo do veículo."));
    }

    @Test
    @DisplayName("RNTRC informado continua validado")
    void rntrcInvalidoQuandoInformado() throws Exception {
        String id = cadastrarMotorista("27182818477", "veic3@email.com", "VEI0C03", "CAMINHAO");
        mvc.perform(post("/api/motoristas/{id}/veiculos", id).with(Login.como(mvc, "veic3@email.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"placa\": \"VEI3C33\", \"categoria\": \"CAMINHAO\", \"rntrc\": \"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.rntrc").value("RNTRC inválido. Deve ter 8 ou 9 dígitos."));
    }

    @Test
    @DisplayName("O cadastro do motorista já cria o primeiro veículo, com o tipo e a placa do cadastro")
    void cadastroDoMotoristaJaTrazOVeiculo() throws Exception {
        String id = cadastrarMotorista("27182818558", "veic4@email.com", "PRI1A11", "VAN");
        mvc.perform(get("/api/motoristas/{id}/veiculos", id).with(Login.como(mvc, "veic4@email.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].categoria").value("VAN"))
                .andExpect(jsonPath("$[0].placa").value("PRI1A11"));
    }

    @Test
    @DisplayName("Placa que já é veículo de outro motorista não trava o cadastro: a conta sai sem veículo")
    void placaDeVeiculoJaUsadaNaoTravaOCadastro() throws Exception {
        String dono = cadastrarMotorista("27182818639", "veic5@email.com", "VEI0E05", "VAN");
        mvc.perform(post("/api/motoristas/{id}/veiculos", dono).with(Login.como(mvc, "veic5@email.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"placa\": \"DUP1A11\", \"categoria\": \"VAN\", \"modelo\": \"Ducato\"}"))
                .andExpect(status().isCreated());

        String outro = cadastrarMotorista("27182818710", "veic6@email.com", "DUP1A11", "VAN");
        RequestPostProcessor logado = Login.como(mvc, "veic6@email.com");
        mvc.perform(get("/api/motoristas/{id}/veiculos", outro).with(logado))
                .andExpect(jsonPath("$.length()").value(0));
    }

    private String cadastrarMotorista(String cpf, String email, String placa, String tipoVeiculo) throws Exception {
        String corpo = mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Edvaldo Santos", "email": "%s", "senha": "senhaForte1",
                         "telefone": "71988771234", "tipoVeiculo": "%s", "placa": "%s"}
                        """.formatted(cpf, email, tipoVeiculo, placa)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }
}
