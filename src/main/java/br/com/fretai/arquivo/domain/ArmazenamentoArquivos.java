package br.com.fretai.arquivo.domain;

import java.net.URI;
import java.time.Duration;

/**
 * Onde ficam os arquivos (documentos, fotos e assinaturas de canhoto). Nunca
 * são servidos direto pela API autenticada: quem pode ver recebe uma URL
 * assinada que expira. Duas implementações:
 * <ul>
 *   <li>local (padrão): disco da máquina, para desenvolvimento e testes;</li>
 *   <li>S3/MinIO: ativada com {@code fretai.arquivos.provedor=s3}.</li>
 * </ul>
 */
public interface ArmazenamentoArquivos {

    /** @param chave caminho lógico, ex.: documentos/{motorista}/{frete}/{uuid}. Nunca vem do usuário. */
    void salvar(String chave, byte[] conteudo, String contentType);

    /** URL que qualquer um com o link abre, até {@code validade} passar. */
    URI urlAssinada(String chave, Duration validade);
}
