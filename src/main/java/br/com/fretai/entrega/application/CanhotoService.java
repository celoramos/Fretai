package br.com.fretai.entrega.application;

import br.com.fretai.arquivo.domain.ArmazenamentoArquivos;
import br.com.fretai.arquivo.domain.TipoArquivo;
import br.com.fretai.endereco.domain.Coordenadas;
import br.com.fretai.entrega.application.dto.CanhotoResponse;
import br.com.fretai.entrega.domain.Canhoto;
import br.com.fretai.entrega.domain.CanhotoRepository;
import br.com.fretai.entrega.domain.EventosEntrega;
import br.com.fretai.frete.domain.Autor;
import br.com.fretai.frete.domain.EventosFrete;
import br.com.fretai.frete.domain.Frete;
import br.com.fretai.frete.domain.FreteRepository;
import br.com.fretai.frete.domain.StatusFrete;
import br.com.fretai.shared.exception.AcessoNegadoException;
import br.com.fretai.shared.exception.ConflitoException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.seguranca.UsuarioLogado;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Canhoto digital. Substitui o canhoto de papel da nota fiscal: o motorista
 * fotografa a entrega, colhe a assinatura na tela e o GPS confere o lugar.
 * A entrega fica confirmada (ENTREGUE) e o saldo sai depois da janela de
 * contestação, se ninguém reclamar.
 */
@Service
public class CanhotoService {

    /** Sem 0/O e 1/I/L: o recebedor vai digitar isto lendo de uma mensagem. */
    private static final String ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final int TAMANHO_CODIGO = 8;
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private final CanhotoRepository canhotoRepository;
    private final FreteRepository freteRepository;
    private final ArmazenamentoArquivos armazenamento;
    private final ApplicationEventPublisher eventos;
    private final double raioMaximoKm;
    private final Duration janelaContestacao;
    private final Duration validadeLink;

    public CanhotoService(CanhotoRepository canhotoRepository, FreteRepository freteRepository,
                          ArmazenamentoArquivos armazenamento, ApplicationEventPublisher eventos,
                          @Value("${fretai.canhoto.raio-maximo-km}") double raioMaximoKm,
                          @Value("${fretai.pagamento.janela-contestacao}") Duration janelaContestacao,
                          @Value("${fretai.arquivos.validade-link}") Duration validadeLink) {
        this.canhotoRepository = canhotoRepository;
        this.freteRepository = freteRepository;
        this.armazenamento = armazenamento;
        this.eventos = eventos;
        this.raioMaximoKm = raioMaximoKm;
        this.janelaContestacao = janelaContestacao;
        this.validadeLink = validadeLink;
    }

    @Transactional
    public CanhotoResponse registrar(UUID freteId, String nomeRecebedor, double latitude, double longitude,
                                     byte[] foto, byte[] assinatura, UsuarioLogado quem) {
        Frete frete = carregarFrete(freteId);
        if (!frete.ehMotoristaDoFrete(quem)) {
            throw new AcessoNegadoException("Só o motorista do frete registra o canhoto.");
        }
        if (frete.getStatus() != StatusFrete.EM_TRANSITO) {
            throw new IllegalStateException("O canhoto é registrado com a carga em trânsito, na chegada ao destino.");
        }
        if (canhotoRepository.findByFreteId(freteId).isPresent()) {
            throw new ConflitoException("Este frete já tem canhoto.");
        }
        TipoArquivo formatoFoto = TipoArquivo.detectar(foto)
                .filter(t -> t != TipoArquivo.PDF)
                .orElseThrow(() -> new RegraNegocioException("A foto da entrega deve ser JPEG ou PNG."));
        if (TipoArquivo.detectar(assinatura).filter(t -> t == TipoArquivo.PNG).isEmpty()) {
            throw new RegraNegocioException("A assinatura do recebedor deve ser uma imagem PNG.");
        }

        String base = "canhotos/%s/%s".formatted(freteId, UUID.randomUUID());
        String fotoChave = base + "-foto." + formatoFoto.getExtensao();
        String assinaturaChave = base + "-assinatura.png";
        String codigo = gerarCodigo();
        Instant contestacaoAte = Instant.now().plus(janelaContestacao);
        // O construtor confere o GPS: se estiver longe do destino, nada é gravado.
        Canhoto canhoto = new Canhoto(frete, quem.id(), fotoChave, assinaturaChave, nomeRecebedor.trim(),
                new Coordenadas(latitude, longitude), raioMaximoKm, contestacaoAte, hash(codigo));
        armazenamento.salvar(fotoChave, foto, formatoFoto.getContentType());
        armazenamento.salvar(assinaturaChave, assinatura, TipoArquivo.PNG.getContentType());
        canhotoRepository.save(canhoto);

        frete.concluir(Autor.de(quem), "Canhoto digital: recebido por " + canhoto.getNomeRecebedor() + ".");
        freteRepository.saveAndFlush(frete);
        eventos.publishEvent(new EventosFrete.FreteEntregue(freteId));
        eventos.publishEvent(new EventosEntrega.CanhotoRegistrado(freteId, contestacaoAte, codigo));
        return resposta(canhoto);
    }

    @Transactional(readOnly = true)
    public CanhotoResponse buscar(UUID freteId, UsuarioLogado quem) {
        Frete frete = carregarFrete(freteId);
        if (!quem.isAdmin() && !frete.ehContratante(quem) && !frete.ehMotoristaDoFrete(quem)) {
            throw new AcessoNegadoException("Só quem participa do frete vê o canhoto.");
        }
        return resposta(carregarDoFrete(freteId));
    }

    /** Fila do administrador: entregas contestadas que esperam decisão, da contestação mais antiga para a mais nova. */
    @Transactional(readOnly = true)
    public List<CanhotoResponse> contestacoesAbertas() {
        return canhotoRepository.findByContestadoTrueAndResolucaoIsNullOrderByContestadoEm().stream()
                .map(this::resposta).toList();
    }

    /** O contratante logado contesta em nome do recebedor (caso comum no frete de empresa). */
    @Transactional
    public CanhotoResponse contestarComoContratante(UUID freteId, String motivo, UsuarioLogado quem) {
        Frete frete = carregarFrete(freteId);
        if (!frete.ehContratante(quem)) {
            throw new AcessoNegadoException("Só quem contratou o frete contesta a entrega.");
        }
        return contestar(carregarDoFrete(freteId), motivo);
    }

    /** O recebedor, sem conta no Fretaí, contesta com o código que recebeu por mensagem. */
    @Transactional
    public void contestarComCodigo(String codigo, String motivo) {
        String normalizado = codigo == null ? "" : codigo.trim().toUpperCase(Locale.ROOT);
        Canhoto canhoto = canhotoRepository.findByCodigoContestacaoHash(hash(normalizado))
                .orElseThrow(() -> new RecursoNaoEncontradoException("Código de contestação inválido."));
        contestar(canhoto, motivo);
    }

    @Transactional
    public CanhotoResponse resolver(UUID freteId, Canhoto.Resolucao resolucao, String observacao) {
        Canhoto canhoto = carregarDoFrete(freteId);
        canhoto.resolver(resolucao, observacao);
        eventos.publishEvent(new EventosEntrega.ContestacaoResolvida(freteId,
                resolucao == Canhoto.Resolucao.ENTREGA_CONFIRMADA));
        return resposta(canhoto);
    }

    private CanhotoResponse contestar(Canhoto canhoto, String motivo) {
        canhoto.contestar(motivo);
        eventos.publishEvent(new EventosEntrega.EntregaContestada(canhoto.getFrete().getId()));
        return resposta(canhoto);
    }

    private CanhotoResponse resposta(Canhoto c) {
        return CanhotoResponse.de(c, armazenamento.urlAssinada(c.getFotoChave(), validadeLink),
                armazenamento.urlAssinada(c.getAssinaturaChave(), validadeLink));
    }

    private Canhoto carregarDoFrete(UUID freteId) {
        return canhotoRepository.findByFreteId(freteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Este frete ainda não tem canhoto."));
    }

    private Frete carregarFrete(UUID freteId) {
        return freteRepository.findById(freteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Frete não encontrado."));
    }

    private static String gerarCodigo() {
        StringBuilder sb = new StringBuilder(TAMANHO_CODIGO);
        for (int i = 0; i < TAMANHO_CODIGO; i++) {
            sb.append(ALFABETO_CODIGO.charAt(ALEATORIO.nextInt(ALFABETO_CODIGO.length())));
        }
        return sb.toString();
    }

    static String hash(String codigo) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(codigo.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
