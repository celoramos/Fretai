package br.com.fretai.usuario.application;

import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.endereco.domain.GeocodificacaoGateway;
import br.com.fretai.shared.exception.ConflitoException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.IdentidadeGoogle;
import br.com.fretai.shared.seguranca.VerificadorGoogle;
import br.com.fretai.usuario.application.dto.AtualizarContatoRequest;
import br.com.fretai.usuario.application.dto.BaseMotoristaRequest;
import br.com.fretai.usuario.application.dto.CadastroClienteRequest;
import br.com.fretai.usuario.application.dto.CadastroMotoristaRequest;
import br.com.fretai.usuario.application.dto.ChavePixRequest;
import br.com.fretai.usuario.application.dto.ClienteResponse;
import br.com.fretai.usuario.application.dto.MotoristaResponse;
import br.com.fretai.usuario.application.dto.PreferenciasMotoristaRequest;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.ClienteRepository;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaCadastrado;
import br.com.fretai.usuario.domain.MotoristaRepository;
import br.com.fretai.usuario.domain.UsuarioRepository;
import java.util.Locale;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
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
    private final VerificadorGoogle verificadorGoogle;
    private final ApplicationEventPublisher eventos;
    private final EnderecoGateway enderecoGateway;
    private final GeocodificacaoGateway geocodificacaoGateway;

    public UsuarioService(UsuarioRepository usuarioRepository, ClienteRepository clienteRepository,
                          MotoristaRepository motoristaRepository, PasswordEncoder passwordEncoder,
                          VerificadorGoogle verificadorGoogle, ApplicationEventPublisher eventos,
                          EnderecoGateway enderecoGateway, GeocodificacaoGateway geocodificacaoGateway) {
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.motoristaRepository = motoristaRepository;
        this.passwordEncoder = passwordEncoder;
        this.verificadorGoogle = verificadorGoogle;
        this.eventos = eventos;
        this.enderecoGateway = enderecoGateway;
        this.geocodificacaoGateway = geocodificacaoGateway;
    }

    @Transactional
    public ClienteResponse cadastrarCliente(CadastroClienteRequest request) {
        String cpf = somenteDigitos(request.cpf());
        IdentidadeGoogle google = request.credencialGoogle() != null ? googleParaCadastro(request.credencialGoogle()) : null;
        String email = google != null ? google.email() : normalizarEmail(request.email());
        validarUnicidade(cpf, email);

        Cliente cliente = new Cliente(cpf, request.nome().trim(), email,
                google != null ? null : passwordEncoder.encode(request.senha()), somenteDigitos(request.telefone()));
        if (google != null) {
            cliente.vincularGoogle(google.sub());
        }
        return ClienteResponse.de(clienteRepository.save(cliente));
    }

    @Transactional
    public MotoristaResponse cadastrarMotorista(CadastroMotoristaRequest request) {
        String cpf = somenteDigitos(request.cpf());
        IdentidadeGoogle google = request.credencialGoogle() != null ? googleParaCadastro(request.credencialGoogle()) : null;
        String email = google != null ? google.email() : normalizarEmail(request.email());
        String placa = request.placa().replace("-", "").toUpperCase(Locale.ROOT);
        validarUnicidade(cpf, email);
        if (motoristaRepository.existsByPlaca(placa)) {
            throw new ConflitoException("Já existe um motorista com essa placa.");
        }

        Motorista motorista = new Motorista(cpf, request.nome().trim(), email,
                google != null ? null : passwordEncoder.encode(request.senha()), somenteDigitos(request.telefone()),
                request.tipoVeiculo(), placa);
        if (google != null) {
            motorista.vincularGoogle(google.sub());
        }
        Motorista salvo = motoristaRepository.save(motorista);
        eventos.publishEvent(new MotoristaCadastrado(salvo.getId(), salvo.getTipoVeiculo(), salvo.getPlaca()));
        return MotoristaResponse.de(salvo);
    }

    /**
     * Confere a credencial do Google para um cadastro novo. O e-mail da conta passa a ser o do
     * Google, que já foi verificado por ele.
     *
     * @throws ConflitoException essa conta Google já está ligada a outro cadastro
     */
    public IdentidadeGoogle googleParaCadastro(String credencial) {
        IdentidadeGoogle google = verificadorGoogle.verificar(credencial);
        if (usuarioRepository.findByGoogleSub(google.sub()).isPresent()) {
            throw new ConflitoException("Essa conta Google já está ligada a outro cadastro. Entre com ela.");
        }
        return google;
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

    @Transactional
    public MotoristaResponse definirChavePix(UUID motoristaId, ChavePixRequest request) {
        Motorista motorista = carregarMotorista(motoristaId);
        motorista.definirChavePix(request.chavePix());
        return MotoristaResponse.de(motorista);
    }

    @Transactional
    public MotoristaResponse definirBase(UUID motoristaId, BaseMotoristaRequest request) {
        Motorista motorista = carregarMotorista(motoristaId);
        Coordenadas base = request.latitude() != null && request.longitude() != null
                ? new Coordenadas(request.latitude(), request.longitude())
                : localizarCep(request.cep());
        motorista.definirBase(base.latitude(), base.longitude(), request.raioKm());
        return MotoristaResponse.de(motorista);
    }

    private Coordenadas localizarCep(String cep) {
        return geocodificacaoGateway.localizar(enderecoGateway.buscarPorCep(cep), null)
                .orElseThrow(() -> new RegraNegocioException("Não foi possível achar o CEP " + cep
                        + " no mapa. Use a sua localização."));
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
