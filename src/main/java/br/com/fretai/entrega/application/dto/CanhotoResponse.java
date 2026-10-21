package br.com.fretai.entrega.application.dto;

import br.com.fretai.entrega.domain.Canhoto;
import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.util.UUID;

/**
 * @param fotoUrl e {@code assinaturaUrl}: links temporários (somem em minutos)
 * @param localConferido false quando o destino do frete não tinha coordenadas para comparar com o GPS
 */
public record CanhotoResponse(UUID id, UUID freteId, String nomeRecebedor, double latitude, double longitude,
                              BigDecimal distanciaDestinoKm, boolean localConferido, Instant registradoEm,
                              Instant contestacaoAte, boolean contestado, String motivoContestacao,
                              Canhoto.Resolucao resolucao, URI fotoUrl, URI assinaturaUrl) {

    public static CanhotoResponse de(Canhoto c, URI fotoUrl, URI assinaturaUrl) {
        return new CanhotoResponse(c.getId(), c.getFrete().getId(), c.getNomeRecebedor(), c.getLatitude(),
                c.getLongitude(), c.getDistanciaDestinoKm(), c.localConferido(), c.getRegistradoEm(),
                c.getContestacaoAte(), c.isContestado(), c.getMotivoContestacao(), c.getResolucao(), fotoUrl,
                assinaturaUrl);
    }
}
