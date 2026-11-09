package br.com.fretai.frete.application.dto;

import br.com.fretai.frete.domain.Proposta;
import br.com.fretai.frete.domain.StatusProposta;
import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import br.com.fretai.veiculo.domain.Veiculo;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * @param valorAdiantamento em reais, já calculado, para ninguém fazer conta de cabeça
 * @param autorPapel quem propôs: MOTORISTA, EMPRESA ou CLIENTE
 */
public record PropostaResponse(UUID id, UUID freteId, MotoristaResumo motorista, VeiculoResumo veiculo,
                               Papel autorPapel, BigDecimal valor, BigDecimal adiantamentoPercentual,
                               BigDecimal valorAdiantamento, LocalDate prazoEntrega, String observacao,
                               StatusProposta status, Instant criadaEm, Instant respondidaEm) {

    public record MotoristaResumo(UUID id, String nome) {
    }

    public record VeiculoResumo(UUID id, String placa, CategoriaVeiculo categoria, String modelo, TipoVeiculo tipo,
                                TipoCarroceria carroceria, Integer numeroEixos, boolean rastreador) {
    }

    public static PropostaResponse de(Proposta p) {
        Veiculo v = p.getVeiculo();
        BigDecimal adiantamento = p.getValor().multiply(p.getAdiantamentoPercentual())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        return new PropostaResponse(p.getId(), p.getFrete().getId(),
                new MotoristaResumo(p.getMotorista().getId(), p.getMotorista().getNome()),
                v == null ? null : new VeiculoResumo(v.getId(), v.getPlaca(), v.getCategoria(), v.getModelo(),
                        v.getTipo(), v.getCarroceria(), v.getNumeroEixos(), v.isRastreador()),
                p.getAutorPapel(), p.getValor(), p.getAdiantamentoPercentual(), adiantamento, p.getPrazoEntrega(),
                p.getObservacao(), p.getStatus(), p.getCriadaEm(), p.getRespondidaEm());
    }
}
