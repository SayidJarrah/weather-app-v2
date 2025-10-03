package com.example.weatherapp

import com.example.weatherapp.client.OpenMeteoClient
import com.example.weatherapp.client.WeatherReading
import com.example.weatherapp.dto.WeatherStatus
import com.example.weatherapp.model.City
import com.example.weatherapp.repository.CityRepository
import com.example.weatherapp.service.WeatherService
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.springframework.data.domain.Sort
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class WeatherServiceTest {

    private val cityRepository: CityRepository = mockk()
    private val openMeteoClient: OpenMeteoClient = mockk()
    private val clock: Clock = Clock.fixed(Instant.parse("2024-05-01T10:00:00Z"), ZoneOffset.UTC)

    private val weatherService = WeatherService(cityRepository, openMeteoClient, clock)

    @Test
    fun `returns weather snapshot for all configured cities`() {
        every { cityRepository.findAll(any<Sort>()) } returns listOf(
            City(id = 1, name = "Kyiv", latitude = 50.45, longitude = 30.52, timezone = "Europe/Kyiv"),
            City(id = 2, name = "London", latitude = 51.50, longitude = -0.12, timezone = "Europe/London")
        )
        every { openMeteoClient.fetchCurrentWeather(50.45, 30.52) } returns WeatherReading(12.3, Instant.parse("2024-05-01T09:55:00Z"))
        every { openMeteoClient.fetchCurrentWeather(51.50, -0.12) } returns WeatherReading(9.8, Instant.parse("2024-05-01T09:50:00Z"))

        val snapshot = weatherService.getWeatherSnapshot(null)

        assertEquals(Instant.parse("2024-05-01T10:00:00Z"), snapshot.generatedAt)
        assertEquals(2, snapshot.cities.size)

        val kyiv = snapshot.cities[0]
        assertEquals("Kyiv", kyiv.cityName)
        assertEquals(12.3, kyiv.temperatureCelsius)
        assertEquals(WeatherStatus.OK, kyiv.status)
        assertEquals(Instant.parse("2024-05-01T09:55:00Z"), kyiv.dataTimestamp)
        assertNull(kyiv.message)
        assertEquals("Europe/Kyiv", kyiv.timezone)

        val london = snapshot.cities[1]
        assertEquals("London", london.cityName)
        assertEquals(9.8, london.temperatureCelsius)
        assertEquals(WeatherStatus.OK, london.status)
        assertEquals(Instant.parse("2024-05-01T09:50:00Z"), london.dataTimestamp)
        assertNull(london.message)

        verify { cityRepository.findAll(any<Sort>()) }
        verify { openMeteoClient.fetchCurrentWeather(50.45, 30.52) }
        verify { openMeteoClient.fetchCurrentWeather(51.50, -0.12) }
    }

    @Test
    fun `marks city as error when Open-Meteo call fails`() {
        every { cityRepository.findAll(any<Sort>()) } returns listOf(
            City(id = 1, name = "Kyiv", latitude = 50.45, longitude = 30.52, timezone = "Europe/Kyiv")
        )
        every { openMeteoClient.fetchCurrentWeather(50.45, 30.52) } throws RuntimeException("boom")

        val snapshot = weatherService.getWeatherSnapshot(null)

        assertEquals(Instant.parse("2024-05-01T10:00:00Z"), snapshot.generatedAt)
        assertEquals(1, snapshot.cities.size)

        val kyiv = snapshot.cities.first()
        assertEquals("Kyiv", kyiv.cityName)
        assertNull(kyiv.temperatureCelsius)
        assertEquals(WeatherStatus.ERROR, kyiv.status)
        assertNull(kyiv.dataTimestamp)
        assertEquals("boom", kyiv.message)
        assertEquals("Europe/Kyiv", kyiv.timezone)

        verify { cityRepository.findAll(any<Sort>()) }
        verify { openMeteoClient.fetchCurrentWeather(50.45, 30.52) }
    }

    @Test
    fun `fetches weather only for requested cities`() {
        every { cityRepository.findAllById(listOf(2L, 3L)) } returns listOf(
            City(id = 2, name = "London", latitude = 51.50, longitude = -0.12, timezone = "Europe/London"),
            City(id = 3, name = "Paris", latitude = 48.85, longitude = 2.35, timezone = "Europe/Paris")
        )
        every { openMeteoClient.fetchCurrentWeather(51.50, -0.12) } returns WeatherReading(10.0, Instant.parse("2024-05-01T09:00:00Z"))
        every { openMeteoClient.fetchCurrentWeather(48.85, 2.35) } returns WeatherReading(13.0, Instant.parse("2024-05-01T09:05:00Z"))

        val snapshot = weatherService.getWeatherSnapshot(listOf(2L, 3L))

        assertEquals(listOf(2L, 3L), snapshot.cities.map { it.cityId })
        verify { cityRepository.findAllById(listOf(2L, 3L)) }
    }
}
