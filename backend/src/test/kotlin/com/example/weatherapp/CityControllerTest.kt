package com.example.weatherapp

import com.example.weatherapp.controller.CityController
import com.example.weatherapp.model.City
import com.example.weatherapp.repository.CityRepository
import org.junit.jupiter.api.Test
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(CityController::class)
class CityControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var cityRepository: CityRepository

    @Test
    fun `returns sorted list of cities`() {
        whenever(cityRepository.findAll()).thenReturn(
            listOf(
                City(id = 2, name = "London", latitude = 51.50, longitude = -0.12, timezone = "Europe/London"),
                City(id = 1, name = "Berlin", latitude = 52.52, longitude = 13.40, timezone = "Europe/Berlin")
            )
        )

        mockMvc.perform(get("/api/cities"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].name").value("Berlin"))
            .andExpect(jsonPath("$[0].timezone").value("Europe/Berlin"))
            .andExpect(jsonPath("$[1].name").value("London"))
    }
}
