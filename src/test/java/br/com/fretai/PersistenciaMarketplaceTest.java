package br.com.fretai;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.empresa.domain.EmpresaRepository;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.support.Fixtures;
import br.com.fretai.usuario.domain.CategoriaVeiculo;
import br.com.fretai.usuario.domain.Motorista;
import br.com.fretai.usuario.domain.MotoristaRepository;
import br.com.fretai.veiculo.domain.TipoCarroceria;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import br.com.fretai.veiculo.domain.Veiculo;
import br.com.fretai.veiculo.domain.VeiculoRepository;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.*;

/** Entidades do marketplace gravadas e relidas pelas migrations reais (H2 em modo PostgreSQL). */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Persistência de empresa, veículo e frete publicado")
class PersistenciaMarketplaceTest {

    @Autowired private EmpresaRepository empresaRepository;
    @Autowired private MotoristaRepository motoristaRepository;
    @Autowired private VeiculoRepository veiculoRepository;
    @Autowired private FreteRepository freteRepository;
    @Autowired private TransactionTemplate tx;
    @Autowired private JdbcTemplate jdbc;

    @MockitoBean
    private EnderecoGateway enderecoGateway;

    @Test
    @DisplayName("Frete de empresa volta do banco com veículos, carrocerias e flags")
    void fretePublicado() {
        Empresa empresa = empresaRepository.save(Fixtures.agenciador());
        UUID freteId = freteRepository.save(Fixtures.fretePublicado(empresa)).getId();

        tx.executeWithoutResult(s -> {
            Frete relido = freteRepository.findById(freteId).orElseThrow();
            assertEquals(empresa.getId(), relido.getEmpresa().getId());
            assertEquals(Set.of(TipoVeiculo.CARRETA, TipoVeiculo.BITREM), relido.getVeiculosAceitos());
            assertEquals(Set.of(TipoCarroceria.SIDER, TipoCarroceria.BAU), relido.getCarroceriasAceitas());
            assertTrue(relido.isPublicadoPorAgenciador());
            assertTrue(relido.isExigeRastreador());
        });
    }

    @Test
    @DisplayName("Veículo fica ligado ao motorista; placa é única")
    void veiculo() {
        Motorista motorista = motoristaRepository.save(new Motorista("39053344705", "João Caminhoneiro",
                "joao@email.com", "hash", "11977776666", CategoriaVeiculo.CAMINHAO, "JOA1234"));
        veiculoRepository.save(Fixtures.carretaSider(motorista));

        assertEquals(1, veiculoRepository.findByMotoristaIdAndAtivoTrueOrderByCriadoEm(motorista.getId()).size());
        assertThrows(DataIntegrityViolationException.class, () -> veiculoRepository.saveAndFlush(
                new Veiculo(motorista, "XYZ1A23", "87654321", TipoVeiculo.TRUCK, TipoCarroceria.BAU, 3, false)));
    }

    @Test
    @DisplayName("O banco barra frete sem contratante ou com dois")
    void umContratante() {
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update("""
                INSERT INTO frete (id, versao, ponto_coleta_cep, ponto_entrega_cep, descricao_carga, peso_kg,
                                   valor, valor_total, status, criado_em, data_coleta)
                VALUES (RANDOM_UUID(), 0, '01001000', '20040002', 'x', 1, 1, 1, 'PUBLICADO', CURRENT_TIMESTAMP,
                        CURRENT_DATE)"""));
    }
}
