package br.com.fretai.empresa.api;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.empresa.domain.EmpresaGateway;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** Consulta de CNPJ para o formulário de cadastro de cliente PJ preencher os dados sozinho. */
@RestController
public class EmpresaController {

    private final EmpresaGateway empresaGateway;

    public EmpresaController(EmpresaGateway empresaGateway) {
        this.empresaGateway = empresaGateway;
    }

    @GetMapping("/api/empresas/{cnpj}")
    public Empresa buscar(@PathVariable String cnpj) {
        return empresaGateway.buscarPorCnpj(cnpj);
    }
}
