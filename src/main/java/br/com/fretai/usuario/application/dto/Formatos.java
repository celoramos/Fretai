package br.com.fretai.usuario.application.dto;

final class Formatos {

    /** (11) 98888-7777, 11988887777, +55 11 98888-7777... */
    static final String TELEFONE = "^(\\+?55)?\\s?\\(?\\d{2}\\)?\\s?9?\\d{4}-?\\d{4}$";

    /** Placa antiga (ABC-1234) ou Mercosul (ABC1D23), com ou sem hífen. */
    static final String PLACA = "^[A-Za-z]{3}-?\\d[A-Za-z0-9]\\d{2}$";

    private Formatos() {
    }
}
