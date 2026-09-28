package br.com.fretai.calendario.application.dto;

import java.time.LocalDate;

/** @param diaUtil nem feriado nacional nem domingo (sábado conta como útil para frete). */
public record VerificacaoDataResponse(LocalDate data, boolean feriado, String nomeFeriado,
                                      boolean domingo, boolean diaUtil) {
}
