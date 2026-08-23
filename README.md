# National Weather Intelligence

**Smart India Hackathon 2026**  
**Problem Statement 26069: National Weather Big Data Analytics Platform**

---

## 1. Problem
India experiences diverse and extreme weather patterns across its geographical regions, including localized cloudbursts, severe monsoons, heatwaves, cyclones, and sudden micro-climate shifts. Traditional weather monitoring systems often operate in silos, lacking real-time stream integration, interactive spatial visualizations, and predictive AI analytics. There is a critical need for a unified, high-throughput Big Data platform that consolidates real-time sensor streams, satellite observations, and meteorological feeds to provide actionable weather intelligence, early risk alerts, and spatial analytics for disaster management and public safety.

## 2. Proposed Solution
**National Weather Intelligence** is a modernized, big-data-ready analytics platform engineered to ingest, process, visualize, and analyze weather data at scale across India. By pairing high-performance backend data ingestion with interactive GIS maps and AI-assisted anomaly detection, the platform empowers decision-makers with actionable insights, historical climate trends, and real-time situational awareness.

## 3. Key Features
- **[IMPLEMENTED] Weather Report Data Management:** Core domain entity for recording weather events (temperature, severe storms, cloudbursts, heatwaves, etc.) with spatial coordinates and metadata.
- **[IMPLEMENTED] Weather Report REST APIs:** High-performance RESTful endpoints for submitting new weather reports, retrieving reports, and filtering by event type, severity, state, and city.
- **[IMPLEMENTED] Jakarta Bean Validation & Exception Handling:** Strict validation rules for spatial coordinates (latitude: [-90, 90], longitude: [-180, 180]) and field requirements with standardized error JSON responses.
- **[IMPLEMENTED] System Health Monitoring:** Spring Boot Actuator health endpoint (`/actuator/health`) and custom application health check (`/api/v1/health`).
- **[PLANNED] Real-Time Weather Data Ingestion:** Stream ingestion of temperature, humidity, precipitation, wind speed, and atmospheric pressure metrics across multiple stations.
- **[PLANNED] Interactive GIS Map Visualization:** High-performance spatial maps with layer toggles for weather parameters, heatmaps, and regional boundaries.
- **[PLANNED] Severe Weather Alerting System:** Automated risk scoring and threshold alerts for heavy rainfall, storms, and extreme temperatures.
- **[PLANNED] Predictive AI Weather Insights:** Machine learning / AI analysis for anomaly detection, rainfall pattern forecast, and extreme event risk estimation.
- **[PLANNED] Historical Trend Analytics:** Interactive charts and statistical metrics comparing current weather patterns with historical averages.

## 4. Planned Architecture
The system architecture follows a clean, decoupled data-flow pipeline designed for scalability:

```
Data Sources
    ↓
Ingestion
    ↓
Processing
    ↓
AI Intelligence
    ↓
PostgreSQL
    ↓
REST/WebSocket APIs
    ↓
React Dashboard
    ↓
GIS Visualization
```

## 5. Technology Stack
- **Backend (Implemented):** Java 21, Spring Boot 3.4.3, Spring Data JPA, Jakarta Bean Validation, Spring Boot Actuator, Lombok
- **Database (Implemented):** PostgreSQL persistence (with H2 in-memory profile for automated tests)
- **Frontend (Planned):** React, Vite, JavaScript / TypeScript, Tailwind CSS
- **Visualization (Planned):** GIS mapping libraries (Leaflet / MapLibre / OpenLayers), Recharts / Chart.js
- **AI / Data (Planned):** Predictive models & API integrations for climate analytics

## 6. Planned AI Capabilities
- **Anomaly Detection:** Identify irregular weather shifts (e.g., sudden pressure drops or unseasonal temperature spikes).
- **Extreme Weather Risk Scoring:** Evaluate real-time meteorological indicators to score danger levels for severe weather events.
- **Automated Weather Summaries:** Generate natural-language weather condition reports for regions and disaster management operators.

## 7. Planned Big Data / Real-Time Architecture
- **Stream Ingestion & Processing:** High-throughput backend data pipeline handling high-frequency telemetry from meteorological sensors.
- **Real-Time Delivery:** WebSocket push mechanisms for instant dashboard updates without page reloads.
- **Storage Strategy:** Optimized time-series indexing and relational database schemas to efficiently query historical and spatial datasets.

## 8. Project Structure
```
national-weather-intelligence/
├── backend/            # Spring Boot backend application (Java 21 + Maven)
│   ├── src/main/java/com/weatherintel/
│   │   ├── WeatherIntelligenceApplication.java
│   │   ├── config/             # CORS and Web MVC configuration
│   │   ├── controller/         # WeatherReportController & HealthController REST endpoints
│   │   ├── dto/                # Request & Response Data Transfer Objects
│   │   ├── entity/             # WeatherReport JPA entity & Enums (EventType, Severity, SourceType)
│   │   ├── exception/          # GlobalExceptionHandler & custom exceptions
│   │   ├── repository/         # WeatherReportRepository (Spring Data JPA)
│   │   └── service/            # WeatherReportService business logic
│   └── src/test/java/          # Spring Boot MockMvc integration test suite
├── frontend/           # React + Vite dashboard application (Planned)
├── data/               # Datasets, schemas, and mock telemetry feeds
├── docs/               # Documentation, architectural diagrams, and research notes
├── .env.example        # Environment variable template
├── .gitignore          # Repository git ignore configuration
└── README.md           # Project overview and documentation
```

## 9. Local Development

### Prerequisites
- Java JDK 21+
- Apache Maven 3.9+
- PostgreSQL 17+ (or Docker PostgreSQL container)

### Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/muskanv26/national-weather-intelligence.git
   cd national-weather-intelligence
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your PostgreSQL credentials:
   ```bash
   cp .env.example .env
   ```

3. **Database Setup:**
   Create a PostgreSQL database named `national_weather_db`:
   ```sql
   CREATE DATABASE national_weather_db;
   ```

4. **Backend Setup & Run:**
   ```bash
   cd backend
   mvn clean test     # Run integration tests
   mvn spring-boot:run # Start the backend server on port 8080
   ```

5. **Frontend Setup:** *(Planned for Next Phase)*
   ```bash
   cd frontend
   # Frontend instructions will be added in Phase 2
   ```

## 10. Development Status
- **Current Phase:** Phase 1 — Core Backend Foundation Implemented.
- **Completed:** 
  - Directory structure initialized (`backend/`, `frontend/`, `data/`, `docs/`)
  - Spring Boot 3.x backend application bootstrapped under `com.weatherintel` package
  - `WeatherReport` domain entity with UUID PK, automated `createdAt`, and `EventType`, `Severity`, `SourceType` enums
  - `WeatherReportRepository` extending Spring Data JPA & `JpaSpecificationExecutor`
  - `WeatherReportService` with modular business logic and multi-attribute filter criteria
  - `WeatherReportController` with REST endpoints (`POST /api/v1/reports`, `GET /api/v1/reports`, `GET /api/v1/reports/{id}`)
  - `HealthController` (`GET /api/v1/health`) and Spring Boot Actuator (`GET /actuator/health`)
  - `GlobalExceptionHandler` with standardized JSON error formatting
  - CORS configuration enabling frontend origins (`http://localhost:5173`)
  - Comprehensive integration test suite passing with 100% success rate
- **Next Phase:** Phase 2 — Frontend GIS Dashboard & Visualization Implementation.