package br.com.fretai.calendario.domain;

import br.com.fretai.shared.exception.ServicoExternoIndisponivelException;
import java.util.List;

/** Porta de saída para o calendário de feriados nacionais. */
public interface FeriadoGateway {

    /** Faixa de anos que a BrasilAPI sabe calcular. */
    int ANO_MINIMO = 1900;
    int ANO_MAXIMO = 2199;

    /**
     * @return feriados do ano em ordem de data
     * @throws IllegalArgumentException se o ano estiver fora de {@link #ANO_MINIMO}..{@link #ANO_MAXIMO}
     * @throws ServicoExternoIndisponivelException se o provedor não responder
     */
    List<Feriado> nacionaisDoAno(int ano);
}
