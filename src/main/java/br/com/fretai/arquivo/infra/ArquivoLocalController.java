package br.com.fretai.arquivo.infra;

import br.com.fretai.arquivo.domain.TipoArquivo;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * Entrega os arquivos do armazenamento local para quem tem um link assinado.
 * Faz o papel da URL pré-assinada do S3: a autorização está no próprio link,
 * que só é gerado depois da checagem de permissão (e do registro de acesso).
 *
 * Fica na infra porque só existe com o provedor local.
 */
@RestController
@ConditionalOnProperty(name = "fretai.arquivos.provedor", havingValue = "local", matchIfMissing = true)
class ArquivoLocalController {

    private final LocalArmazenamentoArquivos armazenamento;

    ArquivoLocalController(LocalArmazenamentoArquivos armazenamento) {
        this.armazenamento = armazenamento;
    }

    @GetMapping("/api/arquivos/{token}")
    ResponseEntity<byte[]> baixar(@PathVariable String token) {
        return armazenamento.abrir(token)
                .map(ArquivoLocalController::resposta)
                // Mesmo status para token forjado, expirado ou arquivo inexistente: não ajuda quem está testando links.
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    private static ResponseEntity<byte[]> resposta(Path arquivo) {
        try {
            byte[] conteudo = Files.readAllBytes(arquivo);
            MediaType tipo = TipoArquivo.detectar(conteudo).map(t -> MediaType.parseMediaType(t.getContentType()))
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);
            return ResponseEntity.ok()
                    .contentType(tipo)
                    .cacheControl(CacheControl.noStore())
                    .header("X-Content-Type-Options", "nosniff")
                    .body(conteudo);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
