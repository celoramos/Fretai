package br.com.fretai.notificacao.infra;

import br.com.fretai.notificacao.domain.Notificador;
import br.com.fretai.notificacao.domain.TipoNotificacao;
import br.com.fretai.support.ServidorHttpFalso;
import com.jayway.jsonpath.JsonPath;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("WhatsApp Cloud API: o que sai para a Meta")
class WhatsAppCloudNotificadorTest {

    private final ServidorHttpFalso servidor = new ServidorHttpFalso();

    @AfterEach
    void parar() {
        servidor.close();
    }

    private WhatsAppCloudNotificador notificador() {
        MockEnvironment ambiente = new MockEnvironment()
                .withProperty("fretai.whatsapp.templates.ENTREGA_REGISTRADA", "fretai_entrega");
        return new WhatsAppCloudNotificador(servidor.url(), "token-de-teste", "123456", "pt_BR", Duration.ofSeconds(2), ambiente);
    }

    private static Notificador.Mensagem entregaPara(String telefone) {
        return new Notificador.Mensagem(telefone, TipoNotificacao.ENTREGA_REGISTRADA, "texto livre",
                List.of("São Paulo/SP → Rio de Janeiro/RJ", "10/11 às 14:00", "HK7M4PXR"));
    }

    @Test
    @DisplayName("O número vai com o 55 uma vez só, do jeito que o telefone tiver sido digitado ou guardado")
    void destinatarioComCodigoDoPais() {
        for (String telefone : List.of("(21) 97777-6666", "21977776666", "+55 21 97777-6666", "5521977776666")) {
            notificador().enviar(entregaPara(telefone));
            assertEquals("5521977776666", JsonPath.read(servidor.ultimoCorpo(), "$.to"), telefone);
        }
    }

    @Test
    @DisplayName("Manda o template do tipo, no idioma configurado, com os parâmetros na ordem")
    void templateEParametros() {
        notificador().enviar(entregaPara("21977776666"));

        assertEquals("/123456/messages", servidor.requisicoes().getFirst().getPath());
        String corpo = servidor.ultimoCorpo();
        assertEquals("whatsapp", JsonPath.read(corpo, "$.messaging_product"));
        assertEquals("fretai_entrega", JsonPath.read(corpo, "$.template.name"));
        assertEquals("pt_BR", JsonPath.read(corpo, "$.template.language.code"));
        List<String> parametros = JsonPath.read(corpo, "$.template.components[0].parameters[*].text");
        assertEquals(List.of("São Paulo/SP → Rio de Janeiro/RJ", "10/11 às 14:00", "HK7M4PXR"), parametros);
    }

    @Test
    @DisplayName("Tipo sem template configurado não chama a Meta")
    void semTemplate() {
        notificador().enviar(new Notificador.Mensagem("21977776666", TipoNotificacao.FRETE_PERTO, "texto", List.of("a", "b")));

        assertTrue(servidor.requisicoes().isEmpty());
    }
}
