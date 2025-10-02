package com.example.weatherapp

import com.example.weatherapp.client.OpenMeteoClient
import com.example.weatherapp.client.OpenMeteoException
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.web.client.RestTemplateBuilder
import java.time.Instant

class OpenMeteoClientTest {

    private lateinit var mockWebServer: MockWebServer

    @BeforeEach
    fun setUp() {
        mockWebServer = MockWebServer()
        mockWebServer.start()
    }

    @AfterEach
    fun tearDown() {
        mockWebServer.shutdown()
    }

    @Test
    fun `fetches current weather payload`() {
        val body = """
            {
              "current_weather": {
                "temperature": 21.3,
                "time": "2024-05-01T11:00Z"
              }
            }
        """.trimIndent()
        mockWebServer.enqueue(
            MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(body)
        )

        val client = buildClient()
        val reading = client.fetchCurrentWeather(50.0, 30.0)

        val recordedRequest = mockWebServer.takeRequest()
        assertEquals("/forecast?latitude=50.0&longitude=30.0&current_weather=true", recordedRequest.path)
        assertEquals(21.3, reading.temperatureCelsius)
        assertEquals(Instant.parse("2024-05-01T11:00:00Z"), reading.observedAt)
    }

    @Test
    fun `throws descriptive exception on API error`() {
        mockWebServer.enqueue(MockResponse().setResponseCode(500))

        val client = buildClient()

        assertThrows(OpenMeteoException::class.java) {
            client.fetchCurrentWeather(10.0, 20.0)
        }
    }

    private fun buildClient(): OpenMeteoClient {
        val baseUrl = mockWebServer.url("/").toString().removeSuffix("/")
        val restTemplate = RestTemplateBuilder()
            .rootUri(baseUrl)
            .build()
        return OpenMeteoClient(restTemplate)
    }
}
