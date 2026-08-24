package com.weatherintel.controller;

import com.weatherintel.dto.CitizenReportCreateRequest;
import com.weatherintel.dto.CitizenReportResponse;
import com.weatherintel.dto.UpdateCitizenReportStatusRequest;
import com.weatherintel.entity.VerificationStatus;
import com.weatherintel.service.CitizenReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/citizen-reports")
public class CitizenReportController {

    private final CitizenReportService service;

    public CitizenReportController(CitizenReportService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<CitizenReportResponse> createReport(@Valid @RequestBody CitizenReportCreateRequest request) {
        CitizenReportResponse response = service.createReport(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CitizenReportResponse>> getReports(
            @RequestParam(required = false) VerificationStatus status) {
        List<CitizenReportResponse> reports = service.getReports(status);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CitizenReportResponse> getReportById(@PathVariable UUID id) {
        CitizenReportResponse response = service.getReportById(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CitizenReportResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCitizenReportStatusRequest request) {
        CitizenReportResponse response = service.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }
}
