package br.com.Fretai.Usuarios;

public class CadastroCliente {
    private String cpf;
    private String nome;
    static String email;
    private String senha;
    private int telefone;
    private String endereco;


    public void setCpf(String cpf) {
        this.cpf = cpf;
    }
    public void setNome(String nome) {
        this.nome = nome;
    }
    public void setSenha(String senha) {
        this.senha = senha;
    }
    public void setTelefone(int telefone) {
        this.telefone = telefone;
    }
    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }


    public String getCpf() {
        return cpf;
    }
    public String getNome() {
        return nome;
    }
    public String getSenha() {
        return senha;
    }
    public int getTelefone() {
        return telefone;
    }
    public String getEndereco() {
        return endereco;
    }

}
