package br.com.fretai.arquivo.infra;

import br.com.fretai.arquivo.domain.ArmazenamentoArquivos;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Arquivos no disco local, servidos por {@code GET /api/arquivos/{token}} com
 * token assinado. Padrão em desenvolvimento e testes.
 */
@Component
@ConditionalOnProperty(name = "fretai.arquivos.provedor", havingValue = "local", matchIfMissing = true)
public class LocalArmazenamentoArquivos implements ArmazenamentoArquivos {

    private final Path raiz;
    private final String urlBase;
    private final AssinadorUrl assinador;

    @Autowired
    LocalArmazenamentoArquivos(@Value("${fretai.arquivos.local.diretorio}") Path raiz,
                               @Value("${fretai.arquivos.local.url-base}") String urlBase,
                               @Value("${fretai.arquivos.segredo:}") String segredo) {
        this(raiz, urlBase, new AssinadorUrl(segredo, Clock.systemUTC()));
    }

    LocalArmazenamentoArquivos(Path raiz, String urlBase, AssinadorUrl assinador) {
        this.raiz = raiz.toAbsolutePath().normalize();
        this.urlBase = urlBase.endsWith("/") ? urlBase.substring(0, urlBase.length() - 1) : urlBase;
        this.assinador = assinador;
    }

    @Override
    public void salvar(String chave, byte[] conteudo, String contentType) {
        Path destino = caminho(chave);
        try {
            Files.createDirectories(destino.getParent());
            Files.write(destino, conteudo);
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao gravar arquivo " + chave, e);
        }
    }

    @Override
    public URI urlAssinada(String chave, Duration validade) {
        return URI.create(urlBase + "/api/arquivos/" + assinador.assinar(chave, validade));
    }

    /** @return o arquivo, se o token é válido, não expirou e o arquivo existe */
    Optional<Path> abrir(String token) {
        return assinador.validar(token).map(this::caminho).filter(Files::isRegularFile);
    }

    /** A chave é gerada pelo sistema, mas mesmo assim nunca sai da pasta raiz. */
    private Path caminho(String chave) {
        Path destino = raiz.resolve(chave).normalize();
        if (!destino.startsWith(raiz)) {
            throw new IllegalArgumentException("Chave de arquivo inválida.");
        }
        return destino;
    }
}
