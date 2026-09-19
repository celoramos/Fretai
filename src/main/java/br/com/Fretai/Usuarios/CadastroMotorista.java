package br.com.Fretai.Usuarios;

public class CadastroMotorista {

    private String cpfMotorista;
    private String nomeMotorista;
    private String emailMotorista;
    private String senhaMotorista;
    private String telefoneMotorista;
    private String tipoCarro;

    public CadastroMotorista() {
    }

    public CadastroMotorista(String cpfMotorista, String nomeMotorista, String emailMotorista, String senhaMotorista, String telefoneMotorista, String tipoCarro) {
        this.cpfMotorista = cpfMotorista;
        this.nomeMotorista = nomeMotorista;
        this.emailMotorista = emailMotorista;
        this.senhaMotorista = senhaMotorista;
        this.telefoneMotorista = telefoneMotorista;
        this.tipoCarro = tipoCarro;
    }

    public void setCpfMotorista(String cpfMotorista) {
        this.cpfMotorista = cpfMotorista;
    }
    public void setNomeMotorista(String nomeMotorista) {
        this.nomeMotorista = nomeMotorista;
    }
    public void setEmailMotorista(String emailMotorista) {
        this.emailMotorista = emailMotorista;
    }
    public void setSenhaMotorista(String senhaMotorista) {
        this.senhaMotorista = senhaMotorista;
    }
    public void setTelefoneMotorista(String telefoneMotorista) {
        this.telefoneMotorista = telefoneMotorista;
    }
    public void setTipoCarro(String tipoCarro) {
        this.tipoCarro = tipoCarro;
    }


    public String getCpfMotorista() {
        return cpfMotorista;
    }
    public String getNomeMotorista() {
        return nomeMotorista;
    }
    public String getEmailMotorista() {
        return emailMotorista;
    }
    public String getSenhaMotorista() {
        return senhaMotorista;
    }
    public String getTelefoneMotorista() {
        return telefoneMotorista;
    }
    public String getTipoCarro() {
        return tipoCarro;
    }
}
