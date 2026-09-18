package br.com.Fretai.Verificacoes;
import br.com.Fretai.Usuarios.CadastroCliente;

import java.util.Scanner;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class VerificarEmail extends CadastroCliente {
    private String email;

    public VerificarEmail(String email) {
        this.email = email;
    }

    public boolean isEmailValid() {
        String emailPattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        Pattern pattern = Pattern.compile(emailPattern);
        Matcher matcher = pattern.matcher(this.email);
        return matcher.matches();
    }
}
