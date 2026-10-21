package br.com.fretai.frete.application.dto;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.frete.domain.EnderecoFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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
        BigDecimal adicionalFeriado,
        BigDecimal valorTotal,
        LocalDate dataColeta,
        boolean feriado,
        String nomeFeriado,
        boolean domingo,
        BigDecimal distanciaKm,
        Boolean distanciaEstimada,
        String motivoCancelamento,
        Instant criadoEm,
        Instant aceitoEm,
        Instant concluidoEm) {

    public record Pessoa(UUID id, String nome) {
    }

    public record MotoristaResumo(UUID id, String nome, CategoriaVeiculo tipoVeiculo, String placa) {
    }

    public record EnderecoResponse(String cep, String logradouro, String numero, String complemento,
                                   String bairro, String cidade, String uf, String pontoReferencia,
                                   String enderecoCompleto, Double latitude, Double longitude) {

        static EnderecoResponse de(EnderecoFrete e) {
            Coordenadas c = e.getCoordenadas().orElse(null);
            return new EnderecoResponse(e.getCep(), e.getLogradouro(), e.getNumero(), e.getComplemento(),
                    e.getBairro(), e.getCidade(), e.getUf(), e.getPontoReferencia(), e.getEnderecoCompleto(),
                    c == null ? null : c.latitude(), c == null ? null : c.longitude());
        }
    }

    public static FreteResponse de(Frete frete) {
        Motorista m = frete.getMotorista();
        return new FreteResponse(
                frete.getId(),
                frete.getStatus(),
                frete.getStatus().getDescricao(),
                frete.getCliente() == null ? null : new Pessoa(frete.getCliente().getId(), frete.getCliente().getNome()),
                m == null ? null : new MotoristaResumo(m.getId(), m.getNome(), m.getTipoVeiculo(), m.getPlaca()),
                EnderecoResponse.de(frete.getPontoColeta()),
                EnderecoResponse.de(frete.getPontoEntrega()),
                frete.getNomeDestinatario(),
                frete.getTelefoneDestinatario(),
                frete.getDescricaoCarga(),
                frete.getPesoKg(),
                frete.getValor(),
                frete.getAdicionalFeriado(),
                frete.getValorTotal(),
                frete.getDataColeta(),
                frete.isFeriado(),
                frete.getNomeFeriado(),
                frete.isDomingo(),
                frete.getDistanciaKm(),
                frete.getDistanciaEstimada(),
                frete.getMotivoCancelamento(),
                frete.getCriadoEm(),
                frete.getAceitoEm(),
                frete.getConcluidoEm());
    }
}
