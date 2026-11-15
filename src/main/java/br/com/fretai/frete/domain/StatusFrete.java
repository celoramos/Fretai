package br.com.fretai.frete.domain;

import java.util.Arrays;
import java.util.Locale;
import java.util.stream.Collectors;

/** As transições permitidas entre estes status estão em {@link MaquinaEstadosFrete}. */
public enum StatusFrete {
    PUBLICADO("Aguardando propostas"),
    PROPOSTA_ENVIADA("Com proposta em análise"),
    ACEITO("Motorista a caminho da coleta"),
    EM_TRANSITO("Carga coletada e em transporte"),
    ENTREGUE("Entrega concluída"),
    PAGO("Saldo pago ao motorista"),
    CANCELADO("Frete cancelado");

    private final String descricao;

    StatusFrete(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

    /**
     * Aceita também "PENDENTE", nome do primeiro status antes do fluxo de
     * propostas, para não quebrar quem ainda filtra por ele.
     */
    public static StatusFrete de(String valor) {
        String nome = valor.trim().toUpperCase(Locale.ROOT);
        if ("PENDENTE".equals(nome)) {
            return PUBLICADO;
        }
        try {
            return valueOf(nome);
        } catch (IllegalArgumentException e) {
            // A mensagem do valueOf traz o nome da classe; esta vai para quem chamou a API.
            throw new IllegalArgumentException("Status de frete desconhecido. Use um de: "
                    + Arrays.stream(values()).map(Enum::name).collect(Collectors.joining(", ")) + ".");
        }
    }
}
