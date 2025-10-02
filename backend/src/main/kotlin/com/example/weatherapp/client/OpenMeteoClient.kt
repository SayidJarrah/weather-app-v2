package com.example.weatherapp.client

import com.fasterxml.jackson.annotation.JsonProperty
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatusCode
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.bodyToMono
import reactor.core.publisher.Mono
import java.time.Instant
import java.time.OffsetDateTime

@Component
class OpenMeteoClient(
    private val webClient: WebClient
) {

    private val logger = LoggerFactory.getLogger(OpenMeteoClient::class.java)

    fun fetchCurrentWeather(latitude: Double, longitude: Double): WeatherReading {
        val response = webClient.get()
            .uri { uriBuilder ->
                uriBuilder
                    .path("/forecast")
                    .queryParam("latitude", latitude)
                    .queryParam("longitude", longitude)
                    .queryParam("current_weather", true)
                    .build()
            }
            .retrieve()
            .onStatus(HttpStatusCode::isError) { response ->
                val statusCode = response.statusCode().value()
                logger.warn("Open-Meteo returned error status {} for lat={}, lon={}", statusCode, latitude, longitude)
                Mono.error(OpenMeteoException("Open-Meteo error $statusCode"))
            }
            .bodyToMono(OpenMeteoResponse::class.java)
            .block()
            ?: throw OpenMeteoException("Empty response from Open-Meteo")

        val current = response.currentWeather
            ?: throw OpenMeteoException("Missing current weather in response")

        val observedAt = current.time?.toInstant() ?: throw OpenMeteoException("Missing observation timestamp")

        return WeatherReading(
            temperatureCelsius = current.temperature,
            observedAt = observedAt
        )
    }
}

data class WeatherReading(
    val temperatureCelsius: Double,
    val observedAt: Instant
)

data class OpenMeteoResponse(
    @JsonProperty("current_weather")
    val currentWeather: CurrentWeather?
)

data class CurrentWeather(
    val temperature: Double,
    val time: OffsetDateTime?
)

class OpenMeteoException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
