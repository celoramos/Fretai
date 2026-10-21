package br.com.fretai.empresa.application.dto;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.empresa.domain.TipoEmpresa;
import java.time.Instant;
import java.util.UUID;

/** CNPJ é dado público; pode aparecer. Os dados do responsável, não. */
public record EmpresaResponse(UUID id, String cnpj, String razaoSocial, String nomeFantasia, TipoEmpresa tipo,
                              String telefone, boolean ativa, Instant criadoEm) {

    public static EmpresaResponse de(Empresa empresa) {
        return new EmpresaResponse(empresa.getId(), empresa.getCnpj(), empresa.getRazaoSocial(),
                empresa.getNomeFantasia(), empresa.getTipo(), empresa.getTelefone(), empresa.isAtiva(),
                empresa.getCriadoEm());
    }
}
