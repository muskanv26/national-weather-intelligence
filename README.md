# National Weather Intelligence

**Smart India Hackathon 2026 — Problem Statement 26069**  
A backend-focused weather intelligence platform for ingesting, processing, and persisting weather and citizen-reported events through REST APIs and event-driven Kafka pipelines.

## Overview

National Weather Intelligence is designed as a scalable backend foundation for a unified weather-data platform. It combines Spring Boot REST APIs, PostgreSQL persistence, and Apache Kafka event streaming to support asynchronous processing of high-frequency weather events.

The project focuses on reliable ingestion, validation, regional event partitioning, duplicate handling, observability, and a clear path toward downstream analytics and GIS-based visualization.

## Key Features

- **Weather Event APIs** — Create, retrieve, and filter weather reports through REST endpoints.
- **Event Validation** — Validates required fields and geographic coordinates using Jakarta Bean Validation.
- **Centralized Error Handling** — Standardized JSON error responses through a global exception handler.
- **Kafka Event Streaming** — Producer/consumer workflow for asynchronous weather-event processing.
- **Regional Partitioning** — Uses `state:city` as the Kafka message key so events for a region are routed consistently.
- **Duplicate Event Handling** — Prevents repeated events from being persisted as separate records.
- **PostgreSQL Persistence** — Stores processed weather reports using Spring Data JPA/Hibernate.
- **Health Monitoring** — Spring Boot Actuator plus an application health endpoint.
- **Automated Testing** — Backend tests using Spring Boot testing and MockMvc.
- **GIS Dashboard** — React-based dashboard with live weather reports, spatial visualization, incident feeds, and analytics.

## Architecture

```text
Weather / Citizen Event Sources
            |
            v
   Spring Boot REST API
            |
            v
      Kafka Producer
            |
            v
   weather-events topic
     (3 partitions)
            |
            v
      Kafka Consumer
            |
            v
 Validation / Processing
            |
            +------> Duplicate Handling
            |
            v
        PostgreSQL
            |
            v
      REST API / Dashboard
            |
            v
       GIS Visualization
```

### Why Kafka?

Kafka separates event ingestion from downstream processing. This allows producers to continue accepting events while consumers process them asynchronously. Regional message keys also provide consistent partition routing for observations belonging to the same state and city.

## Technology Stack

| Layer | Technologies |
|---|---|
| Language | Java 21 |
| Backend | Spring Boot 3, Spring Data JPA, Hibernate |
| APIs | REST, Jakarta Bean Validation |
| Messaging | Apache Kafka, Spring Kafka |
| Database | PostgreSQL |
| Testing | Spring Boot Test, MockMvc |
| Build | Maven |
| Frontend | React, Vite, JavaScript |
| Visualization | Leaflet / GIS |
| Infrastructure | Docker |

## Project Structure

```text
national-weather-intelligence/
├── backend/
│   ├── src/main/java/com/weatherintel/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── exception/
│   │   ├── repository/
│   │   └── service/
│   └── src/test/java/
├── frontend/
├── data/
├── docs/
├── .env.example
└── README.md
```

## Example Kafka Ingestion Request

```bash
curl -X POST http://localhost:8080/api/v1/ingestion/weather \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "temperature": 42.5,
    "humidity": 68.0,
    "precipitation": 12.4,
    "windSpeed": 45.0,
    "atmosphericPressure": 1008.2,
    "eventType": "HEATWAVE",
    "severity": "HIGH",
    "sourceType": "WEATHER_API",
    "state": "Delhi",
    "city": "New Delhi"
  }'
```

The ingestion API accepts the event and publishes it to Kafka for asynchronous processing.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/reports` | Create a weather report |
| `GET` | `/api/v1/reports` | Retrieve/filter reports |
| `GET` | `/api/v1/reports/{id}` | Retrieve a report by ID |
| `POST` | `/api/v1/ingestion/weather` | Queue a weather event through Kafka |
| `GET` | `/api/v1/health` | Application health check |
| `GET` | `/actuator/health` | Spring Boot health endpoint |

## Local Development

### Prerequisites

- Java 21+
- Maven 3.9+
- PostgreSQL
- Docker
- Node.js / npm

### Backend

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

On Windows:

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Use `.env.example` as the starting point for local environment configuration. Do not commit database passwords, API keys, or other secrets.

## Current Implementation

- Java 21 + Spring Boot backend
- Weather report domain model and PostgreSQL persistence
- REST APIs with validation and centralized exception handling
- Spring Kafka producer/consumer pipeline
- `weather-events` Kafka topic with three partitions
- State/city-based Kafka partition keys and consumer groups
- Duplicate-event handling
- Health monitoring
- Automated backend testing
- React GIS dashboard connected to the backend

## Roadmap

The architecture is intentionally extensible toward larger-scale telemetry ingestion, historical analytics, advanced spatial processing, and AI-assisted weather intelligence.

## Author

**Muskan Varshney**  
[GitHub](https://github.com/muskanv26) • [LinkedIn](https://www.linkedin.com/in/muskan-varshney-b2a9a5335/)