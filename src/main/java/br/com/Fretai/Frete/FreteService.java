package br.com.Fretai.Frete;

import br.com.Fretai.Cep.ConsultaCep;
import br.com.Fretai.Cep.Endereco;
import br.com.Fretai.Usuarios.CadastroCliente;
import br.com.Fretai.Usuarios.CadastroMotorista;
import java.time.LocalDateTime;

public class FreteService {

    private final ConsultaCep consultaCep;

    public FreteService() {
        this.consultaCep = new ConsultaCep();
    }

    public FreteService(ConsultaCep consultaCep) {
        this.consultaCep = consultaCep;
    }

    public Frete solicitarFrete(CadastroCliente cliente,
                                String cepOrigem, String numOrigem, String compOrigem, String refOrigem,
                                String cepDestino, String numDestino, String compDestino, String refDestino,
                                String nomeDestinatario, String telefoneDestinatario,
                                String descricaoCarga, Double valor) {
        if (cliente == null) {
            throw new IllegalArgumentException("Cliente solicitante é obrigatório.");
        }

        Endereco enderecoOrigem = consultaCep.buscaEndereco(cepOrigem);
        Endereco enderecoDestino = consultaCep.buscaEndereco(cepDestino);

        EnderecoFrete pontoColeta = new EnderecoFrete(enderecoOrigem, numOrigem, compOrigem, refOrigem);
        EnderecoFrete pontoEntrega = new EnderecoFrete(enderecoDestino, numDestino, compDestino, refDestino);

        return new Frete(cliente, pontoColeta, pontoEntrega, nomeDestinatario, telefoneDestinatario, descricaoCarga, valor);
    }

    public void atribuirMotorista(Frete frete, CadastroMotorista motorista) {
        if (frete == null) {
            throw new IllegalArgumentException("Frete não pode ser nulo.");
        }
        if (motorista == null) {
            throw new IllegalArgumentException("Motorista não pode ser nulo.");
        }
        if (frete.getStatus() != StatusFrete.PENDENTE) {
            throw new IllegalStateException("Apenas fretes pendentes podem receber motorista.");
        }

        frete.setMotorista(motorista);
        frete.setStatus(StatusFrete.ACEITO);
    }

    public void iniciarTransporte(Frete frete) {
        if (frete == null) {
            throw new IllegalArgumentException("Frete não pode ser nulo.");
        }
        if (frete.getStatus() != StatusFrete.ACEITO) {
            throw new IllegalStateException("Para iniciar o transporte, o frete deve estar aceito por um motorista.");
        }

        frete.setStatus(StatusFrete.EM_TRANSITO);
    }

    public void concluirEntrega(Frete frete) {
        if (frete == null) {
            throw new IllegalArgumentException("Frete não pode ser nulo.");
        }
        if (frete.getStatus() != StatusFrete.EM_TRANSITO) {
            throw new IllegalStateException("Para concluir a entrega, a carga deve estar em trânsito.");
        }

        frete.setStatus(StatusFrete.ENTREGUE);
        frete.setDataConclusao(LocalDateTime.now());
    }

    public void cancelarFrete(Frete frete, String motivo) {
        if (frete == null) {
            throw new IllegalArgumentException("Frete não pode ser nulo.");
        }
        if (frete.getStatus() == StatusFrete.ENTREGUE) {
            throw new IllegalStateException("Não é possível cancelar um frete já entregue.");
        }
        if (frete.getStatus() == StatusFrete.CANCELADO) {
            throw new IllegalStateException("Este frete já se encontra cancelado.");
        }

        frete.setStatus(StatusFrete.CANCELADO);
        frete.setDataConclusao(LocalDateTime.now());
    }
}
