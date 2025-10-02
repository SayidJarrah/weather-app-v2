package com.example.weatherapp.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "weather.open-meteo")
data class OpenMeteoProperties(
    var baseUrl: String = "https://api.open-meteo.com/v1",
    var timeoutSeconds: Long = 5
)
