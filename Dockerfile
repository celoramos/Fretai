# Build em duas etapas: compila com Maven e roda só com o JRE.
FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /app
# Dependências primeiro: a camada fica em cache enquanto o pom.xml não muda.
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:21.0.8_9-jre-alpine
WORKDIR /app
# Sem root dentro do contêiner.
RUN addgroup -S fretai && adduser -S fretai -G fretai
USER fretai
COPY --from=build /app/target/fretai-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
