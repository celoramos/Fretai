package br.com.fretai.empresa.application.dto;

import br.com.fretai.usuario.application.dto.Formatos;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CPF;

/** A pessoa que vai fazer login pela empresa. Mesmas regras do cadastro de cliente e motorista. */
public record ResponsavelRequest(
        @NotBlank(message = "O CPF é obrigatório.")
        @CPF(message = "CPF inválido.")
        String cpf,

        @NotBlank(message = "O nome é obrigatório.")
        @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.")
        String nome,

        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "Formato de e-mail inválido.")
        String email,

        @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.")
        String senha,

        @NotBlank(message = "O telefone é obrigatório.")
        @Pattern(regexp = Formatos.TELEFONE, message = "Telefone inválido. Use DDD + número.")
        String telefone,

        /** ID token do botão do Google. Com ele a conta nasce sem senha e o e-mail vem do Google. */
        String credencialGoogle) {

    @AssertTrue(message = "Crie uma senha ou entre com o Google.")
    public boolean isSenhaOuGoogle() {
        return (senha != null && !senha.isBlank()) != (credencialGoogle != null && !credencialGoogle.isBlank());
    }
}
