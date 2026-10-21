package br.com.fretai.auth.infra;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/** Botão "Authorize" no Swagger UI: cole o accessToken do /api/auth/login. */
@Configuration
@OpenAPIDefinition(
        info = @Info(title = "Fretaí API", version = "0.1",
                description = "Marketplace de fretes: empresas com carga e caminhoneiros autônomos, "
                        + "com pagamento garantido e canhoto digital."),
        security = @SecurityRequirement(name = "bearer"))
@SecurityScheme(name = "bearer", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
class OpenApiConfig {
}
