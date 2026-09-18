package br.com.Fretai.Cep;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.FileWriter;
import java.io.IOException;

public class GeradorArquivo {

    public void salvarJson(Endereco endereco) throws IOException {
        if (endereco == null || endereco.getCep() == null) {
            throw new IllegalArgumentException("Endereço ou CEP inválido para persistência.");
        }

        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String nomeArquivo = endereco.getCep().replaceAll("\\D", "") + ".json";

        try (FileWriter writer = new FileWriter(nomeArquivo)) {
            writer.write(gson.toJson(endereco));
        }
    }
}
