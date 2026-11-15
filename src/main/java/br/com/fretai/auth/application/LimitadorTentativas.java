package br.com.fretai.auth.application;

import br.com.fretai.shared.exception.MuitasTentativasException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Freio contra adivinhação de senha: depois de N falhas na janela, aquela chave
 * (IP + e-mail) fica bloqueada até a falha mais antiga sair da janela.
 *
 * A chave vem de quem chama, sem login: qualquer um inventa quantas quiser. Por isso
 * nenhuma fica guardada depois que as falhas dela saem da janela, senão o mapa cresce
 * até acabar com a memória.
 *
 * Fica em memória: com mais de uma instância da API, cada uma conta as suas.
 * Para várias instâncias, trocar por Redis (mesma interface pública).
 */
@Component
public class LimitadorTentativas {

    /** A faxina geral roda no máximo uma vez neste intervalo, para não varrer o mapa a cada requisição. */
    private static final Duration INTERVALO_FAXINA = Duration.ofMinutes(1);

    private final int maximoFalhas;
    private final Duration janela;
    private final Clock relogio;
    /** Cada registro só é lido ou alterado dentro de compute: o mapa trava a chave, e o registro não precisa de trava própria. */
    private final Map<String, Deque<Instant>> falhas = new ConcurrentHashMap<>();
    private final AtomicReference<Instant> proximaFaxina;

    @Autowired
    public LimitadorTentativas(@Value("${fretai.login.maximo-falhas:5}") int maximoFalhas,
                               @Value("${fretai.login.janela:15m}") Duration janela) {
        this(maximoFalhas, janela, Clock.systemUTC());
    }

    LimitadorTentativas(int maximoFalhas, Duration janela, Clock relogio) {
        this.maximoFalhas = maximoFalhas;
        this.janela = janela;
        this.relogio = relogio;
        this.proximaFaxina = new AtomicReference<>(relogio.instant().plus(INTERVALO_FAXINA));
    }

    /** @throws MuitasTentativasException se a chave estourou o limite */
    public void verificar(String chave) {
        Instant agora = relogio.instant();
        AtomicReference<Instant> maisAntiga = new AtomicReference<>();
        falhas.computeIfPresent(chave, (k, registro) -> {
            descartarAntigas(registro, agora);
            if (registro.size() >= maximoFalhas) {
                maisAntiga.set(registro.peekFirst());
            }
            return registro.isEmpty() ? null : registro;
        });
        if (maisAntiga.get() != null) {
            throw new MuitasTentativasException("Muitas tentativas de login. Tente de novo em alguns minutos.",
                    Duration.between(agora, maisAntiga.get().plus(janela)));
        }
    }

    public void registrarFalha(String chave) {
        Instant agora = relogio.instant();
        falhas.compute(chave, (k, registro) -> {
            Deque<Instant> atual = registro != null ? registro : new ArrayDeque<>();
            descartarAntigas(atual, agora);
            atual.addLast(agora);
            return atual;
        });
        fazerFaxinaSeForHora(agora);
    }

    public void registrarSucesso(String chave) {
        falhas.remove(chave);
    }

    /** Quantas chaves estão guardadas agora. */
    int chavesGuardadas() {
        return falhas.size();
    }

    /**
     * Solta as chaves que ninguém mais consultou: quem errou a senha uma vez e foi embora não volta
     * para {@link #verificar}, e o registro dele ficaria aqui para sempre.
     */
    private void fazerFaxinaSeForHora(Instant agora) {
        Instant marcada = proximaFaxina.get();
        if (agora.isBefore(marcada) || !proximaFaxina.compareAndSet(marcada, agora.plus(INTERVALO_FAXINA))) {
            return;
        }
        for (String chave : falhas.keySet()) {
            falhas.computeIfPresent(chave, (k, registro) -> {
                descartarAntigas(registro, agora);
                return registro.isEmpty() ? null : registro;
            });
        }
    }

    private void descartarAntigas(Deque<Instant> registro, Instant agora) {
        Instant limite = agora.minus(janela);
        while (!registro.isEmpty() && !registro.peekFirst().isAfter(limite)) {
            registro.pollFirst();
        }
    }
}
