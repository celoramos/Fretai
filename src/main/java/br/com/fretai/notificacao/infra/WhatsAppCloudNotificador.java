package br.com.fretai.notificacao.infra;

import br.com.fretai.notificacao.domain.Notificador;
import br.com.fretai.shared.infra.RestClients;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Meta WhatsApp Cloud API. Mensagem iniciada pela empresa só pode usar
 * template aprovado no WhatsApp Manager; o nome de cada template vem de
 * {@code fretai.whatsapp.templates.<TIPO>} e os parâmetros vão no corpo dele.
 *
 * Escrito a partir da documentação pública da Cloud API, sem teste contra a
 * Meta (exige número verificado e templates aprovados).
 */
@Component
@ConditionalOnProperty(name = "fretai.whatsapp.habilitado", havingValue = "true")
class WhatsAppCloudNotificador implements Notificador {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppCloudNotificador.class);

    private final RestClient api;
    private final String phoneNumberId;
    private final String idioma;
    private final Map<String, String> templates;

    WhatsAppCloudNotificador(@Value("${fretai.whatsapp.url}") String url,
                             @Value("${fretai.whatsapp.token}") String token,
                             @Value("${fretai.whatsapp.phone-number-id}") String phoneNumberId,
                             @Value("${fretai.whatsapp.idioma:pt_BR}") String idioma,
                             @Value("${fretai.whatsapp.timeout:5s}") Duration timeout,
                             Environment ambiente) {
        if (token.isBlank() || phoneNumberId.isBlank()) {
            throw new IllegalStateException("Defina WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID para ligar o WhatsApp.");
        }
        this.api = RestClients.comTimeout(url, timeout)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        this.phoneNumberId = phoneNumberId;
        this.idioma = idioma;
        this.templates = Binder.get(ambiente).bindOrCreate("fretai.whatsapp.templates",
                Bindable.mapOf(String.class, String.class));
    }

    @Override
    public void enviar(Mensagem mensagem) {
        String template = templates.get(mensagem.tipo().name());
        if (template == null) {
            log.warn("Sem template configurado para {}; mensagem não enviada.", mensagem.tipo());
            return;
        }
        Map<String, Object> corpo = Map.of(
                "messaging_product", "whatsapp",
                "to", "55" + mensagem.telefone(),
                "type", "template",
                "template", Map.of(
                        "name", template,
                        "language", Map.of("code", idioma),
                        "components", List.of(Map.of("type", "body", "parameters", parametros(mensagem)))));
        try {
            api.post().uri("/{id}/messages", phoneNumberId).body(corpo).retrieve().toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("WhatsApp recusou a mensagem {}: {}", mensagem.tipo(), e.getMessage());
        }
    }

    private static List<Map<String, String>> parametros(Mensagem m) {
        return m.parametros().stream().map(p -> Map.of("type", "text", "text", p)).toList();
    }
}
