package br.com.fretai.documento.api;

import br.com.fretai.documento.application.DocumentoService;
import br.com.fretai.documento.application.dto.AcessoDocumentoResponse;
import br.com.fretai.documento.application.dto.DocumentoResponse;
import br.com.fretai.documento.application.dto.LinkDocumentoResponse;
import br.com.fretai.documento.application.dto.RecusaDocumentoRequest;
import br.com.fretai.documento.domain.TipoDocumento;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class DocumentoController {

    private final DocumentoService documentoService;

    public DocumentoController(DocumentoService documentoService) {
        this.documentoService = documentoService;
    }

    /** multipart/form-data com o campo "arquivo" (PDF, PNG ou JPEG). */
    @PostMapping(value = "/api/fretes/{freteId}/documentos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('MOTORISTA')")
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentoResponse enviar(@PathVariable UUID freteId, @RequestParam TipoDocumento tipo,
                                    @RequestPart MultipartFile arquivo,
                                    @AuthenticationPrincipal UsuarioLogado quem) throws IOException {
        return documentoService.enviar(freteId, tipo, arquivo.getBytes(), quem);
    }

    @GetMapping("/api/fretes/{freteId}/documentos")
    public List<DocumentoResponse> doFrete(@PathVariable UUID freteId, @AuthenticationPrincipal UsuarioLogado quem) {
        return documentoService.doFrete(freteId, quem);
    }

    /** Gera um link temporário e registra quem pediu. POST, e não GET, porque cada chamada grava um acesso. */
    @PostMapping("/api/documentos/{id}/link")
    public LinkDocumentoResponse link(@PathVariable UUID id, @AuthenticationPrincipal UsuarioLogado quem,
                                      HttpServletRequest http) {
        return documentoService.gerarLink(id, quem, http.getRemoteAddr());
    }

    @GetMapping("/api/documentos/{id}/acessos")
    public List<AcessoDocumentoResponse> acessos(@PathVariable UUID id, @AuthenticationPrincipal UsuarioLogado quem) {
        return documentoService.acessos(id, quem);
    }

    /** Fila do administrador: documentos que ninguém conferiu ainda. */
    @GetMapping("/api/documentos/pendentes")
    @PreAuthorize("hasRole('ADMIN')")
    public List<DocumentoResponse> pendentes() {
        return documentoService.pendentes();
    }

    @PostMapping("/api/documentos/{id}/verificacao")
    @PreAuthorize("hasRole('ADMIN')")
    public DocumentoResponse verificar(@PathVariable UUID id, @AuthenticationPrincipal UsuarioLogado quem) {
        return documentoService.verificar(id, quem);
    }

    /** Foto ilegível, documento vencido ou de outra pessoa: sai da fila, e o motorista lê o motivo. */
    @PostMapping("/api/documentos/{id}/recusa")
    @PreAuthorize("hasRole('ADMIN')")
    public DocumentoResponse recusar(@PathVariable UUID id, @Valid @RequestBody RecusaDocumentoRequest request,
                                     @AuthenticationPrincipal UsuarioLogado quem) {
        return documentoService.recusar(id, request.motivo(), quem);
    }
}
