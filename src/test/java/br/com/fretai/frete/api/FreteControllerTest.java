package br.com.fretai.frete.api;

import br.com.fretai.endereco.domain.CepNaoEncontradoException;
import br.com.fretai.frete.application.FreteService;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Camada HTTP isolada: validação de entrada e tradução de exceção → status. */
@WebMvcTest(FreteController.class)
@DisplayName("API de fretes: validação e erros HTTP")
class FreteControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private FreteService freteService;

    private static final String PEDIDO_VALIDO = """
            {
              "clienteId": "%s",
              "coleta":  {"cep": "01001-000", "numero": "100"},
              "entrega": {"cep": "%s", "numero": "50"},
              "nomeDestinatario": "Ana Pereira",
              "telefoneDestinatario": "21977776666",
              "descricaoCarga": "Caixa",
              "pesoKg": 12,
              "valor": 180.00
            }
            """;

    @Test
    @DisplayName("Corpo inválido → 400 com a lista de campos")
    void corpoInvalido() throws Exception {
        mvc.perform(post("/api/fretes").contentType(MediaType.APPLICATION_JSON).content("""
                        {"coleta": {"cep": "123"}, "valor": -5}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Dados inválidos"))
                .andExpect(jsonPath("$.erros.clienteId").exists())
                .andExpect(jsonPath("$['erros']['coleta.cep']").exists())
                .andExpect(jsonPath("$.erros.valor").exists());
        verifyNoInteractions(freteService);
    }

    @Test
    @DisplayName("CEP inexistente → 422")
    void cepInexistente() throws Exception {
        when(freteService.solicitar(any())).thenThrow(new CepNaoEncontradoException("CEP não encontrado: 99999999"));

        mvc.perform(post("/api/fretes").contentType(MediaType.APPLICATION_JSON)
                        .content(PEDIDO_VALIDO.formatted(UUID.randomUUID(), "99999-999")))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value("CEP não encontrado: 99999999"));
    }

    @Test
    @DisplayName("Frete inexistente → 404")
    void freteInexistente() throws Exception {
        UUID id = UUID.randomUUID();
        when(freteService.buscar(id)).thenThrow(new RecursoNaoEncontradoException("Frete não encontrado."));

        mvc.perform(get("/api/fretes/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Transição inválida → 409")
    void transicaoInvalida() throws Exception {
        UUID id = UUID.randomUUID();
        when(freteService.concluirEntrega(id))
                .thenThrow(new IllegalStateException("Para concluir a entrega, a carga deve estar em trânsito."));

        mvc.perform(post("/api/fretes/{id}/conclusao", id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Para concluir a entrega, a carga deve estar em trânsito."));
    }

    @Test
    @DisplayName("Aceite concorrente → 409")
    void aceiteConcorrente() throws Exception {
        UUID id = UUID.randomUUID();
        when(freteService.aceitar(eq(id), any()))
                .thenThrow(new ObjectOptimisticLockingFailureException(Frete.class, id));

        mvc.perform(post("/api/fretes/{id}/aceite", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motoristaId\": \"%s\"}".formatted(UUID.randomUUID())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Alteração concorrente"));
    }

    @Test
    @DisplayName("ID malformado na URL → 400")
    void idMalformado() throws Exception {
        mvc.perform(get("/api/fretes/nao-e-uuid"))
                .andExpect(status().isBadRequest());
    }
}
