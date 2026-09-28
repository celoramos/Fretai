package br.com.fretai.empresa.domain;

import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.ServicoExternoIndisponivelException;
import java.util.regex.Pattern;

/** Porta de saída para consulta de CNPJ na base pública da Receita Federal. */
public interface EmpresaGateway {

    /**
     * @param cnpj com ou sem máscara, numérico ou alfanumérico
     * @throws IllegalArgumentException se o CNPJ for inválido (formato ou dígito verificador)
     * @throws RecursoNaoEncontradoException se o CNPJ não existir na Receita
     * @throws ServicoExternoIndisponivelException se o provedor não responder
     */
    Empresa buscarPorCnpj(String cnpj);

    /**
     * Desde julho de 2026 a Receita emite CNPJ alfanumérico: as 12 primeiras
     * posições podem ter letras, os 2 dígitos verificadores continuam numéricos.
     */
    Pattern FORMATO = Pattern.compile("[0-9A-Z]{12}[0-9]{2}");

    static String normalizarCnpj(String cnpj) {
        String limpo = (cnpj != null) ? cnpj.replaceAll("[.\\-/\\s]", "").toUpperCase() : "";
        if (!FORMATO.matcher(limpo).matches() || limpo.chars().distinct().count() == 1
                || !digitosVerificadoresConferem(limpo)) {
            throw new IllegalArgumentException("CNPJ inválido.");
        }
        return limpo;
    }

    /**
     * Módulo 11 da Receita. Cada caractere vale o seu código ASCII menos 48, o que
     * dá 0 a 9 para dígitos (igual ao CNPJ antigo) e 17 a 42 para as letras A a Z.
     */
    private static boolean digitosVerificadoresConferem(String cnpj) {
        return calcularDigito(cnpj, 12) == cnpj.charAt(12) - '0'
                && calcularDigito(cnpj, 13) == cnpj.charAt(13) - '0';
    }

    private static int calcularDigito(String cnpj, int tamanho) {
        int soma = 0;
        int peso = 2;
        for (int i = tamanho - 1; i >= 0; i--) {
            soma += (cnpj.charAt(i) - '0') * peso;
            peso = (peso == 9) ? 2 : peso + 1;
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
