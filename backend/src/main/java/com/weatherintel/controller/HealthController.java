package com.weatherintel.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        Map<String, Object> response = Map.of(
                "status", "UP",
                "service", "National Weather Intelligence Backend",
                "timestamp", LocalDateTime.now()
        );
        return ResponseEntity.ok(response);
    }
}
