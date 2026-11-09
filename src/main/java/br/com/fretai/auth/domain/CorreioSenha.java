package br.com.fretai.auth.domain;

/** Entrega o link de senha nova a quem pediu. Hoje só há a implementação que escreve no log. */
public interface CorreioSenha {

    /** @param link endereço da tela de senha nova, com o token de uso único */
    void enviarLink(String email, String nome, String link);
}
