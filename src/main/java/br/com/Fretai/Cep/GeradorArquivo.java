package br.com.Fretai.Cep;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.FileWriter;
import java.io.IOException;

public class GeradorArquivo {
    public void salvarJson(Endereco endereco) throws IOException {
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        try (FileWriter writer = new FileWriter(endereco.getCep() + ".json")) {
            //writer.write(gson.toJson(endereco));
        }
    }
}
