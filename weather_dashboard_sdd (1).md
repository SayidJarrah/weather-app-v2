# 📑 Solution Design Document (SDD) – Simple Weather Dashboard (4 Cities)

---

## 1. Introduction

### Purpose of the Document
This Solution Design Document (SDD) describes the technical solution for the **Simple Weather Dashboard**, a web application that displays real-time temperatures for four predefined cities (Kyiv, Singapore, London, Sydney). It outlines the architecture, design decisions, and technology stack to guide implementation.

### Scope of the Solution
- Deliver a **single-page application (SPA)** that fetches and displays weather data.
- Use a backend service to manage city configurations and weather API integration.
- Store city data in a database for extensibility.
- Host frontend, backend, and database on **Render**.

### References
- Product Requirements Document (PRD): *Simple Weather Dashboard v1*【6†simple_weather_dashboard_4_cities_prd_v_1.md】
- Open-Meteo API documentation

### Assumptions & Constraints
- Only four cities are required in v1 (hardcoded in DB).
- Free-tier weather APIs must be used (Open-Meteo chosen).
- Must support latest versions of Chrome, Edge, Firefox, Safari.
- Render is the hosting provider.

---

## 2. Business Context

### Business Goals & Drivers
- Provide a **single unified view** of weather across four global cities.
- Minimize user effort by eliminating the need to check multiple websites.
- Keep the solution **lightweight, fast, and maintainable**.

### High-Level Requirements (from PRD)
- Show current temperature for each city.
- Show a refresh timestamp.
- Show error messages if data retrieval fails.
- Simple and readable layout.

### Out of Scope
- City customization (add/remove cities).
- Auto-refresh of data.
- City icons/flags.
- Advanced analytics or forecasting.

---

## 3. Solution Overview

### Solution Objectives
- Centralize weather data display in a single web application.
- Ensure maintainability and scalability by separating concerns (frontend, backend, data).
- Support potential feature evolution (e.g., more cities, user customization).

### Key Features
- Display of four cities with their current temperature (°C).
- Display of last refresh timestamp.
- Graceful error handling ("Error fetching data").

### High-Level Architecture Diagram
**Context View:**
```
[Browser SPA (React)] ⇄ [Backend API (Spring Boot, Kotlin)] ⇄ [Open-Meteo API]
                                            │
                                            ▼
                                      [Postgres DB]
```

### Actors & Interactions
- **End User**: Opens the SPA in a browser and views weather data.
- **Frontend (React)**: Calls backend REST API to fetch weather data.
- **Backend (Spring Boot + Kotlin)**: Retrieves city list from Postgres, fetches live weather data from Open-Meteo, and returns responses to frontend.
- **External API (Open-Meteo)**: Provides live weather data.

---

## 4. Architecture

### Logical Architecture
- **Frontend (React SPA)**
  - UI rendering for city weather data and refresh timestamp.
  - Error handling display.
- **Backend (Spring Boot, Kotlin)**
  - Exposes REST endpoints for weather data.
  - Manages city definitions (read from Postgres).
  - Integrates with Open-Meteo API.
- **Database (Postgres)**
  - Stores city metadata (name, latitude, longitude).
  - Initially seeded with four cities.

### Physical Architecture
- **Frontend Deployment**: Render static hosting for SPA.
- **Backend Deployment**: Render service hosting Spring Boot app.
- **Database Deployment**: Managed Postgres instance on Render.

### Integration Architecture
- **Frontend → Backend**: REST API calls (JSON response).
- **Backend → Open-Meteo**: HTTPS requests with lat/long.
- **Backend → Database**: SQL queries to retrieve city data.

### Data Architecture
- **City Table**: `{ id, name, latitude, longitude }`
- **Weather Response (from Open-Meteo)**: `{ temperature, timestamp }`
- **UI Model**: `{ cityName, temperature, lastRefresh, status }`

---

## 5. Technology Stack

### Chosen Technologies & Frameworks
- **Frontend**: React (SPA)
- **Backend**: Spring Boot + Kotlin
- **Database**: Postgres
- **External API**: Open-Meteo (free, keyless)
- **Hosting**: Render (frontend, backend, DB)

### Rationale for Selection
- **React**: Provides a modern SPA experience, easily deployable on static hosts.
- **Spring Boot + Kotlin**: Production-ready, scalable backend with concise syntax.
- **Postgres**: Reliable RDBMS, native support on Render.
- **Open-Meteo**: Free, no authentication required, CORS enabled.
- **Render**: Simple full-stack hosting solution.

### Alternatives Considered
- **Frontend-only (React calling API directly)**: Rejected due to limited extensibility and lack of centralized city management.
- **Other databases (SQLite, MongoDB)**: Rejected in favor of Postgres, which Render supports natively with managed services.
- **Other hosts (Netlify, Vercel, GitHub Pages)**: Rejected to consolidate deployment under Render.

---

