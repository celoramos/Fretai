package br.com.fretai.entrega.api;

import br.com.fretai.entrega.application.CanhotoService;
import br.com.fretai.entrega.application.dto.CanhotoResponse;
import br.com.fretai.entrega.application.dto.ContestacaoRequest;
import br.com.fretai.entrega.application.dto.ResolucaoRequest;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class CanhotoController {

    private final CanhotoService canhotoService;

    public CanhotoController(CanhotoService canhotoService) {
        this.canhotoService = canhotoService;
    }

    /**
     * multipart/form-data: "foto" (JPEG/PNG da entrega), "assinatura" (PNG desenhado
     * na tela), "nomeRecebedor", "latitude" e "longitude" (GPS do celular).
     */
    @PostMapping(value = "/api/fretes/{freteId}/canhoto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('MOTORISTA')")
    @ResponseStatus(HttpStatus.CREATED)
    public CanhotoResponse registrar(@PathVariable UUID freteId,
                                     @RequestParam @NotBlank @Size(max = 100) String nomeRecebedor,
                                     @RequestParam @DecimalMin("-90") @DecimalMax("90") double latitude,
                                     @RequestParam @DecimalMin("-180") @DecimalMax("180") double longitude,
                                     @RequestPart MultipartFile foto, @RequestPart MultipartFile assinatura,
                                     @AuthenticationPrincipal UsuarioLogado quem) throws IOException {
        return canhotoService.registrar(freteId, nomeRecebedor, latitude, longitude, foto.getBytes(),
                assinatura.getBytes(), quem);
    }

    @GetMapping("/api/fretes/{freteId}/canhoto")
    public CanhotoResponse buscar(@PathVariable UUID freteId, @AuthenticationPrincipal UsuarioLogado quem) {
        return canhotoService.buscar(freteId, quem);
    }

    @PostMapping("/api/fretes/{freteId}/canhoto/contestacao")
    public CanhotoResponse contestar(@PathVariable UUID freteId, @Valid @RequestBody ContestacaoRequest request,
                                     @AuthenticationPrincipal UsuarioLogado quem) {
        return canhotoService.contestarComoContratante(freteId, request.motivo(), quem);
    }

    /** Público: o recebedor não tem conta. O código de 8 letras chega a ele por mensagem. */
    @PostMapping("/api/canhotos/contestacao")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void contestarComCodigo(@Valid @RequestBody ContestacaoRequest request) {
        canhotoService.contestarComCodigo(request.codigo(), request.motivo());
    }

    /** Fila do administrador: contestações que ainda não têm decisão. */
    @GetMapping("/api/canhotos/contestacoes")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CanhotoResponse> contestacoes() {
        return canhotoService.contestacoesAbertas();
    }

    @PostMapping("/api/fretes/{freteId}/canhoto/resolucao")
    @PreAuthorize("hasRole('ADMIN')")
    public CanhotoResponse resolver(@PathVariable UUID freteId, @Valid @RequestBody ResolucaoRequest request) {
        return canhotoService.resolver(freteId, request.resolucao(), request.observacao());
    }
}
