package br.com.Fretai.Frete;

import br.com.Fretai.Cep.Endereco;

public class EnderecoFrete {

    private Endereco enderecoBase;
    private String numero;
    private String complemento;
    private String pontoReferencia;

    public EnderecoFrete() {
    }

    public EnderecoFrete(Endereco enderecoBase, String numero) {
        this(enderecoBase, numero, null, null);
    }

    public EnderecoFrete(Endereco enderecoBase, String numero, String complemento, String pontoReferencia) {
        this.enderecoBase = enderecoBase;
        this.numero = numero;
        this.complemento = complemento;
        this.pontoReferencia = pontoReferencia;
    }

    public Endereco getEnderecoBase() {
        return enderecoBase;
    }

    public void setEnderecoBase(Endereco enderecoBase) {
        this.enderecoBase = enderecoBase;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getComplemento() {
        return complemento;
    }

    public void setComplemento(String complemento) {
        this.complemento = complemento;
    }

    public String getPontoReferencia() {
        return pontoReferencia;
    }

    public void setPontoReferencia(String pontoReferencia) {
        this.pontoReferencia = pontoReferencia;
    }

    public String getEnderecoCompleto() {
        if (enderecoBase == null) {
            return "Endereço não informado.";
        }

        StringBuilder sb = new StringBuilder();

        if (enderecoBase.getLogradouro() != null && !enderecoBase.getLogradouro().isBlank()) {
            sb.append(enderecoBase.getLogradouro());
        }

        if (numero != null && !numero.isBlank()) {
            sb.append(", nº ").append(numero);
        } else {
            sb.append(", S/N");
        }

        if (complemento != null && !complemento.isBlank()) {
            sb.append(" (").append(complemento).append(")");
        }

        if (enderecoBase.getBairro() != null && !enderecoBase.getBairro().isBlank()) {
            sb.append(" - ").append(enderecoBase.getBairro());
        }

        if (enderecoBase.getLocalidade() != null && !enderecoBase.getLocalidade().isBlank()) {
            sb.append(", ").append(enderecoBase.getLocalidade());
            if (enderecoBase.getUf() != null && !enderecoBase.getUf().isBlank()) {
                sb.append("/").append(enderecoBase.getUf());
            }
        }

        if (enderecoBase.getCep() != null && !enderecoBase.getCep().isBlank()) {
            sb.append(" - CEP: ").append(enderecoBase.getCep());
        }

        if (pontoReferencia != null && !pontoReferencia.isBlank()) {
            sb.append(" [Ref: ").append(pontoReferencia).append("]");
        }

        return sb.toString();
    }

    @Override
    public String toString() {
        return getEnderecoCompleto();
    }
}
