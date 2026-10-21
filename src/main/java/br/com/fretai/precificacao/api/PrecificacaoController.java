package br.com.fretai.precificacao.api;

import br.com.fretai.precificacao.application.PrecificacaoService;
import br.com.fretai.precificacao.application.dto.CalculoFreteRequest;
import br.com.fretai.precificacao.application.dto.CalculoFreteResponse;
import br.com.fretai.precificacao.application.dto.CoeficienteRequest;
import br.com.fretai.precificacao.application.dto.CoeficienteResponse;
import br.com.fretai.precificacao.domain.TipoCargaAntt;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PrecificacaoController {

    private final PrecificacaoService precificacaoService;

    public PrecificacaoController(PrecificacaoService precificacaoService) {
        this.precificacaoService = precificacaoService;
    }

    /** Custo da viagem (diesel + pedágio + outros), piso ANTT e margem sobre o valor oferecido. */
    @PostMapping("/api/calculadora/frete")
    public CalculoFreteResponse calcular(@Valid @RequestBody CalculoFreteRequest request) {
        return precificacaoService.calcular(request);
    }

    /** Tabela de coeficientes em uso. Linhas com "exemplo": true ainda não são os números da ANTT. */
    @GetMapping("/api/piso-antt")
    public List<CoeficienteResponse> listar() {
        return precificacaoService.listarCoeficientes();
    }

    @GetMapping("/api/piso-antt/{tipoCarga}/{eixos}")
    public CoeficienteResponse buscar(@PathVariable TipoCargaAntt tipoCarga, @PathVariable int eixos) {
        return precificacaoService.buscarCoeficiente(tipoCarga, eixos);
    }

    /** Só administrador: é assim que a tabela vigente da ANTT entra no sistema. */
    @PutMapping("/api/piso-antt/{tipoCarga}/{eixos}")
    @PreAuthorize("hasRole('ADMIN')")
    public CoeficienteResponse salvar(@PathVariable TipoCargaAntt tipoCarga, @PathVariable int eixos,
                                      @Valid @RequestBody CoeficienteRequest request) {
        return precificacaoService.salvarCoeficiente(tipoCarga, eixos, request);
    }
}
