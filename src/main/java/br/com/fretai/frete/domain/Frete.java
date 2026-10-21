package br.com.fretai.frete.domain;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.rota.domain.Rota;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.Papel;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import br.com.fretai.veiculo.domain.Veiculo;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Um frete e o seu ciclo de vida. As transições permitidas estão em
 * {@link MaquinaEstadosFrete}; toda mudança passa por {@link #transicionar},
 * que confere a transição e grava um {@link EventoFrete} com quem fez e quando.
 *
 * O status só muda pelos métodos de transição (não existe setStatus público),
 * então é impossível um frete pular etapas, venha a chamada de onde vier.
 */
@Entity
public class Frete {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Controle de concorrência otimista: dois aceites simultâneos → só o primeiro grava. */
    @Version
    private Long versao;

    /** Contratante pessoa física. Nulo quando o frete é de uma empresa. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    /** Contratante pessoa jurídica. Nulo quando o frete é de um cliente. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id")
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "motorista_id")
    private Motorista motorista;

    /** Caminhão com que o motorista vai fazer o frete (só nos fretes de empresa). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "veiculo_id")
    private Veiculo veiculo;

    @Embedded
    private EnderecoFrete pontoColeta;

    @Embedded
    private EnderecoFrete pontoEntrega;

    @Column(length = 100)
    private String nomeDestinatario;

    @Column(length = 20)
    private String telefoneDestinatario;

    @Column(nullable = false, length = 500)
    private String descricaoCarga;

    @Column(length = 100)
    private String especieCarga;

    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private TipoCargaAntt tipoCargaAntt;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pesoKg;

    /** O que o contratante ofereceu. Nulo quando o valor é "a combinar". */
    @Column(precision = 12, scale = 2)
    private BigDecimal valor;

    @Column(name = "valor_a_combinar", nullable = false)
    private boolean valorACombinar;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal adicionalFeriado;

    /** valor + adicionalFeriado: é o que o contratante paga. Nulo enquanto o valor estiver "a combinar". */
    @Column(precision = 12, scale = 2)
    private BigDecimal valorTotal;

    @ElementCollection
    @CollectionTable(name = "frete_tipo_veiculo", joinColumns = @JoinColumn(name = "frete_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_veiculo", length = 20)
    private Set<TipoVeiculo> veiculosAceitos = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "frete_tipo_carroceria", joinColumns = @JoinColumn(name = "frete_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_carroceria", length = 20)
    private Set<TipoCarroceria> carroceriasAceitas = new HashSet<>();

    @Column(nullable = false)
    private boolean exigeRastreador;

    /** A carga não lota o caminhão: o motorista pode completar com outra. */
    @Column(nullable = false)
    private boolean complemento;

    @Column(nullable = false)
    private boolean publicadoPorAgenciador;

    @Column(nullable = false)
    private LocalDate dataColeta;

    /** Feriado nacional não impede o frete: só gera adicional e exige motorista que aceite feriado. */
    @Column(nullable = false)
    private boolean feriado;

    @Column(length = 100)
    private String nomeFeriado;

    /** Só informativo: domingo não gera adicional. */
    @Column(nullable = false)
    private boolean domingo;

    /** Nula quando não foi possível localizar a coleta ou a entrega no mapa. */
    @Column(precision = 8, scale = 1)
    private BigDecimal distanciaKm;
    private Boolean distanciaEstimada;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusFrete status;

    @Column(length = 500)
    private String motivoCancelamento;

    /** Condições da proposta aceita: é sobre isto que o pagamento é calculado. */
    @Column(precision = 12, scale = 2)
    private BigDecimal valorAcordado;

    @Column(precision = 5, scale = 2)
    private BigDecimal adiantamentoPercentual;

    private LocalDate prazoEntrega;

    @Column(nullable = false)
    private Instant criadoEm;
    private Instant aceitoEm;
    private Instant concluidoEm;
    private Instant pagoEm;

    // MERGE também: saveAndFlush faz merge, e sem ele o Hibernate copia o evento novo vazio.
    @OneToMany(mappedBy = "frete", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @OrderBy("ocorridoEm")
    private List<EventoFrete> eventos = new ArrayList<>();

    protected Frete() {
    }

    /**
     * Frete publicado por uma empresa no marketplace. Se a empresa for agenciadora,
     * o frete sai marcado como tal: o motorista tem o direito de saber que está
     * negociando com um intermediário.
     *
     * @param valor nulo = "a combinar"
     */
    public static Frete publicar(Empresa empresa, EnderecoFrete pontoColeta, EnderecoFrete pontoEntrega,
                                 DadosCarga carga, BigDecimal valor, LocalDate dataColeta,
                                 RequisitosFrete requisitos, Autor autor) {
        Objects.requireNonNull(empresa, "Empresa é obrigatória.");
        Objects.requireNonNull(carga, "Dados da carga são obrigatórios.");
        Objects.requireNonNull(requisitos, "Requisitos do frete são obrigatórios.");
        if (!empresa.isAtiva()) {
            throw new RegraNegocioException("Empresa desativada não pode publicar fretes.");
        }
        Frete frete = new Frete(pontoColeta, pontoEntrega, carga.descricao(), carga.pesoKg(), valor, dataColeta,
                autor);
        frete.empresa = empresa;
        frete.especieCarga = carga.especie();
        frete.tipoCargaAntt = Objects.requireNonNull(carga.tipoCargaAntt(), "Tipo de carga ANTT é obrigatório.");
        frete.valorACombinar = valor == null;
        frete.publicadoPorAgenciador = empresa.isAgenciador();
        frete.aplicarRequisitos(requisitos);
        return frete;
    }

    private Frete(EnderecoFrete pontoColeta, EnderecoFrete pontoEntrega, String descricaoCarga,
                  BigDecimal pesoKg, BigDecimal valor, LocalDate dataColeta, Autor autor) {
        this.pontoColeta = Objects.requireNonNull(pontoColeta, "Ponto de coleta é obrigatório.");
        this.pontoEntrega = Objects.requireNonNull(pontoEntrega, "Ponto de entrega é obrigatório.");
        this.dataColeta = Objects.requireNonNull(dataColeta, "Data da coleta é obrigatória.");
        this.descricaoCarga = descricaoCarga;
        this.pesoKg = pesoKg;
        this.valor = valor;
        this.adicionalFeriado = BigDecimal.ZERO;
        this.valorTotal = valor;
        this.domingo = dataColeta.getDayOfWeek() == DayOfWeek.SUNDAY;
        this.status = StatusFrete.PUBLICADO;
        this.criadoEm = Instant.now();
        this.eventos.add(new EventoFrete(this, null, StatusFrete.PUBLICADO, autor, null));
    }

    private void aplicarRequisitos(RequisitosFrete requisitos) {
        this.veiculosAceitos.clear();
        this.veiculosAceitos.addAll(requisitos.veiculosAceitos());
        this.carroceriasAceitas.clear();
        this.carroceriasAceitas.addAll(requisitos.carroceriasAceitas());
        this.exigeRastreador = requisitos.exigeRastreador();
        this.complemento = requisitos.complemento();
    }

    /**
     * A empresa corrige o anúncio. Volta tudo ao estado de recém-publicado
     * (sem distância, sem feriado): quem chama recalcula com os dados novos.
     */
    public void revisar(EnderecoFrete pontoColeta, EnderecoFrete pontoEntrega, DadosCarga carga,
                        BigDecimal valor, LocalDate dataColeta, RequisitosFrete requisitos) {
        if (empresa == null) {
            throw new RegraNegocioException("Só fretes publicados por empresa podem ser editados.");
        }
        exigirStatus(StatusFrete.PUBLICADO, "O frete só pode ser editado antes de receber propostas.");
        this.pontoColeta = Objects.requireNonNull(pontoColeta, "Ponto de coleta é obrigatório.");
        this.pontoEntrega = Objects.requireNonNull(pontoEntrega, "Ponto de entrega é obrigatório.");
        this.dataColeta = Objects.requireNonNull(dataColeta, "Data da coleta é obrigatória.");
        this.descricaoCarga = carga.descricao();
        this.especieCarga = carga.especie();
        this.tipoCargaAntt = Objects.requireNonNull(carga.tipoCargaAntt(), "Tipo de carga ANTT é obrigatório.");
        this.pesoKg = carga.pesoKg();
        this.valor = valor;
        this.valorACombinar = valor == null;
        this.adicionalFeriado = BigDecimal.ZERO;
        this.valorTotal = valor;
        this.feriado = false;
        this.nomeFeriado = null;
        this.domingo = dataColeta.getDayOfWeek() == DayOfWeek.SUNDAY;
        this.distanciaKm = null;
        this.distanciaEstimada = null;
        aplicarRequisitos(requisitos);
    }

    /** Quem contratou: o cliente pessoa física ou alguém que representa a empresa. */
    public boolean ehContratante(UsuarioLogado usuario) {
        return (cliente != null && cliente.getId().equals(usuario.id()))
                || (empresa != null && usuario.papel() == Papel.EMPRESA && empresa.getId().equals(usuario.empresaId()));
    }

    public boolean ehMotoristaDoFrete(UsuarioLogado usuario) {
        return motorista != null && motorista.getId().equals(usuario.id());
    }

    /** O caminhão atende ao que a empresa pediu? Lista vazia de tipos ou carrocerias = qualquer um serve. */
    public boolean aceitaVeiculo(Veiculo veiculo) {
        return (veiculosAceitos.isEmpty() || veiculosAceitos.contains(veiculo.getTipo()))
                && (carroceriasAceitas.isEmpty() || carroceriasAceitas.contains(veiculo.getCarroceria()))
                && (!exigeRastreador || veiculo.isRastreador());
    }

    public Frete(Cliente cliente, EnderecoFrete pontoColeta, EnderecoFrete pontoEntrega,
                 String nomeDestinatario, String telefoneDestinatario,
                 String descricaoCarga, BigDecimal pesoKg, BigDecimal valor, LocalDate dataColeta) {
        this(pontoColeta, pontoEntrega, descricaoCarga, pesoKg, Objects.requireNonNull(valor, "Valor é obrigatório."),
                dataColeta, new Autor(Objects.requireNonNull(cliente, "Cliente solicitante é obrigatório.").getId(),
                        Papel.CLIENTE));
        this.cliente = cliente;
        this.nomeDestinatario = nomeDestinatario;
        this.telefoneDestinatario = telefoneDestinatario;
    }

    /**
     * Quem sabe o calendário é o serviço; aqui só se aplica a consequência.
     * Como mexe no preço, também só vale antes de um motorista aceitar.
     *
     * @param nomeFeriado nome do feriado nacional da data de coleta
     * @param percentual  adicional sobre o valor oferecido (20 = 20%)
     */
    public void registrarFeriado(String nomeFeriado, BigDecimal percentual) {
        Objects.requireNonNull(nomeFeriado, "Nome do feriado não pode ser nulo.");
        exigirStatus(StatusFrete.PUBLICADO, "O feriado só pode ser registrado antes de o frete receber propostas.");
        this.feriado = true;
        this.nomeFeriado = nomeFeriado;
        // "A combinar": o adicional entra na negociação, não há valor sobre o qual calcular.
        if (valor != null) {
            this.adicionalFeriado = AdicionalFeriado.calcular(valor, percentual);
            this.valorTotal = valor.add(adicionalFeriado);
        }
    }

    /** A distância entra na formação do preço, então só pode mudar antes de um motorista aceitar. */
    public void registrarRota(Rota rota) {
        Objects.requireNonNull(rota, "Rota não pode ser nula.");
        exigirStatus(StatusFrete.PUBLICADO, "A rota só pode ser alterada antes de o frete receber propostas.");
        this.distanciaKm = rota.distanciaKm();
        this.distanciaEstimada = rota.estimada();
    }

    // ---------- Transições de estado ----------

    /** Primeira proposta tira o frete de PUBLICADO; as seguintes não mudam o status. */
    public void receberProposta(Autor autor) {
        if (status == StatusFrete.PROPOSTA_ENVIADA) {
            return;
        }
        MaquinaEstadosFrete.exigir(status, StatusFrete.PROPOSTA_ENVIADA, "Este frete não está aberto a propostas.");
        transicionar(StatusFrete.PROPOSTA_ENVIADA, autor, null);
    }

    /** Todas as propostas foram recusadas ou retiradas: o frete volta à vitrine. */
    public void reabrir(Autor autor) {
        MaquinaEstadosFrete.exigir(status, StatusFrete.PUBLICADO, "O frete não pode voltar a ser publicado.");
        transicionar(StatusFrete.PUBLICADO, autor, "Sem propostas em aberto.");
    }

    /**
     * Fecha negócio com uma proposta: o motorista, o caminhão e as condições dela
     * passam a valer para o frete. As demais propostas abertas são recusadas por
     * quem chama (o service), que as tem carregadas.
     *
     * @param veiculoEscolhido caminhão informado pelo motorista quando ele aceita a proposta da empresa
     */
    public void aceitarProposta(Proposta proposta, Veiculo veiculoEscolhido, Autor autor) {
        // Compara por id: a proposta carregada do banco aponta para um proxy, não para esta instância.
        Frete daProposta = proposta.getFrete();
        if (daProposta != this && (id == null || !id.equals(daProposta.getId()))) {
            throw new IllegalArgumentException("A proposta não é deste frete.");
        }
        MaquinaEstadosFrete.exigir(status, StatusFrete.ACEITO, "Este frete não tem proposta a ser aceita.");
        // Confere tudo antes de mexer em qualquer coisa: se falhar, nada muda.
        exigirMotoristaApto(proposta.getMotorista(),
                proposta.getVeiculo() != null ? proposta.getVeiculo() : veiculoEscolhido);
        proposta.aceitar(veiculoEscolhido);

        this.motorista = proposta.getMotorista();
        this.veiculo = proposta.getVeiculo();
        this.valorAcordado = proposta.getValor();
        this.adiantamentoPercentual = proposta.getAdiantamentoPercentual();
        this.prazoEntrega = proposta.getPrazoEntrega();
        this.aceitoEm = Instant.now();
        transicionar(StatusFrete.ACEITO, autor, "Proposta de R$ " + proposta.getValor() + " aceita.");
    }

    /**
     * O motorista topa o valor anunciado, sem negociar. Vira uma proposta dele
     * já aceita, para que a trilha de auditoria e o histórico de propostas
     * contem a mesma história.
     *
     * @return a proposta criada, para o service gravar
     */
    public Proposta aceitarPeloValorAnunciado(Motorista motorista, Veiculo veiculo, Autor autor) {
        Objects.requireNonNull(motorista, "Motorista não pode ser nulo.");
        if (valorACombinar) {
            throw new RegraNegocioException("Este frete está com valor a combinar: envie uma proposta.");
        }
        if (status != StatusFrete.PUBLICADO && status != StatusFrete.PROPOSTA_ENVIADA) {
            throw new IllegalStateException("Este frete não está mais disponível (status atual: " + status + ").");
        }
        // Antes de mexer no status: se o motorista não serve, o frete fica como estava.
        exigirMotoristaApto(motorista, veiculo);
        receberProposta(autor);
        Proposta proposta = new Proposta(this, motorista, veiculo, autor, valorTotal, BigDecimal.ZERO, null,
                "Aceite pelo valor anunciado.");
        aceitarProposta(proposta, null, autor);
        return proposta;
    }

    public void iniciarTransporte(Autor autor) {
        MaquinaEstadosFrete.exigir(status, StatusFrete.EM_TRANSITO,
                "Para iniciar o transporte, o frete deve estar aceito por um motorista.");
        transicionar(StatusFrete.EM_TRANSITO, autor, null);
    }

    public void concluir(Autor autor) {
        concluir(autor, null);
    }

    /** @param observacao ex.: "Canhoto digital recebido" */
    public void concluir(Autor autor, String observacao) {
        MaquinaEstadosFrete.exigir(status, StatusFrete.ENTREGUE,
                "Para concluir a entrega, a carga deve estar em trânsito.");
        this.concluidoEm = Instant.now();
        transicionar(StatusFrete.ENTREGUE, autor, observacao);
    }

    /** O saldo chegou ao motorista: fim do ciclo. */
    public void registrarPagamento(Autor autor) {
        MaquinaEstadosFrete.exigir(status, StatusFrete.PAGO, "Só frete entregue pode ser marcado como pago.");
        this.pagoEm = Instant.now();
        transicionar(StatusFrete.PAGO, autor, "Saldo liberado ao motorista.");
    }

    /** Só antes de a carga sair. Depois disso, problema é contestação. */
    public void cancelar(String motivo, Autor autor) {
        MaquinaEstadosFrete.exigir(status, StatusFrete.CANCELADO,
                "Não é possível cancelar: o frete já saiu para entrega, foi concluído ou já está cancelado.");
        this.motivoCancelamento = motivo;
        this.concluidoEm = Instant.now();
        transicionar(StatusFrete.CANCELADO, autor, motivo);
    }

    private void transicionar(StatusFrete novo, Autor autor, String observacao) {
        StatusFrete anterior = this.status;
        this.status = novo;
        this.eventos.add(new EventoFrete(this, anterior, novo, autor, observacao));
    }

    private void exigirMotoristaApto(Motorista candidato, Veiculo caminhao) {
        if (feriado && !candidato.isAceitaFeriado()) {
            throw new RegraNegocioException("Este frete é no feriado (" + nomeFeriado
                    + ") e o motorista não aceita trabalhar em feriados.");
        }
        if (empresa != null) {
            if (caminhao == null) {
                throw new RegraNegocioException("Informe com qual veículo o frete será feito.");
            }
            if (!caminhao.isAtivo() || !aceitaVeiculo(caminhao)) {
                throw new RegraNegocioException("O veículo " + caminhao.getPlaca()
                        + " não atende ao tipo, carroceria ou rastreador exigidos pelo frete.");
            }
        } else if (!candidato.getTipoVeiculo().suporta(pesoKg)) {
            throw new RegraNegocioException("O veículo " + candidato.getTipoVeiculo().getDescricao()
                    + " não suporta uma carga de " + pesoKg + " kg.");
        }
    }

    private void exigirStatus(StatusFrete esperado, String mensagem) {
        if (status != esperado) {
            throw new IllegalStateException(mensagem);
        }
    }

    // ---------- Leitura ----------

    public UUID getId() {return id;}
    public Cliente getCliente() {return cliente;}
    public Empresa getEmpresa() {return empresa;}
    public Motorista getMotorista() {return motorista;}
    public Veiculo getVeiculo() {return veiculo;}
    public String getEspecieCarga() {return especieCarga;}
    public TipoCargaAntt getTipoCargaAntt() {return tipoCargaAntt;}
    public boolean isValorACombinar() {return valorACombinar;}
    public Set<TipoVeiculo> getVeiculosAceitos() {return Collections.unmodifiableSet(veiculosAceitos);}
    public Set<TipoCarroceria> getCarroceriasAceitas() {return Collections.unmodifiableSet(carroceriasAceitas);}
    public boolean isExigeRastreador() {return exigeRastreador;}
    public boolean isComplemento() {return complemento;}
    public boolean isPublicadoPorAgenciador() {return publicadoPorAgenciador;}
    public List<EventoFrete> getEventos() {return Collections.unmodifiableList(eventos);}
    public EnderecoFrete getPontoColeta() {return pontoColeta;}
    public EnderecoFrete getPontoEntrega() {return pontoEntrega;}
    public String getNomeDestinatario() {return nomeDestinatario;}
    public String getTelefoneDestinatario() {return telefoneDestinatario;}
    public String getDescricaoCarga() {return descricaoCarga;}
    public BigDecimal getPesoKg() {return pesoKg;}
    public BigDecimal getValor() {return valor;}
    public BigDecimal getAdicionalFeriado() {return adicionalFeriado;}
    public BigDecimal getValorTotal() {return valorTotal;}
    public LocalDate getDataColeta() {return dataColeta;}
    public boolean isFeriado() {return feriado;}
    public String getNomeFeriado() {return nomeFeriado;}
    public boolean isDomingo() {return domingo;}
    public BigDecimal getDistanciaKm() {return distanciaKm;}
    public Boolean getDistanciaEstimada() {return distanciaEstimada;}
    public StatusFrete getStatus() {return status;}
    public String getMotivoCancelamento() {return motivoCancelamento;}
    public Instant getCriadoEm() {return criadoEm;}
    public Instant getAceitoEm() {return aceitoEm;}
    public Instant getConcluidoEm() {return concluidoEm;}
    public Instant getPagoEm() {return pagoEm;}
    public BigDecimal getValorAcordado() {return valorAcordado;}
    public BigDecimal getAdiantamentoPercentual() {return adiantamentoPercentual;}
    public LocalDate getPrazoEntrega() {return prazoEntrega;}
}
