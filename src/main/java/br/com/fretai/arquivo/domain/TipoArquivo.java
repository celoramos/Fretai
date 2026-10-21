package br.com.fretai.arquivo.domain;

import java.util.Arrays;
import java.util.Optional;

/**
 * Formatos aceitos, reconhecidos pelos primeiros bytes do arquivo e não pela
 * extensão ou pelo Content-Type que o cliente declarou (os dois mentem fácil).
 */
public enum TipoArquivo {
    PDF("application/pdf", "pdf", new byte[]{0x25, 0x50, 0x44, 0x46}),
    PNG("image/png", "png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47}),
    JPEG("image/jpeg", "jpg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});

    private final String contentType;
    private final String extensao;
    private final byte[] assinatura;

    TipoArquivo(String contentType, String extensao, byte[] assinatura) {
        this.contentType = contentType;
        this.extensao = extensao;
        this.assinatura = assinatura;
    }

    public static Optional<TipoArquivo> detectar(byte[] conteudo) {
        return Arrays.stream(values()).filter(t -> t.confere(conteudo)).findFirst();
    }

    private boolean confere(byte[] conteudo) {
        if (conteudo == null || conteudo.length < assinatura.length) {
            return false;
        }
        for (int i = 0; i < assinatura.length; i++) {
            if (conteudo[i] != assinatura[i]) {
                return false;
            }
        }
        return true;
    }

    public String getContentType() {
        return contentType;
    }

    public String getExtensao() {
        return extensao;
    }
}
