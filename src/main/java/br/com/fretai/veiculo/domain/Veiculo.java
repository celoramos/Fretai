package br.com.fretai.veiculo.domain;

import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.usuario.domain.Motorista;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Veículo de um motorista: utilitário, van ou caminhão. Um motorista pode ter vários, e cada
 * proposta diz com qual deles vai fazer o frete. RNTRC, tipo de caminhão, carroceria e eixos só o frete
 * de empresa exige; para o frete de pessoa física bastam tipo, modelo e placa.
 */
@Entity
public class Veiculo {

    /** Placa antiga (ABC1234) ou Mercosul (ABC1D23), já sem hífen. */
    private static final Pattern PLACA = Pattern.compile("[A-Z]{3}\\d[A-Z0-9]\\d{2}");
    /** Registro Nacional de Transportadores Rodoviários de Cargas: 8 ou 9 dígitos. */
    private static final Pattern RNTRC = Pattern.compile("\\d{8,9}");
    public static final int EIXOS_MINIMO = 2;
    public static final int EIXOS_MAXIMO = 9;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "motorista_id")
    private Motorista motorista;

    @Column(nullable = false, unique = true, length = 7)
    private String placa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoriaVeiculo categoria;

    @Column(length = 60)
    private String modelo;

    @Column(length = 9)
    private String rntrc;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TipoVeiculo tipo;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TipoCarroceria carroceria;

    private Integer numeroEixos;

    @Column(nullable = false)
    private boolean rastreador;

    /** Veículo vendido ou parado: some das propostas novas, mas continua no histórico dos fretes. */
    @Column(nullable = false)
    private boolean ativo = true;

    @Column(nullable = false)
    private Instant criadoEm;

    protected Veiculo() {
    }

    /** Caminhão com todos os dados, o veículo do frete de empresa. */
    public Veiculo(Motorista motorista, String placa, String rntrc, TipoVeiculo tipo,
                   TipoCarroceria carroceria, int numeroEixos, boolean rastreador) {
        this(motorista, placa, CategoriaVeiculo.CAMINHAO, null, rntrc, Objects.requireNonNull(tipo,
                "Tipo do veículo é obrigatório."), Objects.requireNonNull(carroceria, "Carroceria é obrigatória."),
                numeroEixos, rastreador);
    }

    /** Qualquer veículo: os dados de caminhão podem vir nulos. */
    public Veiculo(Motorista motorista, String placa, CategoriaVeiculo categoria, String modelo, String rntrc,
                   TipoVeiculo tipo, TipoCarroceria carroceria, Integer numeroEixos, boolean rastreador) {
        this.motorista = Objects.requireNonNull(motorista, "Motorista é obrigatório.");
        this.placa = normalizarPlaca(placa);
        this.criadoEm = Instant.now();
        atualizar(categoria, modelo, rntrc, tipo, carroceria, numeroEixos, rastreador);
    }

    /** Dados que vierem são validados; RNTRC em branco conta como não informado. */
    public void atualizar(CategoriaVeiculo categoria, String modelo, String rntrc, TipoVeiculo tipo,
                          TipoCarroceria carroceria, Integer numeroEixos, boolean rastreador) {
        String rntrcLimpo = null;
        if (rntrc != null && !rntrc.isBlank()) {
            rntrcLimpo = rntrc.replaceAll("\\D", "");
            if (!RNTRC.matcher(rntrcLimpo).matches()) {
                throw new IllegalArgumentException("RNTRC inválido. Deve ter 8 ou 9 dígitos.");
            }
        }
        if (numeroEixos != null && (numeroEixos < EIXOS_MINIMO || numeroEixos > EIXOS_MAXIMO)) {
            throw new IllegalArgumentException("Número de eixos deve estar entre "
                    + EIXOS_MINIMO + " e " + EIXOS_MAXIMO + ".");
        }
        this.categoria = Objects.requireNonNull(categoria, "O tipo do veículo é obrigatório.");
        this.modelo = modelo == null || modelo.isBlank() ? null : modelo.trim();
        this.rntrc = rntrcLimpo;
        this.tipo = tipo;
        this.carroceria = carroceria;
        this.numeroEixos = numeroEixos;
        this.rastreador = rastreador;
    }

    public void desativar() {
        this.ativo = false;
    }

    public boolean pertenceA(UUID motoristaId) {
        return motorista.getId().equals(motoristaId);
    }

    /** @throws IllegalArgumentException se não for placa antiga nem Mercosul */
    public static String normalizarPlaca(String placa) {
        String limpa = placa == null ? "" : placa.replace("-", "").trim().toUpperCase(Locale.ROOT);
        if (!PLACA.matcher(limpa).matches()) {
            throw new IllegalArgumentException("Placa inválida. Use o formato ABC1234 ou ABC1D23.");
        }
        return limpa;
    }

    public UUID getId() {return id;}
    public Motorista getMotorista() {return motorista;}
    public String getPlaca() {return placa;}
    public CategoriaVeiculo getCategoria() {return categoria;}
    public String getModelo() {return modelo;}
    public String getRntrc() {return rntrc;}
    public TipoVeiculo getTipo() {return tipo;}
    public TipoCarroceria getCarroceria() {return carroceria;}
    public Integer getNumeroEixos() {return numeroEixos;}
    public boolean isRastreador() {return rastreador;}
    public boolean isAtivo() {return ativo;}
    public Instant getCriadoEm() {return criadoEm;}
}
