package br.com.Fretai.Verificacoes;

public class VerificarCPF {
    private VerificarCPF() {
    }

    public static boolean isCPF(String cpf) {
        if (cpf == null) {
            return false;
        }

        String cpfNumerico = cpf.replaceAll("\\D", "");

        if (cpfNumerico.length() != 11) {
            return false;
        }

        if (cpfNumerico.matches("(\\d)\\1{10}")) {
            return false;
        }

        char dig10 = calcularDigito(cpfNumerico, 10);
        char dig11 = calcularDigito(cpfNumerico, 11);

        return dig10 == cpfNumerico.charAt(9) && dig11 == cpfNumerico.charAt(10);
    }

    public static boolean isValido(String cpf) {
        return isCPF(cpf);
    }

    public static String imprimeCPF(String cpf) {
        return formatar(cpf);
    }

    public static String formatar(String cpf) {
        if (cpf == null) {
            return null;
        }

        String cpfNumerico = cpf.replaceAll("\\D", "");
        if (cpfNumerico.length() != 11) {
            return cpf;
        }

        return cpfNumerico.substring(0, 3) + "." +
               cpfNumerico.substring(3, 6) + "." +
               cpfNumerico.substring(6, 9) + "-" +
               cpfNumerico.substring(9, 11);
    }

    private static char calcularDigito(String cpf, int pesoInicial) {
        int soma = 0;
        int peso = pesoInicial;
        int limite = pesoInicial - 1;

        for (int i = 0; i < limite; i++) {
            int num = cpf.charAt(i) - '0';
            soma += num * peso;
            peso--;
        }

        int resto = 11 - (soma % 11);
        if (resto == 10 || resto == 11) {
            return '0';
        }
        return (char) (resto + '0');
    }
}
