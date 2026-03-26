# Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

COPY pom.xml .
# Download dependencies (cached unless pom changes)
RUN mvn dependency:go-offline -B

COPY src src
RUN mvn package -DskipTests -B

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Default port (override with -e SERVER_PORT=8081)
ENV SERVER_PORT=8081

EXPOSE 8081

# Copy the built Spring Boot JAR (skip .original)
COPY --from=build /app/target/kiddoquest-0.0.1-SNAPSHOT.jar app.jar

ENTRYPOINT ["sh", "-c", "java -jar app.jar"]
