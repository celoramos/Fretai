package br.com.fretai.precificacao.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Objects;

/**
 * Uma linha da tabela de piso mínimo da ANTT: para um tipo de carga e um número
 * de eixos, quanto custa rodar 1 km (CCD) e carregar/descarregar (CC).
 */
@Entity
@Table(name = "coeficiente_piso_antt")
public class CoeficientePiso {

    /** Valor do campo "fonte" enquanto a tabela não foi preenchida com os números oficiais. */
    public static final String FONTE_EXEMPLO = "EXEMPLO";

    @EmbeddedId
    private Chave chave;

    /** R$ por km. */
    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal ccd;

    /** R$ por viagem (carga e descarga). */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal cc;

    @Column(nullable = false, length = 200)
    private String fonte;

    @Column(nullable = false)
    private Instant atualizadoEm;

    protected CoeficientePiso() {
    }

    public CoeficientePiso(TipoCargaAntt tipoCarga, int numeroEixos, BigDecimal ccd, BigDecimal cc, String fonte) {
        this.chave = new Chave(tipoCarga, numeroEixos);
        atualizar(ccd, cc, fonte);
    }

    public void atualizar(BigDecimal ccd, BigDecimal cc, String fonte) {
        if (ccd == null || ccd.signum() < 0 || cc == null || cc.signum() < 0) {
            throw new IllegalArgumentException("Coeficientes não podem ser negativos.");
        }
        this.ccd = ccd;
        this.cc = cc;
        this.fonte = Objects.requireNonNull(fonte, "Informe a fonte (norma da ANTT) dos coeficientes.");
        this.atualizadoEm = Instant.now();
    }

    /** Lei 13.703/2018: piso = distância × CCD + CC, arredondado ao centavo. */
    public BigDecimal pisoPara(BigDecimal distanciaKm) {
        return distanciaKm.multiply(ccd).add(cc).setScale(2, RoundingMode.HALF_UP);
    }

    public boolean isExemplo() {
        return FONTE_EXEMPLO.equalsIgnoreCase(fonte);
    }

    public TipoCargaAntt getTipoCarga() {return chave.tipoCarga;}
    public int getNumeroEixos() {return chave.numeroEixos;}
    public BigDecimal getCcd() {return ccd;}
    public BigDecimal getCc() {return cc;}
    public String getFonte() {return fonte;}
    public Instant getAtualizadoEm() {return atualizadoEm;}

    @Embeddable
    public static class Chave implements Serializable {

        @Enumerated(EnumType.STRING)
        @Column(name = "tipo_carga", length = 40)
        private TipoCargaAntt tipoCarga;

        @Column(name = "numero_eixos")
        private int numeroEixos;

        protected Chave() {
        }

        public Chave(TipoCargaAntt tipoCarga, int numeroEixos) {
            this.tipoCarga = Objects.requireNonNull(tipoCarga);
            this.numeroEixos = numeroEixos;
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Chave c && c.tipoCarga == tipoCarga && c.numeroEixos == numeroEixos;
        }

        @Override
        public int hashCode() {
            return Objects.hash(tipoCarga, numeroEixos);
        }
    }
}
