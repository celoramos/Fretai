package br.com.fretai.arquivo.infra;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Token de URL assinada do armazenamento local: {@code base64(chave|expiraEm).hmac}.
 * Sem o segredo não dá para forjar nem esticar a validade; mexer em qualquer
 * byte invalida a assinatura.
 */
final class AssinadorUrl {

    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64D = Base64.getUrlDecoder();

    private final byte[] segredo;
    private final Clock relogio;

    AssinadorUrl(String segredo, Clock relogio) {
        if (segredo == null || segredo.isBlank()) {
            byte[] aleatorio = new byte[32];
            new SecureRandom().nextBytes(aleatorio);
            this.segredo = aleatorio;
        } else {
            this.segredo = segredo.getBytes(StandardCharsets.UTF_8);
        }
        this.relogio = relogio;
    }

    String assinar(String chave, Duration validade) {
        long expiraEm = relogio.instant().plus(validade).getEpochSecond();
        String carga = B64.encodeToString((chave + "|" + expiraEm).getBytes(StandardCharsets.UTF_8));
        return carga + "." + B64.encodeToString(hmac(carga));
    }

    /** @return a chave do arquivo, se a assinatura confere e o link não expirou */
    Optional<String> validar(String token) {
        int ponto = token.lastIndexOf('.');
        if (ponto <= 0) {
            return Optional.empty();
        }
        String carga = token.substring(0, ponto);
        byte[] assinatura;
        try {
            assinatura = B64D.decode(token.substring(ponto + 1));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
        // Comparação em tempo constante: o tempo de resposta não ajuda a adivinhar a assinatura.
        if (!MessageDigest.isEqual(hmac(carga), assinatura)) {
            return Optional.empty();
        }
        String[] partes = new String(B64D.decode(carga), StandardCharsets.UTF_8).split("\\|");
        if (partes.length != 2 || relogio.instant().isAfter(Instant.ofEpochSecond(Long.parseLong(partes[1])))) {
            return Optional.empty();
        }
        return Optional.of(partes[0]);
    }

    private byte[] hmac(String dado) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(segredo, "HmacSHA256"));
            return mac.doFinal(dado.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HMAC-SHA256 indisponível", e);
        }
    }
}
