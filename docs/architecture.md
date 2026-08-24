# National Weather Intelligence — System Architecture

**Smart India Hackathon 2026**  
**Problem Statement 26069: National Weather Big Data Analytics Platform**

---

## 1. Overview
**National Weather Intelligence** is a real-time weather and disaster situational-awareness platform engineered for weather data processing, spatial visualization, and risk analytics across India. The platform aggregates weather events from diverse sources (meteorological sensors, citizen reports, weather APIs, news feeds, and government advisories), assesses severity levels, and presents them through an interactive, GIS-based command-center dashboard for emergency response operators and disaster management authorities.

---

## 2. Current Architecture

### Frontend
- **Framework:** React 18+ with Vite
- **Language:** JavaScript (ES6+)
- **GIS / Mapping:** Leaflet & React-Leaflet
- **UI / Styling:** Vanilla CSS (Dark Command-Center Aesthetic), Lucide React Icons
- **Data Visualization:** Recharts
- **HTTP Client:** Axios

#### Frontend Capabilities:
- Interactive GIS-based map of India with layer toggles and center focusing
- Color-coded weather incident markers reflecting severity levels (`CRITICAL`, `HIGH`, `MODERATE`, `LOW`)
- Severity visualization with custom vector SVG pins and pulsing alert rings
- Real-time recent incident feed panel with event-specific icons and timestamps
- Multi-criteria filter toolbar (Event Type, Severity, State, City, Reset)
- Dynamic KPI metric summary cards (Total Reports, High Risk, Verified Reports, States Covered)
- Interactive Recharts analytics (Incident volume by Event Type and Severity distribution)
- Detailed incident modal view presenting full metadata, precise coordinates, and ingestion timestamps

### Backend
- **Language:** Java 21 LTS
- **Framework:** Spring Boot 3.4.3
- **Data Access:** Spring Data JPA / Hibernate
- **Database:** PostgreSQL (with H2 in-memory profile for automated testing)
- **Validation:** Jakarta Bean Validation (`@NotBlank`, `@NotNull`, `@DecimalMin`, `@DecimalMax`)
- **Build System:** Apache Maven

#### Backend Capabilities:
- Clean modular monolith architecture under `com.weatherintel` base package
- `WeatherReport` domain flow with UUID primary keys and automated `@PrePersist` timestamps
- RESTful APIs (`POST /api/v1/reports`, `GET /api/v1/reports`, `GET /api/v1/reports/{id}`)
- Multi-attribute dynamic filtering using JPA Specifications
- Global exception handling (`@RestControllerAdvice`) returning standardized JSON error payloads
- Cross-Origin Resource Sharing (CORS) configuration for frontend development
- System health endpoints (`GET /actuator/health` and `GET /api/v1/health`)
- Automated integration tests implemented and passing

### Current Data Flow

```
React Dashboard
    ↓ (HTTP REST)
Spring Boot API
    ↓
WeatherReportService
    ↓
WeatherReportRepository
    ↓
PostgreSQL
```

---

## 3. Planned Scalable Architecture *(In Progress / Planned)*

To handle high-frequency stream ingestion from automated weather stations, satellite feeds, and IoT sensors across India, the platform is expanding to an event-driven, big-data architecture.

### Planned Data Flow

```
Weather Data Sources
        ↓
   Kafka Producer
        ↓
    Kafka Topic
        ↓
   Kafka Consumer
        ↓
   ┌────┴────┐
   ↓         ↓
 HBase   PostgreSQL
 raw/      application
historical   data
   data        ↓
               ↓
        Spring Boot API
               ↓
        React GIS Dashboard
```

> **Note:** Apache Kafka and Apache HBase components are **PLANNED / IN PROGRESS**. The current operational baseline uses the direct REST → Spring Boot → PostgreSQL pipeline.

- **Apache Kafka (Planned):** Acts as the high-throughput, distributed event stream buffer for decoupled real-time data ingestion.
- **Apache HBase (Planned):** Evaluated as a wide-column NoSQL database for large-scale storage of raw and historical sensor telemetry across climate observations.
- **PostgreSQL (Implemented):** Primary relational application database for structured weather reports, indexed queries, and active incident metrics.

---

## 4. Role of Each Technology

| Technology | Status | Intended Role in Platform |
| :--- | :--- | :--- |
| **PostgreSQL** | **Implemented** | Primary relational application database for structured weather reports, indexed queries, and active incident metrics. |
| **Apache Kafka** | **Planned** | Distributed event streaming backbone providing high-throughput ingestion, buffer queuing, and pub/sub decoupling for incoming telemetry. |
| **Apache HBase** | **Planned** | Wide-column NoSQL database for massive-scale raw telemetry log archives and multi-year climate history querying. |
| **Spring Boot** | **Implemented** | Core backend processing engine providing REST APIs, business validation, data persistence logic, and service orchestration. |
| **React / Leaflet** | **Implemented** | High-performance frontend single-page application rendering interactive GIS maps, real-time feeds, filter controls, and analytics dashboards. |

---

## 5. Event Processing Pipeline

```
Weather Event (Sensor / API / Citizen)
    ↓
Kafka Event Stream (Planned)
    ↓
Consumer Processing Engine (Planned)
    ↓
┌───────────────────────────────┴───────────────────────────────┐
↓                                                               ↓
Raw / Historical Storage (HBase - Planned)    Risk Assessment & Anomaly Detection Engine (Planned)
                                                                ↓
                                              Application Database (PostgreSQL - Implemented)
                                                                ↓
                                              Spring Boot REST API (Implemented)
                                                                ↓
                                              React GIS Dashboard (Implemented)
```

---

## 6. Git Collaboration Workflow

To maintain production stability during development, the repository follows a structured Git feature-branch workflow:

```
main (Stable Release Branch)
 ├── feature/kafka-hbase-pipeline (Planned streaming pipeline implementation)
 ├── feature/weather-ingestion    (Planned automated sensor ingestion adapters)
 ├── feature/risk-intelligence    (Planned AI/ML anomaly scoring module)
 └── feature/frontend-integration (Completed React dashboard & map integration)
```

### Development Guidelines:
- **`main`** is reserved strictly for stable, verified, build-tested production code.
- All new features and experimentations are developed in dedicated `feature/*` branches.
- Feature branches are pushed to GitHub and merged into `main` via Pull Requests (PRs) after review and passing automated CI/CD builds.
- Direct unreviewed experimental pushes to `main` are strictly prohibited.

---

## 7. Current Status Summary

### Completed (Phase 0 - Phase 2):
- [x] Spring Boot 3.x backend foundation in Java 21
- [x] PostgreSQL database integration & JPA persistence
- [x] `WeatherReport` domain model, repository, service, and controller flow
- [x] RESTful API endpoints (`POST`, `GET`, `GET by ID`, query filters)
- [x] Jakarta Bean validation & global exception handling
- [x] CORS configuration & health check endpoints (`/actuator/health`, `/api/v1/health`)
- [x] Automated integration tests implemented and passing
- [x] React + Vite single page frontend application
- [x] Leaflet GIS India map with severity-coded vector SVG markers & popups
- [x] Incident feed panel with event-specific icons and map marker focus triggers
- [x] Multi-criteria filter bar (Event Type, Severity, State, City, Reset)
- [x] Dynamic KPI summary cards & Recharts analytics section
- [x] Detailed report modal viewer
- [x] Production frontend build verified (`npm run build`)

### In Progress / Planned (Future Phases):
- [ ] Real-time automated weather sensor data ingestion adapters
- [ ] Apache Kafka distributed event streaming pipeline
- [ ] Apache HBase wide-column NoSQL data warehouse
- [ ] Real-time WebSocket / SSE push delivery to React dashboard
- [ ] AI/ML anomaly detection and extreme weather risk scoring models
