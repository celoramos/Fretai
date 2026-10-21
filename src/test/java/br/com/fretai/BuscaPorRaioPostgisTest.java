package br.com.fretai;

import br.com.fretai.empresa.domain.Empresa;
import br.com.fretai.empresa.domain.EmpresaRepository;
import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.endereco.domain.EnderecoGateway;
import br.com.fretai.frete.domain.BuscaFretes;
import br.com.fretai.frete.domain.DadosCarga;
import br.com.fretai.frete.domain.EnderecoFrete;
import br.com.fretai.frete.domain.FiltroBusca;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.OpcaoFiltro;
import br.com.fretai.frete.domain.RequisitosFrete;
import br.com.fretai.frete.domain.TipoCargaAntt;
import br.com.fretai.support.Fixtures;
import br.com.fretai.support.Postgis;
import br.com.fretai.veiculo.domain.TipoVeiculo;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ST_DWithin de verdade, num PostGIS de verdade. Pulado sem Docker: a busca
 * por raio não tem equivalente no H2.
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
@DisplayName("Busca por raio no PostGIS")
class BuscaPorRaioPostgisTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = Postgis.container();

    @MockitoBean private EnderecoGateway enderecoGateway;

    @Autowired private BuscaFretes buscaFretes;
    @Autowired private FreteRepository freteRepository;
    @Autowired private EmpresaRepository empresaRepository;

    private static final Coordenadas CAMPINAS = new Coordenadas(-22.9056, -47.0608);
    private static final Coordenadas SAO_PAULO = new Coordenadas(-23.5505, -46.6333);
    private static final Coordenadas RIO = new Coordenadas(-22.9068, -43.1729);

    private UUID deCampinas;
    private UUID deSaoPaulo;
    private UUID doRio;

    @BeforeEach
    void publicar() {
        freteRepository.deleteAll();
        Empresa empresa = empresaRepository.findAll().stream().findFirst()
                .orElseGet(() -> empresaRepository.save(Fixtures.embarcador()));
        deCampinas = freteRepository.save(frete(empresa, CAMPINAS, Set.of(), null)).getId();
        deSaoPaulo = freteRepository.save(frete(empresa, SAO_PAULO, Set.of(TipoVeiculo.CARRETA), new BigDecimal("4000")))
                .getId();
        doRio = freteRepository.save(frete(empresa, RIO, Set.of(TipoVeiculo.TRUCK), new BigDecimal("3000"))).getId();
    }

    @Test
    @DisplayName("100 km de Campinas: Campinas (0 km) e São Paulo (~85 km), nessa ordem; Rio fica de fora")
    void raio() {
        var resultado = buscaFretes.buscar(filtro(100, Set.of(), OpcaoFiltro.AMBOS), PageRequest.of(0, 10));

        assertEquals(List.of(deCampinas, deSaoPaulo),
                resultado.getContent().stream().map(BuscaFretes.Encontrado::freteId).toList());
        assertEquals(0, resultado.getContent().get(0).distanciaKm(), 0.5);
        assertEquals(84, resultado.getContent().get(1).distanciaKm(), 5);
        assertEquals(2, resultado.getTotalElements());
    }

    @Test
    @DisplayName("Quem tem TRUCK vê o frete que aceita qualquer veículo, não o que exige CARRETA")
    void tipoDeVeiculo() {
        var resultado = buscaFretes.buscar(filtro(500, Set.of(TipoVeiculo.TRUCK), OpcaoFiltro.AMBOS),
                PageRequest.of(0, 10));

        assertEquals(List.of(deCampinas, doRio),
                resultado.getContent().stream().map(BuscaFretes.Encontrado::freteId).toList());
    }

    @Test
    @DisplayName("comPreco=SIM esconde os fretes 'a combinar'")
    void comPreco() {
        var resultado = buscaFretes.buscar(filtro(100, Set.of(), OpcaoFiltro.SIM), PageRequest.of(0, 10));

        assertEquals(List.of(deSaoPaulo),
                resultado.getContent().stream().map(BuscaFretes.Encontrado::freteId).toList());
    }

    private static FiltroBusca filtro(double raioKm, Set<TipoVeiculo> tipos, OpcaoFiltro comPreco) {
        return new FiltroBusca(CAMPINAS, raioKm, null, 0, tipos, null, null, null, comPreco, null);
    }

    private static Frete frete(Empresa empresa, Coordenadas coleta, Set<TipoVeiculo> tipos, BigDecimal valor) {
        EnderecoFrete origem = new EnderecoFrete(Fixtures.enderecoSaoPaulo(), "1", null, null, coleta);
        EnderecoFrete destino = new EnderecoFrete(Fixtures.enderecoRioDeJaneiro(), "1", null, null, RIO);
        return Frete.publicar(empresa, origem, destino,
                new DadosCarga("Carga", "Diversos", TipoCargaAntt.CARGA_GERAL, new BigDecimal("1000")),
                valor, Fixtures.DIA_COMUM, new RequisitosFrete(tipos, Set.of(), false, false));
    }
}
