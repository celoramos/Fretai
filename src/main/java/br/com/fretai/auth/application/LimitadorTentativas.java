package br.com.fretai.auth.application;

import br.com.fretai.shared.exception.MuitasTentativasException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Freio contra adivinhação de senha: depois de N falhas na janela, aquela chave
 * (IP + e-mail) fica bloqueada até a falha mais antiga sair da janela.
 *
 * Fica em memória: com mais de uma instância da API, cada uma conta as suas.
 * Para várias instâncias, trocar por Redis (mesma interface pública).
 */
@Component
public class LimitadorTentativas {

    private final int maximoFalhas;
    private final Duration janela;
    private final Clock relogio;
    private final Map<String, Deque<Instant>> falhas = new ConcurrentHashMap<>();

    @Autowired
    public LimitadorTentativas(@Value("${fretai.login.maximo-falhas:5}") int maximoFalhas,
                               @Value("${fretai.login.janela:15m}") Duration janela) {
        this(maximoFalhas, janela, Clock.systemUTC());
    }

    LimitadorTentativas(int maximoFalhas, Duration janela, Clock relogio) {
        this.maximoFalhas = maximoFalhas;
        this.janela = janela;
        this.relogio = relogio;
    }

    /** @throws MuitasTentativasException se a chave estourou o limite */
    public void verificar(String chave) {
        Deque<Instant> registro = falhas.get(chave);
        if (registro == null) {
            return;
        }
        synchronized (registro) {
            descartarAntigas(registro);
            if (registro.size() >= maximoFalhas) {
                Duration esperar = Duration.between(relogio.instant(), registro.peekFirst().plus(janela));
                throw new MuitasTentativasException(
                        "Muitas tentativas de login. Tente de novo em alguns minutos.", esperar);
            }
        }
    }

    public void registrarFalha(String chave) {
        Deque<Instant> registro = falhas.computeIfAbsent(chave, k -> new ArrayDeque<>());
        synchronized (registro) {
            descartarAntigas(registro);
            registro.addLast(relogio.instant());
        }
    }

    public void registrarSucesso(String chave) {
        falhas.remove(chave);
    }

    private void descartarAntigas(Deque<Instant> registro) {
        Instant limite = relogio.instant().minus(janela);
        while (!registro.isEmpty() && !registro.peekFirst().isAfter(limite)) {
            registro.pollFirst();
        }
    }
}
