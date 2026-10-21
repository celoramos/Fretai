package br.com.fretai.shared.seguranca;

/**
 * O que cada usuário pode fazer na plataforma. Fica em {@code shared} porque
 * todos os módulos precisam saber quem está chamando, e nenhum deles pode
 * depender do módulo de autenticação.
 */
public enum Papel {
    /** Pessoa física que contrata frete pontual (fluxo original do Fretai). */
    CLIENTE,
    /** Pessoa que opera a conta de uma empresa (embarcador ou agenciador). */
    EMPRESA,
    MOTORISTA,
    ADMIN
}
