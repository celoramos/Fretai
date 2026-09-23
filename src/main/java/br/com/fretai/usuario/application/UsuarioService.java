package br.com.fretai.usuario.application;

import br.com.fretai.shared.exception.ConflitoException;
import br.com.fretai.usuario.application.dto.CadastroClienteRequest;
import br.com.fretai.usuario.application.dto.CadastroMotoristaRequest;
import br.com.fretai.usuario.application.dto.ClienteResponse;
import br.com.fretai.usuario.application.dto.MotoristaResponse;
import br.com.fretai.usuario.domain.Cliente;
import br.com.fretai.usuario.domain.ClienteRepository;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import br.com.fretai.usuario.domain.UsuarioRepository;
import java.util.Locale;
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
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        validarUnicidade(cpf, email);

        Cliente cliente = new Cliente(cpf, request.nome().trim(), email,
                passwordEncoder.encode(request.senha()), somenteDigitos(request.telefone()));
        return ClienteResponse.de(clienteRepository.save(cliente));
    }

    @Transactional
    public MotoristaResponse cadastrarMotorista(CadastroMotoristaRequest request) {
        String cpf = somenteDigitos(request.cpf());
        String email = request.email().trim().toLowerCase(Locale.ROOT);
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

    private void validarUnicidade(String cpf, String email) {
        if (usuarioRepository.existsByCpf(cpf)) {
            throw new ConflitoException("Já existe um cadastro com esse CPF.");
        }
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflitoException("Já existe um cadastro com esse e-mail.");
        }
    }

    private static String somenteDigitos(String valor) {
        return valor.replaceAll("\\D", "");
    }
}
