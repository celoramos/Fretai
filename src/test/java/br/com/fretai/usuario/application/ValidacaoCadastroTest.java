package br.com.fretai.usuario.application;

import br.com.fretai.usuario.application.dto.CadastroClienteRequest;
import br.com.fretai.usuario.application.dto.CadastroMotoristaRequest;
import br.com.fretai.usuario.domain.TipoVeiculo;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Set;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Os casos que antes testavam VerificarCPF/VerificarEmail agora testam as
 * anotações dos DTOs de cadastro, que é o que de fato protege a API.
 */
@DisplayName("Validação dos dados de cadastro")
class ValidacaoCadastroTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void criarValidator() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void fecharValidator() {
        factory.close();
    }

    private static CadastroClienteRequest clienteCom(String cpf, String email) {
        return new CadastroClienteRequest(cpf, "Carlos Silva", email, "senhaForte1", "(11) 99999-8888");
    }

    private static Set<String> camposInvalidos(Object request) {
        Set<ConstraintViolation<Object>> violacoes = validator.validate(request);
        return violacoes.stream().map(v -> v.getPropertyPath().toString())
                .collect(java.util.stream.Collectors.toSet());
    }

    @Test
    @DisplayName("Cadastro completo e correto não tem erros")
    void cadastroValido() {
        assertTrue(camposInvalidos(clienteCom("52998224725", "carlos@email.com")).isEmpty());
    }

    @ParameterizedTest(name = "CPF válido: {0}")
    @ValueSource(strings = {"52998224725", "529.982.247-25", "11144477735", "111.444.777-35",
            "12345678909", "123.456.789-09", "06390199007", "063.901.990-07"})
    void aceitaCpfValido(String cpf) {
        assertFalse(camposInvalidos(clienteCom(cpf, "a@b.com")).contains("cpf"));
    }

    @ParameterizedTest(name = "CPF inválido: \"{0}\"")
    @ValueSource(strings = {
            "00000000000", "11111111111", "99999999999", "111.111.111-11", // dígitos repetidos
            "52998224724", "52998224715", "11144477730", "12345678900",   // dígito verificador errado
            "   ", "123", "123456789", "123456789012", "abcdefghijk", "529.982.24A-25"})
    void rejeitaCpfInvalido(String cpf) {
        assertTrue(camposInvalidos(clienteCom(cpf, "a@b.com")).contains("cpf"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    void rejeitaCpfAusente(String cpf) {
        assertTrue(camposInvalidos(clienteCom(cpf, "a@b.com")).contains("cpf"));
    }

    @ParameterizedTest(name = "E-mail inválido: \"{0}\"")
    @ValueSource(strings = {"", "sem-arroba.com", "@dominio.com", "nome@", "nome@@dominio.com"})
    void rejeitaEmailInvalido(String email) {
        assertTrue(camposInvalidos(clienteCom("52998224725", email)).contains("email"));
    }

    @ParameterizedTest(name = "Placa válida: {0}")
    @ValueSource(strings = {"ABC1234", "ABC-1234", "ABC1D23", "abc1d23"})
    void aceitaPlaca(String placa) {
        var motorista = new CadastroMotoristaRequest("11144477735", "Marcos", "m@email.com", "senhaForte1",
                "11988887777", TipoVeiculo.VAN, placa);
        assertTrue(camposInvalidos(motorista).isEmpty());
    }

    @ParameterizedTest(name = "Placa inválida: {0}")
    @ValueSource(strings = {"AB1234", "ABCD123", "1234ABC", "ABC12"})
    void rejeitaPlaca(String placa) {
        var motorista = new CadastroMotoristaRequest("11144477735", "Marcos", "m@email.com", "senhaForte1",
                "11988887777", TipoVeiculo.VAN, placa);
        assertTrue(camposInvalidos(motorista).contains("placa"));
    }
}
