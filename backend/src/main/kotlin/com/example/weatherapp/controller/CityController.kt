package com.example.weatherapp.controller

import com.example.weatherapp.dto.CitySummaryDto
import com.example.weatherapp.repository.CityRepository
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/cities")
@CrossOrigin
class CityController(
    private val cityRepository: CityRepository
) {

    @GetMapping
    fun getCities(): List<CitySummaryDto> = cityRepository
        .findAll()
        .sortedBy { it.name }
        .map { CitySummaryDto(id = it.id!!, name = it.name, timezone = it.timezone) }
}
