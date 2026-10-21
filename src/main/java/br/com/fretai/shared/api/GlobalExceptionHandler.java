package br.com.fretai.shared.api;

import br.com.fretai.shared.exception.AcessoNegadoException;
import br.com.fretai.shared.exception.ConflitoException;
import br.com.fretai.shared.exception.CredenciaisInvalidasException;
import br.com.fretai.shared.exception.MuitasTentativasException;
import br.com.fretai.shared.exception.RecursoNaoEncontradoException;
import br.com.fretai.shared.exception.RegraNegocioException;
import br.com.fretai.shared.exception.ServicoExternoIndisponivelException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.core.PropertyReferenceException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
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

    @ExceptionHandler(CredenciaisInvalidasException.class)
    ResponseEntity<ProblemDetail> credenciaisInvalidas(CredenciaisInvalidasException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).header(HttpHeaders.WWW_AUTHENTICATE, "Bearer")
                .body(problema(HttpStatus.UNAUTHORIZED, "Não autenticado", e.getMessage()));
    }

    /** Recurso de outra pessoa: checagem de dono no service ou @PreAuthorize no controller. */
    @ExceptionHandler({AcessoNegadoException.class, AccessDeniedException.class})
    ProblemDetail acessoNegado(RuntimeException e) {
        String detalhe = e instanceof AcessoNegadoException ? e.getMessage()
                : "Seu usuário não tem permissão para este recurso.";
        return problema(HttpStatus.FORBIDDEN, "Acesso negado", detalhe);
    }

    @ExceptionHandler(MuitasTentativasException.class)
    ResponseEntity<ProblemDetail> muitasTentativas(MuitasTentativasException e) {
        long segundos = Math.max(1, e.getEsperar().toSeconds());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(segundos))
                .body(problema(HttpStatus.TOO_MANY_REQUESTS, "Muitas tentativas", e.getMessage()));
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

    /** Inclui CEP inexistente: cada subclasse traz o próprio título. */
    @ExceptionHandler(RegraNegocioException.class)
    ProblemDetail regraNegocio(RegraNegocioException e) {
        return problema(HttpStatus.UNPROCESSABLE_CONTENT, e.getTitulo(), e.getMessage());
    }

    /** ViaCEP, BrasilAPI e afins fora do ar ou lentos demais. */
    @ExceptionHandler(ServicoExternoIndisponivelException.class)
    ProblemDetail servicoExternoIndisponivel(ServicoExternoIndisponivelException e) {
        log.error("Falha ao consultar serviço externo: {}", e.getTitulo(), e);
        return problema(HttpStatus.SERVICE_UNAVAILABLE, e.getTitulo(), e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail argumentoInvalido(IllegalArgumentException e) {
        return problema(HttpStatus.BAD_REQUEST, "Requisição inválida", e.getMessage());
    }

    /** ?sort=campoQueNaoExiste: erro de quem chamou, não do servidor. */
    @ExceptionHandler(PropertyReferenceException.class)
    ProblemDetail ordenacaoInvalida(PropertyReferenceException e) {
        return problema(HttpStatus.BAD_REQUEST, "Ordenação inválida",
                "Não é possível ordenar por \"" + e.getPropertyName() + "\".");
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
