package br.com.fretai.empresa.application;

import br.com.fretai.empresa.application.dto.AtualizarEmpresaRequest;
import br.com.fretai.empresa.application.dto.CadastroEmpresaRequest;
import br.com.fretai.empresa.application.dto.EmpresaResponse;
import br.com.fretai.empresa.application.dto.ResponsavelRequest;
import br.com.fretai.empresa.domain.DadosCnpj;
import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.empresa.domain.EmpresaGateway;
import br.com.fretai.empresa.domain.EmpresaRepository;
import br.com.fretai.empresa.domain.UsuarioEmpresa;
import br.com.fretai.empresa.domain.UsuarioEmpresaRepository;
import br.com.fretai.shared.exception.ConflitoException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.usuario.application.UsuarioService;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmpresaService {

    private final EmpresaRepository empresaRepository;
    private final UsuarioEmpresaRepository usuarioEmpresaRepository;
    private final EmpresaGateway empresaGateway;
    private final UsuarioService usuarioService;
    private final PasswordEncoder passwordEncoder;

    public EmpresaService(EmpresaRepository empresaRepository, UsuarioEmpresaRepository usuarioEmpresaRepository,
                          EmpresaGateway empresaGateway, UsuarioService usuarioService,
                          PasswordEncoder passwordEncoder) {
        this.empresaRepository = empresaRepository;
        this.usuarioEmpresaRepository = usuarioEmpresaRepository;
        this.empresaGateway = empresaGateway;
        this.usuarioService = usuarioService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Cadastra a empresa e a pessoa que opera a conta dela, numa transação só:
     * empresa sem ninguém que faça login não serve para nada.
     */
    @Transactional
    public EmpresaResponse cadastrar(CadastroEmpresaRequest request) {
        String cnpj = EmpresaGateway.normalizarCnpj(request.cnpj());
        if (empresaRepository.existsByCnpj(cnpj)) {
            throw new ConflitoException("Já existe uma empresa com esse CNPJ.");
        }
        ResponsavelRequest r = request.responsavel();
        String cpf = UsuarioService.somenteDigitos(r.cpf());
        String email = UsuarioService.normalizarEmail(r.email());
        usuarioService.validarUnicidade(cpf, email);

        DadosCnpj receita = empresaGateway.buscarPorCnpj(cnpj);
        if (!receita.isAtiva()) {
            throw new RegraNegocioException("Empresa com situação \"" + receita.situacaoCadastral()
                    + "\" na Receita Federal não pode se cadastrar.");
        }
        String nomeFantasia = request.nomeFantasia() != null ? request.nomeFantasia() : receita.nomeFantasia();
        Empresa empresa = empresaRepository.save(new Empresa(cnpj, receita.razaoSocial(), nomeFantasia,
                request.tipo(), UsuarioService.somenteDigitos(request.telefone())));

        usuarioEmpresaRepository.save(new UsuarioEmpresa(cpf, r.nome().trim(), email,
                passwordEncoder.encode(r.senha()), UsuarioService.somenteDigitos(r.telefone()), empresa));
        return EmpresaResponse.de(empresa);
    }

    @Transactional(readOnly = true)
    public EmpresaResponse buscar(UUID empresaId) {
        return EmpresaResponse.de(carregar(empresaId));
    }

    @Transactional(readOnly = true)
    public Page<EmpresaResponse> listar(Pageable pageable) {
        return empresaRepository.findByAtivaTrue(pageable).map(EmpresaResponse::de);
    }

    @Transactional
    public EmpresaResponse atualizar(UUID empresaId, AtualizarEmpresaRequest request) {
        Empresa empresa = carregar(empresaId);
        empresa.atualizar(request.nomeFantasia(), UsuarioService.somenteDigitos(request.telefone()));
        return EmpresaResponse.de(empresa);
    }

    @Transactional
    public void desativar(UUID empresaId) {
        carregar(empresaId).desativar();
    }

    private Empresa carregar(UUID empresaId) {
        return empresaRepository.findById(empresaId)
                .filter(Empresa::isAtiva)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Empresa não encontrada."));
    }
}
