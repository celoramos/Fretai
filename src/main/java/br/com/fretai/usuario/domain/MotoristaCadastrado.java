package br.com.fretai.usuario.domain;

import java.util.UUID;

/**
 * Publicado no cadastro do motorista, ainda dentro da transação. O módulo de veículos ouve e cria o
 * primeiro veículo com o tipo e a placa do cadastro: veículo já depende de usuário, e usuário chamar
 * veículo direto criaria um ciclo entre os módulos.
 */
public record MotoristaCadastrado(UUID motoristaId, CategoriaVeiculo categoria, String placa) {
}
