package br.com.fretai.arquivo.infra;

import br.com.fretai.arquivo.domain.ArmazenamentoArquivos;
import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.ServerSideEncryption;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Arquivos num bucket S3 ou MinIO (endereçamento por caminho, que o MinIO exige).
 * A URL assinada é a pré-assinada do próprio S3: o download não passa pela API.
 */
@Component
@ConditionalOnProperty(name = "fretai.arquivos.provedor", havingValue = "s3")
class S3ArmazenamentoArquivos implements ArmazenamentoArquivos {

    private static final Logger log = LoggerFactory.getLogger(S3ArmazenamentoArquivos.class);

    private final S3Client s3;
    private final S3Presigner presigner;
    private final String bucket;
    private final boolean criptografar;

    S3ArmazenamentoArquivos(@Value("${fretai.arquivos.s3.endpoint}") URI endpoint,
                            @Value("${fretai.arquivos.s3.endpoint-publico}") URI endpointPublico,
                            @Value("${fretai.arquivos.s3.regiao}") String regiao,
                            @Value("${fretai.arquivos.s3.bucket}") String bucket,
                            @Value("${fretai.arquivos.s3.access-key}") String accessKey,
                            @Value("${fretai.arquivos.s3.secret-key}") String secretKey,
                            @Value("${fretai.arquivos.s3.criptografia-servidor:false}") boolean criptografar) {
        var credenciais = StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
        var config = S3Configuration.builder().pathStyleAccessEnabled(true).build();
        this.s3 = S3Client.builder()
                .endpointOverride(endpoint)
                .region(Region.of(regiao))
                .credentialsProvider(credenciais)
                .serviceConfiguration(config)
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .build();
        this.presigner = S3Presigner.builder()
                .endpointOverride(endpointPublico)
                .region(Region.of(regiao))
                .credentialsProvider(credenciais)
                .serviceConfiguration(config)
                .build();
        this.bucket = bucket;
        this.criptografar = criptografar;
    }

    /** Na primeira subida do MinIO local o bucket ainda não existe. */
    @PostConstruct
    void garantirBucket() {
        try {
            s3.headBucket(b -> b.bucket(bucket));
        } catch (NoSuchBucketException e) {
            log.info("Criando bucket {}", bucket);
            s3.createBucket(b -> b.bucket(bucket));
        }
    }

    @Override
    public void salvar(String chave, byte[] conteudo, String contentType) {
        PutObjectRequest.Builder pedido = PutObjectRequest.builder().bucket(bucket).key(chave).contentType(contentType);
        if (criptografar) {
            pedido.serverSideEncryption(ServerSideEncryption.AES256);
        }
        s3.putObject(pedido.build(), RequestBody.fromBytes(conteudo));
    }

    @Override
    public URI urlAssinada(String chave, Duration validade) {
        GetObjectRequest get = GetObjectRequest.builder().bucket(bucket).key(chave).build();
        return URI.create(presigner.presignGetObject(p -> p.signatureDuration(validade).getObjectRequest(get))
                .url().toString());
    }
}
