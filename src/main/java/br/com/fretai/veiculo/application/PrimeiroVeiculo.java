package br.com.fretai.veiculo.application;

import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaCadastrado;
import br.com.fretai.usuario.domain.MotoristaRepository;
import br.com.fretai.veiculo.domain.Veiculo;
import br.com.fretai.veiculo.domain.VeiculoRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * O tipo e a placa que o motorista informa no cadastro viram o primeiro veículo dele, sem os dados de
 * caminhão. Sem isso, a conta nova abriria o Perfil pedindo um veículo que a pessoa acabou de informar.
 */
@Component
class PrimeiroVeiculo {

    private final VeiculoRepository veiculoRepository;
    private final MotoristaRepository motoristaRepository;

    PrimeiroVeiculo(VeiculoRepository veiculoRepository, MotoristaRepository motoristaRepository) {
        this.veiculoRepository = veiculoRepository;
        this.motoristaRepository = motoristaRepository;
    }

    /**
     * Roda na transação do cadastro. Placa que já é veículo de outro motorista não trava a conta: ela sai
     * sem veículo, e o conflito aparece quando a pessoa tenta cadastrar a placa no Perfil.
     */
    @EventListener
    void criar(MotoristaCadastrado evento) {
        if (veiculoRepository.existsByPlaca(evento.placa())) {
            return;
        }
        Motorista motorista = motoristaRepository.getReferenceById(evento.motoristaId());
        veiculoRepository.save(new Veiculo(motorista, evento.placa(), evento.categoria(), null, null, null, null,
                null, false));
    }
}
