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

        /**
         * Quem cria a mensagem passa o telefone como está guardado: o do cadastro vem só com dígitos, mas
         * com o 55 na frente quando foi digitado "+55 71 ..."; o de quem recebe a carga vem como a pessoa
         * digitou no pedido. Aqui ele vira o que o parâmetro promete, para nenhum canal ter de adivinhar.
         */
        public Mensagem {
            telefone = dddENumero(telefone);
        }

        private static String dddENumero(String telefone) {
            if (telefone == null) {
                return null;
            }
            String digitos = telefone.replaceAll("\\D", "");
            // DDD + número tem 10 ou 11 dígitos. Com 12 ou 13 começando em 55, o 55 é o código do país;
            // com menos, 55 é o DDD (interior do Rio Grande do Sul) e fica.
            return digitos.length() >= 12 && digitos.startsWith("55") ? digitos.substring(2) : digitos;
        }
    }
}
