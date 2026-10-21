package br.com.fretai.notificacao.domain;

import java.util.List;

/**
 * Porta de saída para avisar as pessoas. Duas implementações:
 * <ul>
 *   <li>{@code LogNotificador} (padrão): só escreve no log;</li>
 *   <li>{@code WhatsAppCloudNotificador}: Meta WhatsApp Cloud API, com {@code fretai.whatsapp.habilitado=true}.</li>
 * </ul>
 * Notificar nunca pode derrubar o fluxo principal: quem chama trata falhas como aviso.
 */
public interface Notificador {

    void enviar(Mensagem mensagem);

    /**
     * @param telefone   só dígitos, com DDD (o código do país é acrescentado na hora de enviar)
     * @param texto      a mensagem pronta, para canais de texto livre (log, SMS)
     * @param parametros os valores variáveis, na ordem do template aprovado no WhatsApp
     */
    record Mensagem(String telefone, TipoNotificacao tipo, String texto, List<String> parametros) {
    }
}
