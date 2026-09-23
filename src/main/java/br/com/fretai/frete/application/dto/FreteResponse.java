package br.com.fretai.frete.application.dto;

import br.com.fretai.frete.domain.EnderecoFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.TipoVeiculo;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FreteResponse(
        UUID id,
        StatusFrete status,
        String statusDescricao,
        Pessoa cliente,
        MotoristaResumo motorista,
        EnderecoResponse coleta,
        EnderecoResponse entrega,
        String nomeDestinatario,
        String telefoneDestinatario,
        String descricaoCarga,
        BigDecimal pesoKg,
        BigDecimal valor,
        String motivoCancelamento,
        Instant criadoEm,
        Instant aceitoEm,
        Instant concluidoEm) {

    public record Pessoa(UUID id, String nome) {
    }

    public record MotoristaResumo(UUID id, String nome, TipoVeiculo tipoVeiculo, String placa) {
    }

    public record EnderecoResponse(String cep, String logradouro, String numero, String complemento,
                                   String bairro, String cidade, String uf, String pontoReferencia,
                                   String enderecoCompleto) {

        static EnderecoResponse de(EnderecoFrete e) {
            return new EnderecoResponse(e.getCep(), e.getLogradouro(), e.getNumero(), e.getComplemento(),
                    e.getBairro(), e.getCidade(), e.getUf(), e.getPontoReferencia(), e.getEnderecoCompleto());
        }
    }

    public static FreteResponse de(Frete frete) {
        Motorista m = frete.getMotorista();
        return new FreteResponse(
                frete.getId(),
                frete.getStatus(),
                frete.getStatus().getDescricao(),
                new Pessoa(frete.getCliente().getId(), frete.getCliente().getNome()),
                m == null ? null : new MotoristaResumo(m.getId(), m.getNome(), m.getTipoVeiculo(), m.getPlaca()),
                EnderecoResponse.de(frete.getPontoColeta()),
                EnderecoResponse.de(frete.getPontoEntrega()),
                frete.getNomeDestinatario(),
                frete.getTelefoneDestinatario(),
                frete.getDescricaoCarga(),
                frete.getPesoKg(),
                frete.getValor(),
                frete.getMotivoCancelamento(),
                frete.getCriadoEm(),
                frete.getAceitoEm(),
                frete.getConcluidoEm());
    }
}
