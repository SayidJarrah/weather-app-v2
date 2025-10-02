package com.example.weatherapp

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class WeatherBackendApplication

fun main(args: Array<String>) {
    runApplication<WeatherBackendApplication>(*args)
}
