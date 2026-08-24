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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CitizenReportService {

    private static final Logger log = LoggerFactory.getLogger(CitizenReportService.class);

    private final CitizenReportRepository repository;
    private final CitizenReportEventProducer eventProducer;

    public CitizenReportService(CitizenReportRepository repository, CitizenReportEventProducer eventProducer) {
        this.repository = repository;
        this.eventProducer = eventProducer;
    }

    @Transactional
    public CitizenReportResponse createReport(CitizenReportCreateRequest request) {
        CitizenReport entity = CitizenReport.builder()
                .rawText(request.getRawText())
                .imageUrl(request.getImageUrl())
                .city(request.getCity())
                .state(request.getState())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .hashtags(request.getHashtags() != null ? new ArrayList<>(request.getHashtags()) : new ArrayList<>())
                .sourceHandle(request.getSourceHandle())
                .sourceType(request.getSourceType())
                .verificationStatus(VerificationStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        CitizenReport saved = repository.save(entity);

        try {
            CitizenReportEventDto eventDto = CitizenReportEventDto.fromEntity(saved);
            eventProducer.sendCitizenReportEvent(eventDto);
        } catch (Exception ex) {
            log.warn("Failed to publish Kafka citizen report event for id={}: {}", saved.getId(), ex.getMessage());
        }

        return CitizenReportResponse.fromEntity(saved);
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
