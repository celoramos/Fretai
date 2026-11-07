package br.com.fretai.shared.exception;

/**
 * Vira HTTP 404 com o e-mail e o nome do Google: a pessoa confirmou quem é, mas ainda não tem conta.
 * O front usa os dois campos para abrir o cadastro já preenchido.
 */
public class CadastroNecessarioException extends RuntimeException {

    private final String email;
    private final String nome;

    public CadastroNecessarioException(String email, String nome) {
        super("Ainda não existe conta com esse Google. Complete o cadastro para continuar.");
        this.email = email;
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public String getNome() {
        return nome;
    }
}
