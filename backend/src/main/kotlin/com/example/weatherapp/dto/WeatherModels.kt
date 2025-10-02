package com.example.weatherapp.dto

import java.time.Instant

data class WeatherSnapshot(
    val generatedAt: Instant,
    val cities: List<CityWeatherDto>
)

data class CityWeatherDto(
    val cityName: String,
    val temperatureCelsius: Double?,
    val status: WeatherStatus,
    val dataTimestamp: Instant?,
    val message: String?
)

enum class WeatherStatus {
    OK,
    ERROR
}
