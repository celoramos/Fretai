package br.com.fretai.entrega.application.dto;

import br.com.fretai.entrega.domain.Canhoto;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResolucaoRequest(
        @NotNull(message = "Informe a resolução.") Canhoto.Resolucao resolucao,
        @Size(max = 500) String observacao) {
}
