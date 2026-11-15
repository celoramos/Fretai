package br.com.fretai.auth.domain;

/**
 * Entrega o link de senha nova a quem pediu: por e-mail (SMTP) ou, em desenvolvimento, no log.
 * Uma falha na entrega não pode virar erro para quem chamou: a resposta do pedido de link é a mesma
 * exista a conta ou não.
 */
public interface CorreioSenha {

    /** @param link endereço da tela de senha nova, com o token de uso único */
    void enviarLink(String email, String nome, String link);
}
