package com.weatherintel.controller;

import com.weatherintel.dto.CreateWeatherReportRequest;
import com.weatherintel.dto.WeatherReportResponse;
import com.weatherintel.entity.EventType;
import com.weatherintel.entity.Severity;
import com.weatherintel.service.WeatherReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
public class WeatherReportController {

    private final WeatherReportService service;

    public WeatherReportController(WeatherReportService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<WeatherReportResponse> createReport(@Valid @RequestBody CreateWeatherReportRequest request) {
        WeatherReportResponse response = service.createReport(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<WeatherReportResponse>> getReports(
            @RequestParam(required = false) EventType eventType,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Severity severity) {
        List<WeatherReportResponse> reports = service.getReports(eventType, state, city, severity);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WeatherReportResponse> getReportById(@PathVariable UUID id) {
        WeatherReportResponse response = service.getReportById(id);
        return ResponseEntity.ok(response);
    }
}
