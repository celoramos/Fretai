package br.com.fretai.veiculo.application;

import br.com.fretai.shared.exception.ConflitoException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import br.com.fretai.veiculo.application.dto.VeiculoRequest;
import br.com.fretai.veiculo.application.dto.VeiculoResponse;
import br.com.fretai.veiculo.domain.Veiculo;
import br.com.fretai.veiculo.domain.VeiculoRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Frota do motorista. Sempre acessada pelo motorista dono: veículo de outro é 404. */
@Service
public class VeiculoService {

    private final VeiculoRepository veiculoRepository;
    private final MotoristaRepository motoristaRepository;

    public VeiculoService(VeiculoRepository veiculoRepository, MotoristaRepository motoristaRepository) {
        this.veiculoRepository = veiculoRepository;
        this.motoristaRepository = motoristaRepository;
    }

    @Transactional
    public VeiculoResponse cadastrar(UUID motoristaId, VeiculoRequest request) {
        Motorista motorista = motoristaRepository.findById(motoristaId)
                .filter(Motorista::isAtivo)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Motorista não encontrado."));
        String placa = Veiculo.normalizarPlaca(request.placa());
        if (veiculoRepository.existsByPlaca(placa)) {
            throw new ConflitoException("Já existe um veículo com essa placa.");
        }
        Veiculo veiculo = new Veiculo(motorista, placa, request.categoria(), request.modelo(), request.rntrc(),
                request.tipo(), request.carroceria(), request.numeroEixos(), request.rastreador());
        return VeiculoResponse.de(veiculoRepository.save(veiculo));
    }

    @Transactional(readOnly = true)
    public List<VeiculoResponse> listar(UUID motoristaId) {
        return veiculoRepository.findByMotoristaIdAndAtivoTrueOrderByCriadoEm(motoristaId).stream()
                .map(VeiculoResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public VeiculoResponse buscar(UUID motoristaId, UUID veiculoId) {
        return VeiculoResponse.de(carregar(motoristaId, veiculoId));
    }

    @Transactional
    public VeiculoResponse atualizar(UUID motoristaId, UUID veiculoId, VeiculoRequest request) {
        Veiculo veiculo = carregar(motoristaId, veiculoId);
        veiculo.atualizar(request.categoria(), request.modelo(), request.rntrc(), request.tipo(),
                request.carroceria(), request.numeroEixos(), request.rastreador());
        return VeiculoResponse.de(veiculo);
    }

    @Transactional
    public void desativar(UUID motoristaId, UUID veiculoId) {
        carregar(motoristaId, veiculoId).desativar();
    }

    private Veiculo carregar(UUID motoristaId, UUID veiculoId) {
        return veiculoRepository.findById(veiculoId)
                .filter(v -> v.pertenceA(motoristaId) && v.isAtivo())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Veículo não encontrado."));
    }
}
