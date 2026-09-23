package br.com.fretai.frete.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record SolicitarFreteRequest(
        // Na Fase 2 o cliente vem do token de login, não do corpo da requisição.
        @NotNull(message = "O cliente é obrigatório.")
        UUID clienteId,

        @NotNull(message = "O ponto de coleta é obrigatório.")
        @Valid EnderecoRequest coleta,

        @NotNull(message = "O ponto de entrega é obrigatório.")
        @Valid EnderecoRequest entrega,

        @NotBlank(message = "O nome do destinatário é obrigatório.")
        @Size(max = 100) String nomeDestinatario,

        @NotBlank(message = "O telefone do destinatário é obrigatório.")
        @Size(max = 20) String telefoneDestinatario,

        @NotBlank(message = "A descrição da carga é obrigatória.")
        @Size(max = 500) String descricaoCarga,

        @NotNull(message = "O peso da carga é obrigatório.")
        @Positive(message = "O peso deve ser maior que zero.")
        @DecimalMax(value = "50000", message = "Peso acima do limite da plataforma (50 t).")
        @Digits(integer = 8, fraction = 2)
        BigDecimal pesoKg,

        @NotNull(message = "O valor é obrigatório.")
        @Positive(message = "O valor deve ser maior que zero.")
        @Digits(integer = 10, fraction = 2, message = "Valor com no máximo 2 casas decimais.")
        BigDecimal valor) {
}
