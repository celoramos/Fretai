package br.com.fretai.frete.application.dto;

import br.com.fretai.frete.domain.OpcaoFiltro;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import java.util.Set;

/**
 * Parâmetros de {@code GET /api/fretes/busca}. Origem por coordenada (GPS do
 * celular) ou por CEP; destino é opcional. Raio em km: o app oferece 50, 100 e
 * 200, mas qualquer valor até 1000 vale.
 */
public record BuscaFreteRequest(
        @DecimalMin(value = "-90") @DecimalMax(value = "90") Double origemLat,
        @DecimalMin(value = "-180") @DecimalMax(value = "180") Double origemLng,
        @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "CEP de origem inválido.") String origemCep,

        @DecimalMin(value = "1", message = "O raio mínimo é 1 km.")
        @DecimalMax(value = "1000", message = "O raio máximo é 1000 km.")
        Double raioKm,

        @DecimalMin(value = "-90") @DecimalMax(value = "90") Double destinoLat,
        @DecimalMin(value = "-180") @DecimalMax(value = "180") Double destinoLng,
        @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "CEP de destino inválido.") String destinoCep,

        @DecimalMin(value = "1", message = "O raio mínimo é 1 km.")
        @DecimalMax(value = "1000", message = "O raio máximo é 1000 km.")
        Double raioDestinoKm,

        Set<TipoVeiculo> tipoVeiculo,
        Set<TipoCarroceria> carroceria,
        OpcaoFiltro exigeRastreador,
        OpcaoFiltro agenciador,
        OpcaoFiltro comPreco,
        OpcaoFiltro complemento) {

    public static final double RAIO_PADRAO_KM = 100;

    @AssertTrue(message = "Informe a origem: origemLat e origemLng, ou origemCep.")
    public boolean isOrigemInformada() {
        return (origemLat != null && origemLng != null) || origemCep != null;
    }

    public double raioOuPadrao() {
        return raioKm != null ? raioKm : RAIO_PADRAO_KM;
    }

    /** Sem raio próprio, o destino usa o mesmo raio da origem. */
    public double raioDestinoOuPadrao() {
        return raioDestinoKm != null ? raioDestinoKm : raioOuPadrao();
    }
}
