package br.com.fretai.frete.application.dto;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.empresa.domain.TipoEmpresa;
import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.frete.domain.EnderecoFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.frete.domain.TipoCarga;
import br.com.fretai.precificacao.domain.TipoCargaAntt;
import br.com.fretai.shared.seguranca.UsuarioLogado;
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
        CategoriaVeiculo categoriaVeiculo,
        TipoCarga tipoCarga,
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
        Preco preco,
        String motivoCancelamento,
        Instant criadoEm,
        Instant aceitoEm,
        Instant concluidoEm,
        Instant pagoEm) {

    public record Pessoa(UUID id, String nome) {
    }

    /**
     * Piso ANTT e alertas, calculados na publicação e refeitos no aceite.
     *
     * @param pisoMinimo            nulo sem tipo de carga ANTT, sem distância ou sem coeficiente cadastrado
     * @param coeficientesDeExemplo true = a tabela ainda não tem os números oficiais da ANTT
     * @param acimaDaMedia          possível golpe do "fretão": R$/km muito acima de fretes parecidos
     */
    public record Preco(BigDecimal pisoMinimo, Integer eixosConsiderados, Boolean coeficientesDeExemplo,
                        boolean abaixoDoPiso, boolean acimaDaMedia, BigDecimal mediaRotaPorKm) {
    }

    public record EmpresaResumo(UUID id, String razaoSocial, String nomeFantasia, TipoEmpresa tipo) {
    }

    public record MotoristaResumo(UUID id, String nome, CategoriaVeiculo tipoVeiculo, String placa) {
    }

    public record VeiculoResumo(UUID id, String placa, CategoriaVeiculo categoria, String modelo, TipoVeiculo tipo,
                                TipoCarroceria carroceria, Integer numeroEixos, boolean rastreador) {
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

        /** Para quem não participa do frete: o bairro e a cidade bastam para decidir; a porta, não. */
        static EnderecoResponse publico(EnderecoFrete e) {
            return new EnderecoResponse(null, null, null, null, e.getBairro(), e.getCidade(), e.getUf(), null, null,
                    null, null);
        }
    }

    /** Tudo: para quem já participa do frete, ou quando quem chama acabou de agir sobre ele. */
    public static FreteResponse de(Frete frete) {
        return montar(frete, true);
    }

    /**
     * Completo para o administrador, para quem contrata e para o motorista do frete. Para os outros (o
     * motorista que ainda está olhando), sem endereço completo, coordenadas e quem recebe.
     */
    public static FreteResponse de(Frete frete, UsuarioLogado quem) {
        return montar(frete, quem.isAdmin() || frete.ehContratante(quem) || frete.ehMotoristaDoFrete(quem));
    }

    /** Sem os dados privados: a vitrine da busca e dos fretes de volta. */
    public static FreteResponse publico(Frete frete) {
        return montar(frete, false);
    }

    private static FreteResponse montar(Frete frete, boolean completo) {
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
                v == null ? null : new VeiculoResumo(v.getId(), v.getPlaca(), v.getCategoria(), v.getModelo(),
                        v.getTipo(), v.getCarroceria(), v.getNumeroEixos(), v.isRastreador()),
                completo ? EnderecoResponse.de(frete.getPontoColeta()) : EnderecoResponse.publico(frete.getPontoColeta()),
                completo ? EnderecoResponse.de(frete.getPontoEntrega()) : EnderecoResponse.publico(frete.getPontoEntrega()),
                completo ? frete.getNomeDestinatario() : null,
                completo ? frete.getTelefoneDestinatario() : null,
                frete.getDescricaoCarga(),
                frete.getEspecieCarga(),
                frete.getTipoCargaAntt(),
                frete.getCategoriaVeiculo(),
                frete.getTipoCarga(),
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
                new Preco(frete.getPisoMinimo(), frete.getPisoEixos(), frete.getPisoExemplo(),
                        frete.isAlertaAbaixoPiso(), frete.isAlertaAcimaMedia(), frete.getMediaRotaPorKm()),
                frete.getMotivoCancelamento(),
                frete.getCriadoEm(),
                frete.getAceitoEm(),
                frete.getConcluidoEm(),
                frete.getPagoEm());
    }
}
