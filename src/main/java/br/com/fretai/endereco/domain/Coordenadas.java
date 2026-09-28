package br.com.fretai.endereco.domain;

/** Um ponto no mapa (WGS84, o mesmo sistema do GPS). */
public record Coordenadas(double latitude, double longitude) {

    private static final double RAIO_MEDIO_TERRA_KM = 6371.0088;

    public Coordenadas {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Coordenadas fora do intervalo válido: " + latitude + ", " + longitude);
        }
    }

    /** Distância em linha reta pela fórmula de Haversine. Sempre menor que a distância de estrada. */
    public double distanciaLinhaRetaKm(Coordenadas destino) {
        double dLat = Math.toRadians(destino.latitude - latitude);
        double dLon = Math.toRadians(destino.longitude - longitude);
        double a = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(latitude)) * Math.cos(Math.toRadians(destino.latitude))
                * Math.pow(Math.sin(dLon / 2), 2);
        return 2 * RAIO_MEDIO_TERRA_KM * Math.asin(Math.sqrt(a));
    }
}
