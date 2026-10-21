package br.com.fretai.empresa.application.dto;

import br.com.fretai.empresa.domain.TipoEmpresa;
import br.com.fretai.usuario.application.dto.Formatos;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Razão social não vem no pedido: é lida da Receita pelo CNPJ, e só empresa
 * ativa entra. Isso já tira do caminho boa parte das empresas de fachada.
 */
public record CadastroEmpresaRequest(
        @NotBlank(message = "O CNPJ é obrigatório.")
        @Size(max = 18) String cnpj,

        @NotNull(message = "Informe se a empresa é EMBARCADOR ou AGENCIADOR.")
        TipoEmpresa tipo,

        @NotBlank(message = "O telefone é obrigatório.")
        @Pattern(regexp = Formatos.TELEFONE, message = "Telefone inválido. Use DDD + número.")
        String telefone,

        @Size(max = 255) String nomeFantasia,

        @NotNull(message = "O responsável pela conta é obrigatório.")
        @Valid ResponsavelRequest responsavel) {
}
