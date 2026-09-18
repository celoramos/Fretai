package br.com.Fretai;

import java.net.URI;
import java.util.Scanner;
import java.io.IOException;
import com.google.gson.Gson;
import java.text.Normalizer;
import java.util.regex.Pattern;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import com.google.gson.GsonBuilder;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
	public class RemoverAcentos {
		public static String tirarAcentos(String texto) {
			if (texto == null) {
				return null;
			}
			// Normaliza a string para a forma NFD (separa a letra do acento)
			String normalizado = Normalizer.normalize(texto, Normalizer.Form.NFD);
			// Remove os caracteres diacríticos (os acentos)
			Pattern padrao = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
			return padrao.matcher(normalizado).replaceAll("");
		}
}
	public static void main(String[] args) {
		Scanner scanner = new Scanner(System.in);
		SpringApplication.run(Application.class, args);
		System.out.println("Inicializando Fretai v0.1.");
		System.out.println("Você já tem cadastro no Fretai?");
		scanner.nextLine();

		if (scanner.nextLine().equalsIgnoreCase("nao")) {
			System.out.println("Vamos começar o cadastro no nosso site, precisamos que insira alguns dados.");

		}
	}
}
