package br.com.Fretai.Cep;

import br.com.Fretai.Exception.CepNaoEncontradoException;
import com.google.gson.Gson;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class ConsultaCep {

    public Endereco buscaEndereco(String cep) {
        String cepTrim = (cep != null) ? cep.trim().replaceAll("\\D", "") : "";
        if (cepTrim.length() != 8) {
            throw new IllegalArgumentException("CEP inválido. Deve conter 8 dígitos numéricos.");
        }

        URI uri = URI.create("https://viacep.com.br/ws/" + cepTrim + "/json/");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri)
                .build();

        try {
            HttpResponse<String> response = HttpClient
                    .newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            Endereco endereco = new Gson().fromJson(response.body(), Endereco.class);
            if (endereco == null || endereco.isErro()) {
                throw new CepNaoEncontradoException("CEP não encontrado: " + cep);
            }

            return endereco;
        } catch (CepNaoEncontradoException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Não consegui obter o endereço a partir desse CEP: " + cep, e);
        }
    }
}