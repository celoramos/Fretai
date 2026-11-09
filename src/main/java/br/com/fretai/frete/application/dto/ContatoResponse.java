package br.com.fretai.frete.application.dto;

/** Quem está do outro lado do frete, para o botão de WhatsApp. Só sai da API depois do aceite. */
public record ContatoResponse(String nome, String telefone) {
}
