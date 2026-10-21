package br.com.fretai.frete.application.dto;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.empresa.domain.TipoEmpresa;
import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.frete.domain.EnderecoFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.frete.domain.TipoCargaAntt;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import br.com.fretai.veiculo.domain.Veiculo;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

/**
 * @param cliente contratante pessoa física (nulo nos fretes de empresa)
 * @param empresa contratante pessoa jurídica (nulo nos fretes de cliente)
 * @param veiculo caminhão escolhido no aceite (só nos fretes de empresa)
 * @param valorAcordado valor da proposta aceita; é sobre ele que o pagamento é calculado
 */
public record FreteResponse(
        UUID id,
        StatusFrete status,
        String statusDescricao,
        Pessoa cliente,
        EmpresaResumo empresa,
        MotoristaResumo motorista,
        VeiculoResumo veiculo,
        EnderecoResponse coleta,
        EnderecoResponse entrega,
        String nomeDestinatario,
        String telefoneDestinatario,
        String descricaoCarga,
        String especieCarga,
        TipoCargaAntt tipoCargaAntt,
        BigDecimal pesoKg,
        BigDecimal valor,
        boolean valorACombinar,
        BigDecimal adicionalFeriado,
        BigDecimal valorTotal,
        Set<TipoVeiculo> veiculosAceitos,
        Set<TipoCarroceria> carroceriasAceitas,
        boolean exigeRastreador,
        boolean complemento,
        boolean publicadoPorAgenciador,
        LocalDate dataColeta,
        boolean feriado,
        String nomeFeriado,
        boolean domingo,
        BigDecimal distanciaKm,
        Boolean distanciaEstimada,
        BigDecimal valorAcordado,
        BigDecimal adiantamentoPercentual,
        LocalDate prazoEntrega,
        String motivoCancelamento,
        Instant criadoEm,
        Instant aceitoEm,
        Instant concluidoEm,
        Instant pagoEm) {

    public record Pessoa(UUID id, String nome) {
    }

    public record EmpresaResumo(UUID id, String razaoSocial, String nomeFantasia, TipoEmpresa tipo) {
    }

    public record MotoristaResumo(UUID id, String nome, CategoriaVeiculo tipoVeiculo, String placa) {
    }

    public record VeiculoResumo(UUID id, String placa, TipoVeiculo tipo, TipoCarroceria carroceria,
                                int numeroEixos, boolean rastreador) {
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
        Empresa e = frete.getEmpresa();
        Veiculo v = frete.getVeiculo();
        return new FreteResponse(
                frete.getId(),
                frete.getStatus(),
                frete.getStatus().getDescricao(),
                frete.getCliente() == null ? null : new Pessoa(frete.getCliente().getId(), frete.getCliente().getNome()),
                e == null ? null : new EmpresaResumo(e.getId(), e.getRazaoSocial(), e.getNomeFantasia(), e.getTipo()),
                m == null ? null : new MotoristaResumo(m.getId(), m.getNome(), m.getTipoVeiculo(), m.getPlaca()),
                v == null ? null : new VeiculoResumo(v.getId(), v.getPlaca(), v.getTipo(), v.getCarroceria(),
                        v.getNumeroEixos(), v.isRastreador()),
                EnderecoResponse.de(frete.getPontoColeta()),
                EnderecoResponse.de(frete.getPontoEntrega()),
                frete.getNomeDestinatario(),
                frete.getTelefoneDestinatario(),
                frete.getDescricaoCarga(),
                frete.getEspecieCarga(),
                frete.getTipoCargaAntt(),
                frete.getPesoKg(),
                frete.getValor(),
                frete.isValorACombinar(),
                frete.getAdicionalFeriado(),
                frete.getValorTotal(),
                Set.copyOf(frete.getVeiculosAceitos()),
                Set.copyOf(frete.getCarroceriasAceitas()),
                frete.isExigeRastreador(),
                frete.isComplemento(),
                frete.isPublicadoPorAgenciador(),
                frete.getDataColeta(),
                frete.isFeriado(),
                frete.getNomeFeriado(),
                frete.isDomingo(),
                frete.getDistanciaKm(),
                frete.getDistanciaEstimada(),
                frete.getValorAcordado(),
                frete.getAdiantamentoPercentual(),
                frete.getPrazoEntrega(),
                frete.getMotivoCancelamento(),
                frete.getCriadoEm(),
                frete.getAceitoEm(),
                frete.getConcluidoEm(),
                frete.getPagoEm());
    }
}
