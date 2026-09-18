package br.com.Fretai.Cep;

import java.io.IOException;
import java.util.Scanner;

public class Principal {
    public static void main(String[] args) {
        ConsultaCep consulta = new ConsultaCep();
        System.out.print("Digite o CEP: ");
        try (Scanner scanner = new Scanner(System.in)) {
            String cep = scanner.nextLine();

            Endereco novoEndereco = consulta.buscaEndereco(cep);
            System.out.println("Logradouro: " + novoEndereco.getLogradouro());
            System.out.println("Bairro: " + novoEndereco.getBairro());
            System.out.println("Cidade: " + novoEndereco.getLocalidade() + " - " + novoEndereco.getUf());
            System.out.println("CEP: " + novoEndereco.getCep());

            GeradorArquivo gerador = new GeradorArquivo();
            try {
                gerador.salvarJson(novoEndereco);
                System.out.println("Arquivo salvo: " + novoEndereco.getCep() + ".json");
            } catch (IOException ioe) {
                System.out.println("Falha ao salvar arquivo: " + ioe.getMessage());
            }

        } catch (Exception e) {
            System.out.println("Erro: " + e.getMessage());
        }
    }
}