# syntax=docker/dockerfile:1

FROM gradle:8.7-jdk17 AS builder

WORKDIR /home/gradle/project

COPY build.gradle.kts settings.gradle.kts gradle.properties ./
COPY src ./src

RUN gradle -x test bootJar

FROM eclipse-temurin:17-jre

WORKDIR /app

ENV PORT=8080
ENV JAVA_OPTS=""

COPY --from=builder /home/gradle/project/build/libs/*.jar ./app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
