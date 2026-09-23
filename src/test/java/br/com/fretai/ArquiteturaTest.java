package br.com.fretai;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

/**
 * Regras de arquitetura verificadas a cada build. Cada módulo (frete, usuario,
 * endereco) segue as mesmas camadas:
 *
 * <pre>
 *   api  ──▶  application  ──▶  domain  ◀──  infra
 * </pre>
 *
 * Se uma regra quebrar, a correção é mover a classe para a camada certa, não
 * afrouxar o teste.
 */
@AnalyzeClasses(packages = "br.com.fretai", importOptions = ImportOption.DoNotIncludeTests.class)
class ArquiteturaTest {

    @ArchTest
    static final ArchRule dominioNaoConheceCamadasExternas = noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat().resideInAnyPackage("..application..", "..api..", "..infra..")
            .because("o domínio guarda as regras de negócio e não pode depender de HTTP, casos de uso ou integrações");

    @ArchTest
    static final ArchRule aplicacaoNaoConheceHttp = noClasses()
            .that().resideInAPackage("..application..")
            .should().dependOnClassesThat().resideInAnyPackage("..api..", "..infra..")
            .because("casos de uso não sabem se foram chamados por HTTP, fila ou teste");

    @ArchTest
    static final ArchRule dominioNaoConheceSpringWeb = noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat().resideInAnyPackage("org.springframework.web..", "org.springframework.http..");

    @ArchTest
    static final ArchRule semCiclosEntreModulos = slices()
            .matching("br.com.fretai.(*)..")
            .should().beFreeOfCycles();
}
