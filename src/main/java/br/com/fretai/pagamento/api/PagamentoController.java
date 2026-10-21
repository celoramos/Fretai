package br.com.fretai.pagamento.api;

import br.com.fretai.pagamento.application.PagamentoService;
import br.com.fretai.pagamento.application.dto.PagamentoResponse;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PagamentoController {

    private final PagamentoService pagamentoService;

    public PagamentoController(PagamentoService pagamentoService) {
        this.pagamentoService = pagamentoService;
    }

    /** O contratante gera o Pix depois do aceite. A resposta traz o copia-e-cola e o QR Code. */
    @PostMapping("/api/fretes/{freteId}/pagamento")
    @ResponseStatus(HttpStatus.CREATED)
    public PagamentoResponse gerarCobranca(@PathVariable UUID freteId, @AuthenticationPrincipal UsuarioLogado quem) {
        return pagamentoService.gerarCobranca(freteId, quem);
    }

    @GetMapping("/api/fretes/{freteId}/pagamento")
    public PagamentoResponse buscar(@PathVariable UUID freteId, @AuthenticationPrincipal UsuarioLogado quem) {
        return pagamentoService.buscar(freteId, quem);
    }

    /**
     * Chamado pelo PSP. Sem login: a autenticidade é conferida pelo gateway
     * (token/assinatura no cabeçalho). Sempre 200 para evento já processado,
     * senão o PSP reenviaria para sempre.
     */
    @PostMapping("/api/webhooks/pagamentos")
    public void webhook(@RequestBody String corpo, @RequestHeader HttpHeaders cabecalhos) {
        Map<String, String> normalizados = cabecalhos.toSingleValueMap().entrySet().stream()
                .collect(Collectors.toMap(e -> e.getKey().toLowerCase(Locale.ROOT), Map.Entry::getValue, (a, b) -> a));
        pagamentoService.processarWebhook(corpo, normalizados);
    }
}
