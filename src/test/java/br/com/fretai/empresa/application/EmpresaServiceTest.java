package br.com.fretai.empresa.application;

import br.com.fretai.empresa.application.dto.CadastroEmpresaRequest;
import br.com.fretai.empresa.application.dto.EmpresaResponse;
import br.com.fretai.empresa.application.dto.ResponsavelRequest;
import br.com.fretai.empresa.domain.DadosCnpj;
import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.empresa.domain.EmpresaGateway;
import br.com.fretai.empresa.domain.EmpresaRepository;
import br.com.fretai.empresa.domain.TipoEmpresa;
import br.com.fretai.empresa.domain.UsuarioEmpresa;
import br.com.fretai.empresa.domain.UsuarioEmpresaRepository;
import br.com.fretai.shared.exception.ConflitoException;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.usuario.application.UsuarioService;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Cadastro de empresa")
class EmpresaServiceTest {

    @Mock private EmpresaRepository empresaRepository;
    @Mock private UsuarioEmpresaRepository usuarioEmpresaRepository;
    @Mock private EmpresaGateway empresaGateway;
    @Mock private UsuarioService usuarioService;
    @Mock private PasswordEncoder passwordEncoder;

    private EmpresaService service;

    @BeforeEach
    void setUp() {
        service = new EmpresaService(empresaRepository, usuarioEmpresaRepository, empresaGateway, usuarioService,
                passwordEncoder);
    }

    private static CadastroEmpresaRequest pedido() {
        return new CadastroEmpresaRequest("11.222.333/0001-81", TipoEmpresa.EMBARCADOR, "(11) 3333-4444", null,
                new ResponsavelRequest("529.982.247-25", "Carla Lima", "Carla@Empresa.com", "senhaForte1",
                        "11999998888", null));
    }

    private static DadosCnpj receita(String situacao) {
        return new DadosCnpj("11222333000181", "Cerâmica Paulista Ltda", "Cerâmica SP", situacao,
                LocalDate.of(2001, 1, 1), "Fabricação de cerâmica", "São Paulo", "SP", "01001000");
    }

    @Test
    @DisplayName("Razão social vem da Receita; responsável é criado junto, com senha em hash")
    void cadastra() {
        when(empresaGateway.buscarPorCnpj("11222333000181")).thenReturn(receita("ATIVA"));
        when(empresaRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(passwordEncoder.encode("senhaForte1")).thenReturn("hash");

        EmpresaResponse resposta = service.cadastrar(pedido());

        assertEquals("Cerâmica Paulista Ltda", resposta.razaoSocial());
        assertEquals("Cerâmica SP", resposta.nomeFantasia());
        assertEquals("1133334444", resposta.telefone());
        verify(usuarioService).validarUnicidade("52998224725", "carla@empresa.com");

        ArgumentCaptor<UsuarioEmpresa> responsavel = ArgumentCaptor.forClass(UsuarioEmpresa.class);
        verify(usuarioEmpresaRepository).save(responsavel.capture());
        assertEquals("carla@empresa.com", responsavel.getValue().getEmail());
    }

    @Test
    @DisplayName("Empresa baixada na Receita → 422, nada é gravado")
    void empresaInativa() {
        when(empresaGateway.buscarPorCnpj("11222333000181")).thenReturn(receita("BAIXADA"));

        assertThrows(RegraNegocioException.class, () -> service.cadastrar(pedido()));
        verify(empresaRepository, never()).save(any(Empresa.class));
    }

    @Test
    @DisplayName("CNPJ já cadastrado → 409, sem consultar a Receita")
    void cnpjDuplicado() {
        when(empresaRepository.existsByCnpj("11222333000181")).thenReturn(true);

        assertThrows(ConflitoException.class, () -> service.cadastrar(pedido()));
        verifyNoInteractions(empresaGateway);
    }
}
