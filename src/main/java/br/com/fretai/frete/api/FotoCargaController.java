package br.com.fretai.frete.api;

import br.com.fretai.frete.application.FotoCargaService;
import br.com.fretai.frete.application.dto.FotoCargaResponse;
import br.com.fretai.shared.seguranca.UsuarioLogado;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class FotoCargaController {

    private final FotoCargaService fotoCargaService;

    public FotoCargaController(FotoCargaService fotoCargaService) {
        this.fotoCargaService = fotoCargaService;
    }

    /** multipart/form-data com a parte "foto" (JPEG ou PNG), uma por chamada. */
    @PostMapping(value = "/api/fretes/{freteId}/fotos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CLIENTE')")
    @ResponseStatus(HttpStatus.CREATED)
    public FotoCargaResponse enviar(@PathVariable UUID freteId, @RequestPart MultipartFile foto,
                                    @AuthenticationPrincipal UsuarioLogado quem) throws IOException {
        return fotoCargaService.enviar(freteId, foto.getBytes(), quem);
    }

    @GetMapping("/api/fretes/{freteId}/fotos")
    public List<FotoCargaResponse> listar(@PathVariable UUID freteId) {
        return fotoCargaService.listar(freteId);
    }
}
