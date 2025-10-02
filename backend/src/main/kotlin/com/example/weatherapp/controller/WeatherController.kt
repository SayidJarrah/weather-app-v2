package com.example.weatherapp.controller

import com.example.weatherapp.dto.WeatherSnapshot
import com.example.weatherapp.service.WeatherService
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/weather")
@CrossOrigin
class WeatherController(
    private val weatherService: WeatherService
) {

    @GetMapping
    fun getWeather(): WeatherSnapshot = weatherService.getWeatherSnapshot()
}
