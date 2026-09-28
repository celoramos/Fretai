package br.com.fretai.support;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Servidor HTTP local para testar os clients das APIs externas sem internet.
 * Usa o HttpServer que já vem no JDK, então não precisa de WireMock nem de
 * outra dependência. Cada teste define a resposta e depois confere o que chegou.
 */
public final class ServidorHttpFalso implements AutoCloseable {

    private final HttpServer servidor;
    private final List<URI> requisicoes = new ArrayList<>();
    private final List<String> userAgents = new ArrayList<>();
    private volatile int status = 200;
    private volatile String corpo = "{}";

    public ServidorHttpFalso() {
        try {
            servidor = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        servidor.createContext("/", troca -> {
            synchronized (requisicoes) {
                requisicoes.add(troca.getRequestURI());
                userAgents.add(troca.getRequestHeaders().getFirst("User-Agent"));
            }
            byte[] bytes = corpo.getBytes(StandardCharsets.UTF_8);
            troca.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
            troca.sendResponseHeaders(status, bytes.length == 0 ? -1 : bytes.length);
            if (bytes.length > 0) {
                troca.getResponseBody().write(bytes);
            }
            troca.close();
        });
        servidor.start();
    }

    public String url() {
        return "http://127.0.0.1:" + servidor.getAddress().getPort();
    }

    public ServidorHttpFalso responder(int status, String corpo) {
        this.status = status;
        this.corpo = corpo;
        return this;
    }

    public List<URI> requisicoes() {
        synchronized (requisicoes) {
            return List.copyOf(requisicoes);
        }
    }

    public String ultimoUserAgent() {
        synchronized (requisicoes) {
            return userAgents.getLast();
        }
    }

    @Override
    public void close() {
        servidor.stop(0);
    }
}
