package br.com.Fretai.Frete;

import br.com.Fretai.Usuarios.CadastroCliente;
import br.com.Fretai.Usuarios.CadastroMotorista;

import java.time.LocalDateTime;
import java.util.UUID;

public class Frete {

    private String id;
    private CadastroCliente cliente;
    private CadastroMotorista motorista;
    private EnderecoFrete pontoColeta;
    private EnderecoFrete pontoEntrega;
    private String nomeDestinatario;
    private String telefoneDestinatario;
    private String descricaoCarga;
    private Double valor;
    private StatusFrete status;
    private LocalDateTime dataCriacao;
    private LocalDateTime dataConclusao;

    public Frete() {
        this.id = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.status = StatusFrete.PENDENTE;
        this.dataCriacao = LocalDateTime.now();
    }

    public Frete(CadastroCliente cliente, EnderecoFrete pontoColeta, EnderecoFrete pontoEntrega,
                 String nomeDestinatario, String telefoneDestinatario, String descricaoCarga, Double valor) {
        this();
        this.cliente = cliente;
        this.pontoColeta = pontoColeta;
        this.pontoEntrega = pontoEntrega;
        this.nomeDestinatario = nomeDestinatario;
        this.telefoneDestinatario = telefoneDestinatario;
        this.descricaoCarga = descricaoCarga;
        this.valor = valor;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public CadastroCliente getCliente() {
        return cliente;
    }

    public void setCliente(CadastroCliente cliente) {
        this.cliente = cliente;
    }

    public CadastroMotorista getMotorista() {
        return motorista;
    }

    public void setMotorista(CadastroMotorista motorista) {
        this.motorista = motorista;
    }

    public EnderecoFrete getPontoColeta() {
        return pontoColeta;
    }

    public void setPontoColeta(EnderecoFrete pontoColeta) {
        this.pontoColeta = pontoColeta;
    }

    public EnderecoFrete getPontoEntrega() {
        return pontoEntrega;
    }

    public void setPontoEntrega(EnderecoFrete pontoEntrega) {
        this.pontoEntrega = pontoEntrega;
    }

    public String getNomeDestinatario() {
        return nomeDestinatario;
    }

    public void setNomeDestinatario(String nomeDestinatario) {
        this.nomeDestinatario = nomeDestinatario;
    }

    public String getTelefoneDestinatario() {
        return telefoneDestinatario;
    }

    public void setTelefoneDestinatario(String telefoneDestinatario) {
        this.telefoneDestinatario = telefoneDestinatario;
    }

    public String getDescricaoCarga() {
        return descricaoCarga;
    }

    public void setDescricaoCarga(String descricaoCarga) {
        this.descricaoCarga = descricaoCarga;
    }

    public Double getValor() {
        return valor;
    }

    public void setValor(Double valor) {
        this.valor = valor;
    }

    public StatusFrete getStatus() {
        return status;
    }

    public void setStatus(StatusFrete status) {
        this.status = status;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDateTime dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    public LocalDateTime getDataConclusao() {
        return dataConclusao;
    }

    public void setDataConclusao(LocalDateTime dataConclusao) {
        this.dataConclusao = dataConclusao;
    }

    public String gerarResumoFrete() {
        StringBuilder sb = new StringBuilder();
        sb.append("=========================================\n");
        sb.append("FRETE #").append(id).append(" - ").append(status.getDescricao()).append("\n");
        sb.append("=========================================\n");
        sb.append("Solicitante: ").append(cliente != null ? cliente.getNome() : "Não informado").append("\n");
        sb.append("Motorista: ").append(motorista != null ? motorista.getNomeMotorista() + " (" + motorista.getTipoCarro() + ")" : "Aguardando aceitação").append("\n");
        sb.append("Valor: R$ ").append(valor != null ? String.format("%.2f", valor) : "0,00").append("\n");
        sb.append("Carga: ").append(descricaoCarga != null ? descricaoCarga : "Não especificada").append("\n");
        sb.append("-----------------------------------------\n");
        sb.append("📍 PONTO DE COLETA (REMETENTE):\n");
        sb.append("   ").append(pontoColeta != null ? pontoColeta.getEnderecoCompleto() : "Não informado").append("\n");
        sb.append("-----------------------------------------\n");
        sb.append("🏁 PONTO DE ENTREGA (DESTINATÁRIO):\n");
        sb.append("   Destinatário: ").append(nomeDestinatario != null ? nomeDestinatario : "Não informado");
        if (telefoneDestinatario != null) {
            sb.append(" (Tel: ").append(telefoneDestinatario).append(")");
        }
        sb.append("\n");
        sb.append("   Endereço: ").append(pontoEntrega != null ? pontoEntrega.getEnderecoCompleto() : "Não informado").append("\n");
        sb.append("=========================================\n");
        return sb.toString();
    }
}
