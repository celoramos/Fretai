package br.com.fretai.shared.seguranca;

/**
 * Confere a credencial que o botão "Entrar com Google" entrega ao navegador (um ID token assinado
 * pelo Google). Fica em shared para login e cadastro usarem sem um módulo depender do outro.
 */
public interface VerificadorGoogle {

    /**
     * @throws br.com.fretai.shared.exception.CredenciaisInvalidasException credencial inválida, vencida,
     *         emitida para outro app ou com e-mail não verificado
     * @throws br.com.fretai.shared.exception.RegraNegocioException login com Google não configurado
     */
    IdentidadeGoogle verificar(String credencial);
}
