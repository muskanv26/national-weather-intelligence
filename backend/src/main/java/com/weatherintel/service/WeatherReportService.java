package com.weatherintel.service;

import com.weatherintel.dto.CreateWeatherReportRequest;
import com.weatherintel.dto.WeatherReportResponse;
import com.weatherintel.entity.EventType;
import com.weatherintel.entity.Severity;
import com.weatherintel.entity.WeatherReport;
import com.weatherintel.exception.ResourceNotFoundException;
import com.weatherintel.repository.WeatherReportRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class WeatherReportService {

    private final WeatherReportRepository repository;

    public WeatherReportService(WeatherReportRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public WeatherReportResponse createReport(CreateWeatherReportRequest request) {
        WeatherReport entity = WeatherReport.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .eventType(request.getEventType())
                .severity(request.getSeverity())
                .city(request.getCity())
                .state(request.getState())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .source(request.getSource())
                .reportedAt(request.getReportedAt())
                .build();

        WeatherReport saved = repository.save(entity);
        return WeatherReportResponse.fromEntity(saved);
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

        return repository.findAll(spec).stream()
                .map(WeatherReportResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public WeatherReportResponse getReportById(UUID id) {
        WeatherReport report = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weather report not found with id: " + id));
        return WeatherReportResponse.fromEntity(report);
    }
}
