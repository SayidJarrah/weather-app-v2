package com.example.weatherapp.repository

import com.example.weatherapp.model.City
import org.springframework.data.jpa.repository.JpaRepository

interface CityRepository : JpaRepository<City, Long>
