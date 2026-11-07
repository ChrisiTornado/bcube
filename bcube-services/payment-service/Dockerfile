# syntax=docker/dockerfile:1
FROM maven:3.9.16-eclipse-temurin-25 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B clean package -DskipTests

FROM eclipse-temurin:25-jre
RUN useradd --system --create-home --shell /usr/sbin/nologin appuser
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER appuser

# Size the heap from the container memory limit (default is only 25%).
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"

EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
