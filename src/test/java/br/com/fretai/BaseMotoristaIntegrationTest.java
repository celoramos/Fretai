package br.com.fretai;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.endereco.domain.Endereco;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.support.Login;
import com.jayway.jsonpath.JsonPath;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** A base dos avisos de frete novo: pela localização do celular ou pelo CEP. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Base do motorista via HTTP")
class BaseMotoristaIntegrationTest {

    @Autowired private MockMvc mvc;
    @Autowired private JdbcTemplate jdbc;

    @MockitoBean private EnderecoGateway enderecoGateway;
    @MockitoBean private GeocodificacaoGateway geocodificacaoGateway;

    @Test
    @DisplayName("Base pelo CEP: vira a coordenada do CEP")
    void baseComCep() throws Exception {
        when(enderecoGateway.buscarPorCep(anyString()))
                .thenReturn(new Endereco("41810-000", "Av. Paulo VI", "Pituba", "Salvador", "BA"));
        when(geocodificacaoGateway.localizar(any(), any())).thenReturn(Optional.of(new Coordenadas(-12.9935, -38.4562)));
        String id = cadastrarMotorista("14142135651", "base.cep@email.com", "BAS1A11");

        definirBase(id, "base.cep@email.com", "{\"cep\": \"41810-000\", \"raioKm\": 25}").andExpect(status().isOk());

        Map<String, Object> base = jdbc.queryForMap(
                "SELECT base_latitude, base_longitude, raio_interesse_km FROM motorista WHERE id = ?", UUID.fromString(id));
        assertEquals(-12.9935, ((Number) base.get("base_latitude")).doubleValue(), 1e-6);
        assertEquals(-38.4562, ((Number) base.get("base_longitude")).doubleValue(), 1e-6);
        assertEquals(25, ((Number) base.get("raio_interesse_km")).intValue());
    }

    @Test
    @DisplayName("Sem CEP nem coordenada: 400")
    void baseSemCepNemCoordenada() throws Exception {
        String id = cadastrarMotorista("14142135732", "base.vazia@email.com", "BAS2B22");
        definirBase(id, "base.vazia@email.com", "{\"raioKm\": 25}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.origemInformada").value("Informe o CEP ou use a sua localização."));
    }

    @Test
    @DisplayName("CEP com menos de 8 números: 400 no campo")
    void cepIncompleto() throws Exception {
        String id = cadastrarMotorista("14142135813", "base.curta@email.com", "BAS3C33");
        definirBase(id, "base.curta@email.com", "{\"cep\": \"4181000\", \"raioKm\": 25}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erros.cep").value("Digite os 8 números do CEP."));
    }

    private ResultActions definirBase(String id, String email, String corpo) throws Exception {
        return mvc.perform(put("/api/motoristas/{id}/base", id).with(Login.como(mvc, email))
                .contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    private String cadastrarMotorista(String cpf, String email, String placa) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/motoristas").contentType(MediaType.APPLICATION_JSON).content("""
                        {"cpf": "%s", "nome": "Edvaldo Santos", "email": "%s", "senha": "senhaForte1",
                         "telefone": "71988771234", "tipoVeiculo": "VAN", "placa": "%s"}
                        """.formatted(cpf, email, placa)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(), "$.id");
    }
}
