package br.com.fretai.calendario.domain;

import java.time.LocalDate;

/** Feriado nacional. Estaduais e municipais ainda não entram. */
public record Feriado(LocalDate data, String nome) {
}
