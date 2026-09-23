package br.com.fretai.shared.api;

import br.com.fretai.endereco.domain.CepNaoEncontradoException;
import br.com.fretai.endereco.domain.ServicoCepIndisponivelException;
import br.com.fretai.shared.exception.ConflitoException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.RegraNegocioException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Traduz exceções em respostas HTTP no formato ProblemDetail (RFC 9457).
 * O front recebe sempre o mesmo formato: {status, title, detail, ...}.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    ProblemDetail naoEncontrado(RecursoNaoEncontradoException e) {
        return problema(HttpStatus.NOT_FOUND, "Recurso não encontrado", e.getMessage());
    }

    @ExceptionHandler(ConflitoException.class)
    ProblemDetail conflito(ConflitoException e) {
        return problema(HttpStatus.CONFLICT, "Dado já cadastrado", e.getMessage());
    }

    /** Transição de status inválida (ex.: concluir um frete que ainda está pendente). */
    @ExceptionHandler(IllegalStateException.class)
    ProblemDetail transicaoInvalida(IllegalStateException e) {
        return problema(HttpStatus.CONFLICT, "Operação não permitida no status atual", e.getMessage());
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    ProblemDetail edicaoConcorrente(ObjectOptimisticLockingFailureException e) {
        return problema(HttpStatus.CONFLICT, "Alteração concorrente",
                "Este frete acabou de ser alterado por outra pessoa. Atualize e tente novamente.");
    }

    /** Rede de segurança: dois cadastros iguais ao mesmo tempo passam pelo existsBy, mas a constraint UNIQUE barra. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail violacaoIntegridade(DataIntegrityViolationException e) {
        log.warn("Violação de integridade", e);
        return problema(HttpStatus.CONFLICT, "Dado já cadastrado", "Já existe um registro com esses dados.");
    }

    @ExceptionHandler(RegraNegocioException.class)
    ProblemDetail regraNegocio(RegraNegocioException e) {
        return problema(HttpStatus.UNPROCESSABLE_CONTENT, "Regra de negócio", e.getMessage());
    }

    @ExceptionHandler(CepNaoEncontradoException.class)
    ProblemDetail cepNaoEncontrado(CepNaoEncontradoException e) {
        return problema(HttpStatus.UNPROCESSABLE_CONTENT, "CEP não encontrado", e.getMessage());
    }

    @ExceptionHandler(ServicoCepIndisponivelException.class)
    ProblemDetail cepIndisponivel(ServicoCepIndisponivelException e) {
        log.error("Falha ao consultar serviço de CEP", e);
        return problema(HttpStatus.SERVICE_UNAVAILABLE, "Serviço de CEP indisponível", e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail argumentoInvalido(IllegalArgumentException e) {
        return problema(HttpStatus.BAD_REQUEST, "Requisição inválida", e.getMessage());
    }

    /** Erros de @Valid: devolve a lista campo → mensagem para o front marcar o formulário. */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers, HttpStatusCode status,
                                                                  WebRequest request) {
        Map<String, String> erros = new LinkedHashMap<>();
        for (FieldError erro : ex.getBindingResult().getFieldErrors()) {
            erros.putIfAbsent(erro.getField(), erro.getDefaultMessage());
        }
        ProblemDetail problema = problema(HttpStatus.BAD_REQUEST, "Dados inválidos",
                "Um ou mais campos estão inválidos.");
        problema.setProperty("erros", erros);
        return ResponseEntity.badRequest().body(problema);
    }

    private static ProblemDetail problema(HttpStatus status, String titulo, String detalhe) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(status, detalhe);
        problema.setTitle(titulo);
        return problema;
    }
}
