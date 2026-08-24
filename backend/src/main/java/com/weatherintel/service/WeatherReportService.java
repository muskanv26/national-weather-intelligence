package com.weatherintel.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.weatherintel.dto.CitizenReportCreateRequest;
import com.weatherintel.dto.CitizenReportResponse;
import com.weatherintel.dto.CreateWeatherReportRequest;
import com.weatherintel.dto.GeminiValidationResult;
import com.weatherintel.dto.WeatherReportResponse;
import com.weatherintel.entity.CitizenReport;
import com.weatherintel.entity.EventType;
import com.weatherintel.entity.Severity;
import com.weatherintel.entity.SourceType;
import com.weatherintel.entity.VerificationStatus;
import com.weatherintel.entity.WeatherReport;
import com.weatherintel.exception.ReportRejectedException;
import com.weatherintel.exception.ResourceNotFoundException;
import com.weatherintel.geo.CityGeocoder;
import com.weatherintel.repository.CitizenReportRepository;
import com.weatherintel.repository.WeatherReportRepository;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class WeatherReportService {

    private static final Logger log = LoggerFactory.getLogger(WeatherReportService.class);

    private final WeatherReportRepository repository;
    private final CitizenReportRepository citizenReportRepository;
    private final GeminiValidationService geminiValidationService;
    private final CityGeocoder cityGeocoder;
    private final ObjectMapper objectMapper;

    public WeatherReportService(
            WeatherReportRepository repository,
            CitizenReportRepository citizenReportRepository,
            GeminiValidationService geminiValidationService,
            CityGeocoder cityGeocoder,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.citizenReportRepository = citizenReportRepository;
        this.geminiValidationService = geminiValidationService;
        this.cityGeocoder = cityGeocoder;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public WeatherReportResponse createReport(CreateWeatherReportRequest request) {
        CityGeocoder.Coordinates coords = cityGeocoder.resolve(
                request.getCity(), request.getState(), request.getLatitude(), request.getLongitude());

        WeatherReport entity = WeatherReport.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .eventType(request.getEventType() != null ? request.getEventType() : EventType.OTHER)
                .severity(request.getSeverity())
                .city(request.getCity())
                .state(request.getState())
                .latitude(coords.latitude())
                .longitude(coords.longitude())
                .source(request.getSource())
                .verificationStatus(VerificationStatus.VERIFIED)
                .reportedAt(request.getReportedAt())
                .build();

        WeatherReport saved = repository.save(entity);
        return WeatherReportResponse.fromEntity(saved);
    }

    @Transactional
    public CitizenReportResponse processCitizenReport(CitizenReportCreateRequest request) {
        GeminiValidationResult verdict;
        try {
            verdict = geminiValidationService.validate(request);
        } catch (Exception ex) {
            log.warn("Gemini validation threw unexpectedly: {}", ex.getMessage());
            verdict = GeminiValidationResult.invalid("Gemini validation failed");
        }

        if (verdict == null || !verdict.isValid()) {
            String reason = verdict != null && verdict.getReason() != null && !verdict.getReason().isBlank()
                    ? verdict.getReason()
                    : "This report does not look like a genuine weather incident for the given place.";
            throw new ReportRejectedException(reason, verdict);
        }

        CityGeocoder.Coordinates coords = cityGeocoder.resolve(
                request.getCity(), request.getState(), request.getLatitude(), request.getLongitude());

        CitizenReport entity = CitizenReport.builder()
                .rawText(request.getRawText())
                .imageUrl(request.getImageUrl())
                .city(request.getCity())
                .state(request.getState())
                .latitude(coords.latitude())
                .longitude(coords.longitude())
                .hashtags(request.getHashtags() != null ? new ArrayList<>(request.getHashtags()) : new ArrayList<>())
                .sourceHandle(request.getSourceHandle())
                .sourceType(request.getSourceType())
                .verificationStatus(VerificationStatus.VERIFIED)
                .aiConfidenceScore(verdict.getConfidence())
                .createdAt(LocalDateTime.now())
                .build();

        CitizenReport saved = citizenReportRepository.save(entity);
        WeatherReport mapped = persistCitizenAsWeatherReport(saved, EventType.OTHER, Severity.MODERATE);
        logPersistedCitizenReport(saved, mapped);
        return CitizenReportResponse.fromEntity(saved, true, verdict.getReason());
    }

    @Transactional(readOnly = true)
    public List<WeatherReportResponse> getReports(EventType eventType, String state, String city, Severity severity) {
        Specification<WeatherReport> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (eventType != null) {
                predicates.add(cb.equal(root.get("eventType"), eventType));
            }
            if (state != null && !state.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("state")), state.trim().toLowerCase()));
            }
            if (city != null && !city.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
            }
            if (severity != null) {
                predicates.add(cb.equal(root.get("severity"), severity));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<WeatherReportResponse> reports = repository.findAll(spec, Sort.by(Sort.Direction.DESC, "reportedAt")).stream()
                .map(WeatherReportResponse::fromEntity)
                .toList();
        logReportsPayload("GET /api/v1/reports (same payload used by the map)", reports);
        return reports;
    }

    private WeatherReport persistCitizenAsWeatherReport(CitizenReport citizen, EventType eventType, Severity severity) {
        String rawText = citizen.getRawText() != null ? citizen.getRawText().trim() : "Citizen weather report";
        String title = rawText.length() > 90 ? rawText.substring(0, 87) + "..." : rawText;
        SourceType source = citizen.getSourceType() != null ? citizen.getSourceType() : SourceType.CITIZEN;

        WeatherReport weatherReport = WeatherReport.builder()
                .title(title)
                .description(rawText)
                .eventType(eventType != null ? eventType : EventType.OTHER)
                .severity(severity != null ? severity : Severity.MODERATE)
                .city(citizen.getCity())
                .state(citizen.getState())
                .latitude(citizen.getLatitude())
                .longitude(citizen.getLongitude())
                .source(source)
                .verificationStatus(citizen.getVerificationStatus() != null
                        ? citizen.getVerificationStatus()
                        : VerificationStatus.UNVERIFIED)
                .aiConfidenceScore(citizen.getAiConfidenceScore())
                .reportedAt(citizen.getCreatedAt() != null ? citizen.getCreatedAt() : LocalDateTime.now())
                .build();

        return repository.save(weatherReport);
    }

    private void logPersistedCitizenReport(CitizenReport saved, WeatherReport mapped) {
        log.info(
                "Saved citizen report: id={}, city={}, state={}, latitude={}, longitude={}, eventType={}, verificationStatus={}",
                saved.getId(),
                saved.getCity(),
                saved.getState(),
                saved.getLatitude(),
                saved.getLongitude(),
                mapped != null ? mapped.getEventType() : EventType.OTHER,
                saved.getVerificationStatus()
        );
        log.info(
                "Citizen report mapped to weather_reports id={} lat={} lng={} verificationStatus={} (this is what GET /api/v1/reports returns)",
                mapped != null ? mapped.getId() : null,
                mapped != null ? mapped.getLatitude() : null,
                mapped != null ? mapped.getLongitude() : null,
                mapped != null ? mapped.getVerificationStatus() : null
        );
        try {
            log.info("Saved citizen report full JSON=\n{}", objectMapper.writeValueAsString(saved));
            if (mapped != null) {
                log.info("Mapped weather report JSON=\n{}", objectMapper.writeValueAsString(WeatherReportResponse.fromEntity(mapped)));
            }
        } catch (Exception ex) {
            log.warn("Could not serialize saved citizen report: {}", ex.getMessage());
        }
    }

    private void logReportsPayload(String source, List<WeatherReportResponse> reports) {
        log.info("{} count={}", source, reports.size());
        for (WeatherReportResponse report : reports) {
            log.info(
                    "  report id={} city={} state={} latitude={} longitude={} eventType={} source={} (no verificationStatus on this DTO)",
                    report.getId(),
                    report.getCity(),
                    report.getState(),
                    report.getLatitude(),
                    report.getLongitude(),
                    report.getEventType(),
                    report.getSource()
            );
        }
        try {
            log.info("{} exact JSON=\n{}", source, objectMapper.writeValueAsString(reports));
        } catch (Exception ex) {
            log.warn("Could not serialize {} payload: {}", source, ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public WeatherReportResponse getReportById(UUID id) {
        WeatherReport report = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weather report not found with id: " + id));
        return WeatherReportResponse.fromEntity(report);
    }
}
