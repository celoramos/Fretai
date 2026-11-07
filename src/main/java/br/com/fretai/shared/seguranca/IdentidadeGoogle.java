package br.com.fretai.shared.seguranca;

/**
 * O que o Google garante sobre quem entrou: o identificador fixo da conta (sub), o e-mail já
 * verificado pelo Google e o nome do perfil (pode vir nulo).
 */
public record IdentidadeGoogle(String sub, String email, String nome) {
}
