package br.com.Fretai.Verificacoes;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes de Validação de E-mail")
class VerificarEmailTest {

    @ParameterizedTest(name = "E-mail válido: {0}")
    @ValueSource(strings = {
            "cliente@fretai.com.br",
            "usuario.teste@gmail.com",
            "contato+marketing@empresa.org",
            "dev_123@sub.dominio.net"
    })
    void deveValidarEmailsValidos(String email) {
        assertTrue(VerificarEmail.isValido(email));
        assertTrue(new VerificarEmail(email).isEmailValid());
    }

    @ParameterizedTest(name = "E-mail inválido: {0}")
    @ValueSource(strings = {
            "email_sem_arroba.com",
            "usuario@",
            "@dominio.com",
            "usuario@.com",
            "usuario@dominio",
            "usuario com espaco@email.com",
            "",
            "   "
    })
    void deveRejeitarEmailsInvalidos(String email) {
        assertFalse(VerificarEmail.isValido(email));
        assertFalse(new VerificarEmail(email).isEmailValid());
    }

    @Test
    void deveRetornarFalseParaEmailNulo() {
        assertFalse(VerificarEmail.isValido(null));
        assertFalse(new VerificarEmail(null).isEmailValid());
    }
}
