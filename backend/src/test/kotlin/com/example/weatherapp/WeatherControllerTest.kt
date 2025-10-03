package com.example.weatherapp

import com.example.weatherapp.controller.WeatherController
import com.example.weatherapp.dto.CityWeatherDto
import com.example.weatherapp.dto.WeatherSnapshot
import com.example.weatherapp.dto.WeatherStatus
import com.example.weatherapp.service.WeatherService
import org.junit.jupiter.api.Test
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.Instant

@WebMvcTest(WeatherController::class)
class WeatherControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var weatherService: WeatherService

    @Test
    fun `returns weather snapshot payload`() {
        val snapshot = WeatherSnapshot(
            generatedAt = Instant.parse("2024-05-01T10:00:00Z"),
            cities = listOf(
                CityWeatherDto(
                    cityId = 1,
                    cityName = "Kyiv",
                    temperatureCelsius = 12.3,
                    status = WeatherStatus.OK,
                    dataTimestamp = Instant.parse("2024-05-01T09:55:00Z"),
                    message = null,
                    timezone = "Europe/Kyiv"
                )
            )
        )
        whenever(weatherService.getWeatherSnapshot(null)).thenReturn(snapshot)

        mockMvc.perform(get("/api/weather"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.generatedAt").value("2024-05-01T10:00:00Z"))
            .andExpect(jsonPath("$.cities[0].cityName").value("Kyiv"))
            .andExpect(jsonPath("$.cities[0].temperatureCelsius").value(12.3))
            .andExpect(jsonPath("$.cities[0].status").value("OK"))
            .andExpect(jsonPath("$.cities[0].timezone").value("Europe/Kyiv"))
    }
}
