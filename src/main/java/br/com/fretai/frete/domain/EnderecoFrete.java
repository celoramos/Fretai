package br.com.fretai.frete.domain;

import br.com.fretai.endereco.domain.Endereco;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Endereço de coleta ou entrega de um frete. É uma cópia (snapshot) do endereço
 * no momento da solicitação: se o ViaCEP mudar o nome da rua amanhã, o histórico
 * do frete continua mostrando o que valia quando ele foi criado.
 */
@Embeddable
public class EnderecoFrete {

    @Column(nullable = false, length = 8)
    private String cep;
    private String logradouro;
    @Column(length = 20)
    private String numero;
    private String complemento;
    private String bairro;
    private String cidade;
    @Column(length = 2)
    private String uf;
    private String pontoReferencia;

    protected EnderecoFrete() {
    }

    public EnderecoFrete(Endereco base, String numero, String complemento, String pontoReferencia) {
        this.cep = base.cep() != null ? base.cep().replaceAll("\\D", "") : null;
        this.logradouro = base.logradouro();
        this.bairro = base.bairro();
        this.cidade = base.localidade();
        this.uf = base.uf();
        this.numero = numero;
        this.complemento = complemento;
        this.pontoReferencia = pontoReferencia;
    }

    public String getCep() {return cep;}
    public String getLogradouro() {return logradouro;}
    public String getNumero() {return numero;}
    public String getComplemento() {return complemento;}
    public String getBairro() {return bairro;}
    public String getCidade() {return cidade;}
    public String getUf() {return uf;}
    public String getPontoReferencia() {return pontoReferencia;}

    public String getEnderecoCompleto() {
        StringBuilder sb = new StringBuilder();

        if (temTexto(logradouro)) {
            sb.append(logradouro);
        }

        if (temTexto(numero)) {
            sb.append(", nº ").append(numero);
        } else {
            sb.append(", S/N");
        }

        if (temTexto(complemento)) {
            sb.append(" (").append(complemento).append(")");
        }

        if (temTexto(bairro)) {
            sb.append(" - ").append(bairro);
        }

        if (temTexto(cidade)) {
            sb.append(", ").append(cidade);
            if (temTexto(uf)) {
                sb.append("/").append(uf);
            }
        }

        if (temTexto(cep)) {
            sb.append(" - CEP: ").append(cep.substring(0, 5)).append("-").append(cep.substring(5));
        }

        if (temTexto(pontoReferencia)) {
            sb.append(" [Ref: ").append(pontoReferencia).append("]");
        }

        return sb.toString();
    }

    private static boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    @Override
    public String toString() {
        return getEnderecoCompleto();
    }
}
