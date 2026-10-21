package br.com.fretai.auth.infra;

import br.com.fretai.usuario.domain.Administrador;
import br.com.fretai.usuario.domain.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cria o primeiro administrador na subida, se FRETAI_ADMIN_EMAIL, FRETAI_ADMIN_SENHA
 * e FRETAI_ADMIN_CPF estiverem definidos e ainda não houver ninguém com esse e-mail.
 * Sem as variáveis, não faz nada: não existe senha de administrador padrão.
 */
@Component
class AdministradorInicial implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdministradorInicial.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String senha;
    private final String cpf;

    AdministradorInicial(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                         @Value("${fretai.admin.email:}") String email,
                         @Value("${fretai.admin.senha:}") String senha,
                         @Value("${fretai.admin.cpf:}") String cpf) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email.trim().toLowerCase();
        this.senha = senha;
        this.cpf = cpf.replaceAll("\\D", "");
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email.isBlank() || senha.isBlank() || cpf.isBlank() || usuarioRepository.existsByEmailIgnoreCase(email)) {
            return;
        }
        if (senha.length() < 12) {
            throw new IllegalStateException("FRETAI_ADMIN_SENHA precisa ter pelo menos 12 caracteres.");
        }
        usuarioRepository.save(new Administrador(cpf, "Administrador", email, passwordEncoder.encode(senha), ""));
        log.info("Administrador inicial criado: {}", email);
    }
}
