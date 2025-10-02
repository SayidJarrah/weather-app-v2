package com.example.weatherapp.config

import org.springframework.boot.web.client.RestTemplateBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestTemplate
import java.time.Clock
import java.time.Duration

@Configuration
class AppConfig {

    @Bean
    fun clock(): Clock = Clock.systemUTC()

    @Bean
    fun openMeteoRestTemplate(
        properties: OpenMeteoProperties,
        builder: RestTemplateBuilder
    ): RestTemplate {
        val timeout = Duration.ofSeconds(properties.timeoutSeconds.coerceAtLeast(1))

        return builder
            .rootUri(properties.baseUrl)
            .setConnectTimeout(timeout)
            .setReadTimeout(timeout)
            .build()
    }
}
