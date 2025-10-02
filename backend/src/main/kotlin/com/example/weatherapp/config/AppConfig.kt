package com.example.weatherapp.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.reactive.ReactorClientHttpConnector
import org.springframework.web.reactive.function.client.ExchangeStrategies
import org.springframework.web.reactive.function.client.WebClient
import reactor.netty.http.client.HttpClient
import java.time.Clock
import java.time.Duration

@Configuration
class AppConfig {

    @Bean
    fun clock(): Clock = Clock.systemUTC()

    @Bean
    fun openMeteoWebClient(properties: OpenMeteoProperties): WebClient {
        val timeout = Duration.ofSeconds(properties.timeoutSeconds.coerceAtLeast(1))
        val httpClient = HttpClient.create()
            .responseTimeout(timeout)

        return WebClient.builder()
            .baseUrl(properties.baseUrl)
            .clientConnector(ReactorClientHttpConnector(httpClient))
            .exchangeStrategies(
                ExchangeStrategies.builder()
                    .codecs { config -> config.defaultCodecs().maxInMemorySize(2 * 1024 * 1024) }
                    .build()
            )
            .build()
    }
}
