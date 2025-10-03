package com.example.weatherapp.service

import com.example.weatherapp.client.OpenMeteoClient
import com.example.weatherapp.client.WeatherReading
import com.example.weatherapp.dto.CityWeatherDto
import com.example.weatherapp.dto.WeatherSnapshot
import com.example.weatherapp.dto.WeatherStatus
import com.example.weatherapp.repository.CityRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import java.time.Clock
import java.time.Instant

@Service
class WeatherService(
    private val cityRepository: CityRepository,
    private val openMeteoClient: OpenMeteoClient,
    private val clock: Clock
) {

    private val logger = LoggerFactory.getLogger(WeatherService::class.java)

    fun getWeatherSnapshot(cityIds: List<Long>?): WeatherSnapshot {
        val cities = resolveCities(cityIds)
        val generatedAt = Instant.now(clock)

        val cityWeather = cities.map { city ->
            try {
                val reading: WeatherReading = openMeteoClient.fetchCurrentWeather(city.latitude, city.longitude)
                CityWeatherDto(
                    cityId = city.id!!,
                    cityName = city.name,
                    temperatureCelsius = reading.temperatureCelsius,
                    status = WeatherStatus.OK,
                    dataTimestamp = reading.observedAt,
                    message = null,
                    timezone = city.timezone
                )
            } catch (ex: Exception) {
                logger.error("Failed to retrieve weather for {}", city.name, ex)
                CityWeatherDto(
                    cityId = city.id!!,
                    cityName = city.name,
                    temperatureCelsius = null,
                    status = WeatherStatus.ERROR,
                    dataTimestamp = null,
                    message = ex.message ?: "Unable to fetch weather",
                    timezone = city.timezone
                )
            }
        }

        return WeatherSnapshot(
            generatedAt = generatedAt,
            cities = cityWeather
        )
    }

    private fun resolveCities(cityIds: List<Long>?): List<com.example.weatherapp.model.City> {
        return if (cityIds.isNullOrEmpty()) {
            cityRepository.findAll(Sort.by("id"))
        } else {
            val fetched = cityRepository.findAllById(cityIds).associateBy { it.id }
            cityIds.mapNotNull { fetched[it] }
        }
    }
}
