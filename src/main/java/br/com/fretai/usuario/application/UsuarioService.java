package br.com.fretai.usuario.application;

import br.com.fretai.shared.exception.ConflitoException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.usuario.application.dto.AtualizarContatoRequest;
import br.com.fretai.usuario.application.dto.CadastroClienteRequest;
import br.com.fretai.usuario.application.dto.CadastroMotoristaRequest;
import br.com.fretai.usuario.application.dto.ClienteResponse;
import br.com.fretai.usuario.application.dto.MotoristaResponse;
import br.com.fretai.usuario.application.dto.PreferenciasMotoristaRequest;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.ClienteRepository;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import br.com.fretai.usuario.domain.UsuarioRepository;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final MotoristaRepository motoristaRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, ClienteRepository clienteRepository,
                          MotoristaRepository motoristaRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.motoristaRepository = motoristaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public ClienteResponse cadastrarCliente(CadastroClienteRequest request) {
        String cpf = somenteDigitos(request.cpf());
        String email = normalizarEmail(request.email());
        validarUnicidade(cpf, email);

        Cliente cliente = new Cliente(cpf, request.nome().trim(), email,
                passwordEncoder.encode(request.senha()), somenteDigitos(request.telefone()));
        return ClienteResponse.de(clienteRepository.save(cliente));
    }

    @Transactional
    public MotoristaResponse cadastrarMotorista(CadastroMotoristaRequest request) {
        String cpf = somenteDigitos(request.cpf());
        String email = normalizarEmail(request.email());
        String placa = request.placa().replace("-", "").toUpperCase(Locale.ROOT);
        validarUnicidade(cpf, email);
        if (motoristaRepository.existsByPlaca(placa)) {
            throw new ConflitoException("Já existe um motorista com essa placa.");
        }

        Motorista motorista = new Motorista(cpf, request.nome().trim(), email,
                passwordEncoder.encode(request.senha()), somenteDigitos(request.telefone()),
                request.tipoVeiculo(), placa);
        return MotoristaResponse.de(motoristaRepository.save(motorista));
    }

    @Transactional(readOnly = true)
    public MotoristaResponse buscarMotorista(UUID motoristaId) {
        return MotoristaResponse.de(carregarMotorista(motoristaId));
    }

    @Transactional(readOnly = true)
    public Page<MotoristaResponse> listarMotoristas(Pageable pageable) {
        return motoristaRepository.findByAtivoTrue(pageable).map(MotoristaResponse::de);
    }

    @Transactional
    public MotoristaResponse atualizarMotorista(UUID motoristaId, AtualizarContatoRequest request) {
        Motorista motorista = carregarMotorista(motoristaId);
        motorista.atualizarContato(request.nome().trim(), somenteDigitos(request.telefone()));
        return MotoristaResponse.de(motorista);
    }

    @Transactional
    public void desativarMotorista(UUID motoristaId) {
        carregarMotorista(motoristaId).desativar();
    }

    @Transactional
    public MotoristaResponse alterarPreferencias(UUID motoristaId, PreferenciasMotoristaRequest request) {
        Motorista motorista = carregarMotorista(motoristaId);
        motorista.definirAceitaFeriado(request.aceitaFeriado());
        return MotoristaResponse.de(motorista);
    }

    /** Usado por todo cadastro de pessoa, inclusive o responsável de uma empresa. */
    public void validarUnicidade(String cpf, String email) {
        if (usuarioRepository.existsByCpf(cpf)) {
            throw new ConflitoException("Já existe um cadastro com esse CPF.");
        }
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflitoException("Já existe um cadastro com esse e-mail.");
        }
    }

    private Motorista carregarMotorista(UUID motoristaId) {
        return motoristaRepository.findById(motoristaId)
                .filter(Motorista::isAtivo)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Motorista não encontrado."));
    }

    public static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public static String somenteDigitos(String valor) {
        return valor.replaceAll("\\D", "");
    }
}
