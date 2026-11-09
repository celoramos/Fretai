package br.com.fretai.frete.application.dto;

import java.util.UUID;

/** @param url link assinado que expira, como o da foto do canhoto */
public record FotoCargaResponse(UUID id, String url) {
}
