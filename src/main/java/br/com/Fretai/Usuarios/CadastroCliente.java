package br.com.Fretai.Usuarios;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CPF;

public class CadastroCliente {
    @NotBlank(message = "O CPF é obrigatório.")
    @CPF(message = "CPF inválido.")
    private String cpf;

    @NotBlank(message = "O nome é obrigatório.")
    @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.")
    private String nome;

    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "Formato de e-mail inválido.")
    private String email;

    @NotBlank(message = "A senha é obrigatória.")
    @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres.")
    private String senha;

    @NotBlank(message = "O telefone é obrigatório.")
    private String telefone;

    @NotBlank(message = "É necessário informar o endereço.\nPara sabermos onde será o local de remetente da entrega")
    private String enderecoRemetente;

    @NotBlank(message = "É necessário informar o endereço de entrega.\nPara sabermos onde será o local de entrega da encomenda")
    private String enderecoEntrega;

    public CadastroCliente(String cpfCliente, String nomeCliente, String emailCliente, String senhaCliente, String telefoneCliente, String enderecoRemetente, String enderecoEntrega) {
        this.cpf = cpfCliente;
        this.nome = nomeCliente;
        this.email = emailCliente;
        this.senha = senhaCliente;
        this.telefone = telefoneCliente;
        this.enderecoRemetente = enderecoRemetente;
        this.enderecoEntrega = enderecoEntrega;
    }


    public void setCpf(String cpf) {
        this.cpf = cpf;
    }
    public void setNome(String nome) {
        this.nome = nome;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public void setSenha(String senha) {
        this.senha = senha;
    }
    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }
    public void setEnderecoRemetente(String enderecoRemetente) {
        this.enderecoRemetente = enderecoRemetente;
    }
    public void setEnderecoEntrega(String enderecoEntrega) {
        this.enderecoEntrega = enderecoEntrega;
    }


    public String getCpf() {
        return cpf;
    }
    public String getNome() {
        return nome;
    }
    public String getEmail() {
        return email;
    }
    public String getSenha() {
        return senha;
    }
    public String getTelefone() {
        return telefone;
    }
    public String getEnderecoRemetente() {
        return enderecoRemetente;
    }
    public String getEnderecoEntrega() {return enderecoEntrega;}
}
