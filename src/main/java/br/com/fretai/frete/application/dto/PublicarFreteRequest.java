package br.com.fretai.frete.application.dto;

import br.com.fretai.frete.domain.DadosCarga;
import br.com.fretai.frete.domain.RequisitosFrete;
import br.com.fretai.frete.domain.TipoCargaAntt;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

/**
 * Frete publicado por empresa no marketplace. Também é o corpo da edição (PUT).
 *
 * @param valorACombinar true = sem valor no anúncio; o preço sai da negociação
 * @param veiculosAceitos vazio ou ausente = qualquer tipo de caminhão
 */
public record PublicarFreteRequest(
        @NotNull(message = "O ponto de coleta é obrigatório.")
        @Valid EnderecoRequest coleta,

        @NotNull(message = "O ponto de entrega é obrigatório.")
        @Valid EnderecoRequest entrega,

        @NotBlank(message = "A descrição da carga é obrigatória.")
        @Size(max = 500) String descricaoCarga,

        @NotBlank(message = "A espécie da carga é obrigatória.")
        @Size(max = 100) String especieCarga,

        @NotNull(message = "O tipo de carga ANTT é obrigatório.")
        TipoCargaAntt tipoCargaAntt,

        @NotNull(message = "O peso da carga é obrigatório.")
        @Positive(message = "O peso deve ser maior que zero.")
        @DecimalMax(value = "74000", message = "Peso acima do maior peso bruto total permitido (74 t).")
        @Digits(integer = 8, fraction = 2)
        BigDecimal pesoKg,

        @Positive(message = "O valor deve ser maior que zero.")
        @Digits(integer = 10, fraction = 2, message = "Valor com no máximo 2 casas decimais.")
        BigDecimal valor,

        boolean valorACombinar,

        @NotNull(message = "A data da coleta é obrigatória.")
        @FutureOrPresent(message = "A data da coleta não pode estar no passado.")
        LocalDate dataColeta,

        Set<TipoVeiculo> veiculosAceitos,
        Set<TipoCarroceria> carroceriasAceitas,
        boolean exigeRastreador,
        boolean complemento) {

    @JsonIgnore
    @AssertTrue(message = "Informe o valor ou marque como \"a combinar\" (um dos dois, nunca ambos).")
    public boolean isValorCoerente() {
        return valorACombinar == (valor == null);
    }

    public DadosCarga carga() {
        return new DadosCarga(descricaoCarga, especieCarga, tipoCargaAntt, pesoKg);
    }

    public RequisitosFrete requisitos() {
        return new RequisitosFrete(veiculosAceitos, carroceriasAceitas, exigeRastreador, complemento);
    }
}
