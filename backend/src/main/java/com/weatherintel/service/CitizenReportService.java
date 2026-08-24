package com.weatherintel.service;

import com.weatherintel.dto.CitizenReportCreateRequest;
import com.weatherintel.dto.CitizenReportEventDto;
import com.weatherintel.dto.CitizenReportResponse;
import com.weatherintel.entity.CitizenReport;
import com.weatherintel.entity.VerificationStatus;
import com.weatherintel.exception.ResourceNotFoundException;
import com.weatherintel.repository.CitizenReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CitizenReportService {

    private static final Logger log = LoggerFactory.getLogger(CitizenReportService.class);

    private final CitizenReportRepository repository;
    private final CitizenReportEventProducer eventProducer;
    private final WeatherReportService weatherReportService;

    public CitizenReportService(
            CitizenReportRepository repository,
            @Nullable CitizenReportEventProducer eventProducer,
            WeatherReportService weatherReportService) {
        this.repository = repository;
        this.eventProducer = eventProducer;
        this.weatherReportService = weatherReportService;
    }

    @Transactional
    public CitizenReportResponse createReport(CitizenReportCreateRequest request) {
        CitizenReportResponse response = weatherReportService.processCitizenReport(request);

        if (eventProducer != null && response.getId() != null) {
            try {
                CitizenReport saved = repository.findById(response.getId()).orElse(null);
                if (saved != null) {
                    eventProducer.sendCitizenReportEvent(CitizenReportEventDto.fromEntity(saved));
                }
            } catch (Exception ex) {
                log.warn("Failed to publish Kafka citizen report event for id={}: {}", response.getId(), ex.getMessage());
            }
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<CitizenReportResponse> getReports(VerificationStatus status) {
        List<CitizenReport> reports;
        if (status != null) {
            reports = repository.findByVerificationStatus(status);
        } else {
            reports = repository.findAll();
        }
        return reports.stream()
                .map(CitizenReportResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public CitizenReportResponse getReportById(UUID id) {
        CitizenReport report = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen report not found with id: " + id));
        return CitizenReportResponse.fromEntity(report);
    }

    @Transactional
    public CitizenReportResponse updateStatus(UUID id, VerificationStatus newStatus) {
        CitizenReport report = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen report not found with id: " + id));

        report.setVerificationStatus(newStatus);
        CitizenReport updated = repository.save(report);
        return CitizenReportResponse.fromEntity(updated);
    }
}
