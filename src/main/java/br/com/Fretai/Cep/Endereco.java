package br.com.Fretai.Cep;

public class Endereco {
    private String cep;
    private String logradouro;
    private String complemento;
    private String unidade;
    private String bairro;
    private String localidade;
    private String uf;
    private String estado;
    private String regiao;
    private String ibge;
    private String gia;
    private String ddd;
    private String siafi;
    private Boolean erro;

    public Endereco() {
    }

    public Endereco(String cep, String logradouro, String complemento, String unidade, String bairro, String localidade, String uf, String estado, String regiao, String ibge, String gia, String ddd, String siafi) {
        this.cep = cep;
        this.logradouro = logradouro;
        this.complemento = complemento;
        this.unidade = unidade;
        this.bairro = bairro;
        this.localidade = localidade;
        this.uf = uf;
        this.estado = estado;
        this.regiao = regiao;
        this.ibge = ibge;
        this.gia = gia;
        this.ddd = ddd;
        this.siafi = siafi;
    }

    public String getCep() { return cep; }
    public String getLogradouro() { return logradouro; }
    public String getComplemento() { return complemento; }
    public String getUnidade() { return unidade; }
    public String getBairro() { return bairro; }
    public String getLocalidade() { return localidade; }
    public String getUf() { return uf; }
    public String getEstado() { return estado; }
    public String getRegiao() { return regiao; }
    public String getIbge() { return ibge; }
    public String getGia() { return gia; }
    public String getDdd() { return ddd; }
    public String getSiafi() { return siafi; }

    public void setUnidade(String unidade) { this.unidade = unidade; }
    public void setCep(String cep) { this.cep = cep; }
    public void setLogradouro(String logradouro) { this.logradouro = logradouro; }
    public void setComplemento(String complemento) { this.complemento = complemento; }
    public void setBairro(String bairro) { this.bairro = bairro; }
    public void setLocalidade(String localidade) { this.localidade = localidade; }
    public void setUf(String uf) { this.uf = uf; }
    public void setEstado(String estado) { this.estado = estado; }
    public void setRegiao(String regiao) { this.regiao = regiao; }
    public void setIbge(String ibge) { this.ibge = ibge; }
    public void setGia(String gia) { this.gia = gia; }
    public void setDdd(String ddd) { this.ddd = ddd; }
    public void setSiafi(String siafi) { this.siafi = siafi; }
    public Boolean getErro() { return erro; }
    public void setErro(Boolean erro) { this.erro = erro; }
    public boolean isErro() { return Boolean.TRUE.equals(erro); }

    public String getEnderecoFormatado() {
        StringBuilder sb = new StringBuilder();
        if (logradouro != null && !logradouro.isBlank()) {
            sb.append(logradouro);
        }
        if (bairro != null && !bairro.isBlank()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(bairro);
        }
        if (localidade != null && !localidade.isBlank()) {
            if (sb.length() > 0) sb.append(" - ");
            sb.append(localidade);
            if (uf != null && !uf.isBlank()) {
                sb.append("/").append(uf);
            }
        }
        if (cep != null && !cep.isBlank()) {
            if (sb.length() > 0) sb.append(", CEP: ");
            sb.append(cep);
        }
        return sb.toString();
    }

}