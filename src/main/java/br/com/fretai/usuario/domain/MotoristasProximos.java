package br.com.fretai.usuario.domain;

import br.com.fretai.endereco.domain.Coordenadas;
import java.util.List;
import java.util.UUID;

/** Motoristas ativos cuja base está dentro do raio de interesse de cada um até o ponto dado. Usa PostGIS. */
public interface MotoristasProximos {

    List<UUID> interessadosEm(Coordenadas ponto);
}
