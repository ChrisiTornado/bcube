# syntax=docker/dockerfile:1
# Build stage
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:25-jre
RUN useradd --system --create-home --shell /usr/sbin/nologin appuser
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER appuser

# Size the heap from the container memory limit (default is only 25%).
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"

EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
