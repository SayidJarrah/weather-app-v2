package com.example.weatherapp

import com.example.weatherapp.dto.CityWeatherDto
import com.example.weatherapp.dto.WeatherSnapshot
import com.example.weatherapp.dto.WeatherStatus
import com.example.weatherapp.service.WeatherService
import org.junit.jupiter.api.Test
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.test.web.reactive.server.WebTestClient
import java.time.Instant

@WebFluxTest
class WeatherControllerTest {

    @Autowired
    private lateinit var webTestClient: WebTestClient

    @MockBean
    private lateinit var weatherService: WeatherService

    @Test
    fun `returns weather snapshot payload`() {
        val snapshot = WeatherSnapshot(
            generatedAt = Instant.parse("2024-05-01T10:00:00Z"),
            cities = listOf(
                CityWeatherDto(
                    cityName = "Kyiv",
                    temperatureCelsius = 12.3,
                    status = WeatherStatus.OK,
                    dataTimestamp = Instant.parse("2024-05-01T09:55:00Z"),
                    message = null
                )
            )
        )
        whenever(weatherService.getWeatherSnapshot()).thenReturn(snapshot)

        webTestClient.get()
            .uri("/api/weather")
            .exchange()
            .expectStatus().isOk
            .expectBody()
            .jsonPath("$.generatedAt").isEqualTo("2024-05-01T10:00:00Z")
            .jsonPath("$.cities[0].cityName").isEqualTo("Kyiv")
            .jsonPath("$.cities[0].temperatureCelsius").isEqualTo(12.3)
            .jsonPath("$.cities[0].status").isEqualTo("OK")
    }
}
