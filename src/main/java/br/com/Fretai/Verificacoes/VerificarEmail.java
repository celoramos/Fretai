package br.com.Fretai.Verificacoes;

import org.hibernate.validator.internal.constraintvalidators.bv.EmailValidator;

public class VerificarEmail {

    private static final EmailValidator VALIDATOR = new EmailValidator();
    private String email;

    public VerificarEmail() {
    }

    public VerificarEmail(String email) {
        this.email = email;
    }

    public boolean isEmailValid() {
        return isValido(this.email);
    }

    public static boolean isValido(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }

        String emailTrimmed = email.trim();
        int atIndex = emailTrimmed.lastIndexOf('@');
        if (atIndex <= 0 || atIndex == emailTrimmed.length() - 1) {
            return false;
        }

        String domain = emailTrimmed.substring(atIndex + 1);
        if (!domain.contains(".") || domain.startsWith(".") || domain.endsWith(".")) {
            return false;
        }

        return VALIDATOR.isValid(emailTrimmed, null);
    }
}
