package com.example.weatherapp.client

import com.fasterxml.jackson.annotation.JsonProperty
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClientException
import org.springframework.web.client.RestClientResponseException
import org.springframework.web.client.RestTemplate
import org.springframework.web.util.UriComponentsBuilder
import java.time.Instant
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeParseException

@Component
class OpenMeteoClient(
    private val restTemplate: RestTemplate
) {

    private val logger = LoggerFactory.getLogger(OpenMeteoClient::class.java)

    fun fetchCurrentWeather(latitude: Double, longitude: Double): WeatherReading {
        val uri = UriComponentsBuilder.fromPath("/forecast")
            .queryParam("latitude", latitude)
            .queryParam("longitude", longitude)
            .queryParam("current_weather", true)
            .build()
            .toUriString()

        val response = try {
            restTemplate.getForEntity(uri, OpenMeteoResponse::class.java)
        } catch (ex: RestClientResponseException) {
            val status = ex.rawStatusCode
            logger.warn("Open-Meteo returned error status {} for lat={}, lon={}", status, latitude, longitude)
            throw OpenMeteoException("Open-Meteo error $status", ex)
        } catch (ex: RestClientException) {
            throw OpenMeteoException("Failed to call Open-Meteo", ex)
        }

        val responseBody = response.body ?: throw OpenMeteoException("Empty response from Open-Meteo")

        val current = responseBody.currentWeather
            ?: throw OpenMeteoException("Missing current weather in response")

        val observedAt = current.time?.let { toInstant(it) }
            ?: throw OpenMeteoException("Missing observation timestamp")

        return WeatherReading(
            temperatureCelsius = current.temperature,
            observedAt = observedAt
        )
    }

    private fun toInstant(raw: String): Instant {
        return try {
            OffsetDateTime.parse(raw).toInstant()
        } catch (ignored: DateTimeParseException) {
            try {
                LocalDateTime.parse(raw).toInstant(ZoneOffset.UTC)
            } catch (ex: DateTimeParseException) {
                throw OpenMeteoException("Unable to parse observation timestamp: $raw", ex)
            }
        }
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
    val time: String?
)

class OpenMeteoException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)
