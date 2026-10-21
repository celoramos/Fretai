package br.com.fretai.precificacao.application;

import br.com.fretai.precificacao.application.dto.CalculoFreteRequest;
import br.com.fretai.precificacao.application.dto.CalculoFreteResponse;
import br.com.fretai.precificacao.application.dto.CoeficienteRequest;
import br.com.fretai.precificacao.application.dto.CoeficienteResponse;
import br.com.fretai.precificacao.domain.AvaliacaoPreco;
import br.com.fretai.precificacao.domain.CoeficientePiso;
import br.com.fretai.precificacao.domain.CoeficientePisoRepository;
import br.com.fretai.precificacao.domain.CustoViagem;
import br.com.fretai.precificacao.domain.PisoMinimo;
import br.com.fretai.precificacao.domain.TipoCargaAntt;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Piso ANTT, custo de viagem e alertas de preço. Não conhece fretes: quem chama passa os números. */
@Service
public class PrecificacaoService {

    private final CoeficientePisoRepository coeficientes;
    private final BigDecimal fatorSuspeita;
    private final long amostraMinima;
    private final Duration janelaMedia;
    private final double toleranciaDistancia;

    public PrecificacaoService(CoeficientePisoRepository coeficientes,
                               @Value("${fretai.preco.fator-suspeita}") BigDecimal fatorSuspeita,
                               @Value("${fretai.preco.amostra-minima}") long amostraMinima,
                               @Value("${fretai.preco.janela-media}") Duration janelaMedia,
                               @Value("${fretai.preco.tolerancia-distancia}") double toleranciaDistancia) {
        this.coeficientes = coeficientes;
        this.fatorSuspeita = fatorSuspeita;
        this.amostraMinima = amostraMinima;
        this.janelaMedia = janelaMedia;
        this.toleranciaDistancia = toleranciaDistancia;
    }

    @Transactional(readOnly = true)
    public Optional<PisoMinimo> piso(TipoCargaAntt tipoCarga, int numeroEixos, BigDecimal distanciaKm) {
        if (tipoCarga == null || distanciaKm == null) {
            return Optional.empty();
        }
        return coeficientes.findById(new CoeficientePiso.Chave(tipoCarga, numeroEixos))
                .map(c -> PisoMinimo.de(c, distanciaKm));
    }

    /**
     * @param mediaPorKm R$/km médio de fretes parecidos
     * @param amostras   quantos fretes entraram na média; abaixo do mínimo configurado, a média é ignorada
     */
    @Transactional(readOnly = true)
    public AvaliacaoPreco avaliar(BigDecimal valor, TipoCargaAntt tipoCarga, int numeroEixos, BigDecimal distanciaKm,
                                  Double mediaPorKm, long amostras) {
        PisoMinimo piso = piso(tipoCarga, numeroEixos, distanciaKm).orElse(null);
        Double media = amostras >= amostraMinima ? mediaPorKm : null;
        return AvaliacaoPreco.avaliar(valor, distanciaKm, piso, media, fatorSuspeita);
    }

    /** Até quando olhar para trás para calcular a média das rotas parecidas. */
    public Duration janelaMedia() {
        return janelaMedia;
    }

    /** 0.3 = rotas com distância até 30% maior ou menor contam como parecidas. */
    public double toleranciaDistancia() {
        return toleranciaDistancia;
    }

    @Transactional(readOnly = true)
    public CalculoFreteResponse calcular(CalculoFreteRequest r) {
        CustoViagem custo = CustoViagem.calcular(r.distanciaKm(), r.consumoKmPorLitro(), r.precoDieselLitro(),
                r.pedagio(), r.outrosCustos());
        PisoMinimo piso = r.tipoCargaAntt() == null || r.numeroEixos() == null ? null
                : piso(r.tipoCargaAntt(), r.numeroEixos(), r.distanciaKm()).orElse(null);
        BigDecimal margem = r.valorOferecido() == null ? null : r.valorOferecido().subtract(custo.total());
        boolean abaixoDoPiso = r.valorOferecido() != null && piso != null
                && r.valorOferecido().compareTo(piso.valor()) < 0;
        return new CalculoFreteResponse(custo, piso, r.valorOferecido(), margem, abaixoDoPiso);
    }

    @Transactional(readOnly = true)
    public List<CoeficienteResponse> listarCoeficientes() {
        return coeficientes.findAllByOrderByChaveTipoCargaAscChaveNumeroEixosAsc().stream()
                .map(CoeficienteResponse::de).toList();
    }

    @Transactional
    public CoeficienteResponse salvarCoeficiente(TipoCargaAntt tipoCarga, int numeroEixos, CoeficienteRequest r) {
        CoeficientePiso coeficiente = coeficientes.findById(new CoeficientePiso.Chave(tipoCarga, numeroEixos))
                .map(c -> {
                    c.atualizar(r.ccd(), r.cc(), r.fonte());
                    return c;
                })
                .orElseGet(() -> new CoeficientePiso(tipoCarga, numeroEixos, r.ccd(), r.cc(), r.fonte()));
        return CoeficienteResponse.de(coeficientes.save(coeficiente));
    }

    @Transactional(readOnly = true)
    public CoeficienteResponse buscarCoeficiente(TipoCargaAntt tipoCarga, int numeroEixos) {
        return coeficientes.findById(new CoeficientePiso.Chave(tipoCarga, numeroEixos))
                .map(CoeficienteResponse::de)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Sem coeficiente para " + tipoCarga
                        + " com " + numeroEixos + " eixos."));
    }
}
