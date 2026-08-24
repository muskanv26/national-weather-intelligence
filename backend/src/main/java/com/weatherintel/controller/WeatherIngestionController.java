package com.weatherintel.controller;

import com.weatherintel.dto.WeatherEventDto;
import com.weatherintel.service.WeatherEventProducer;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ingestion/weather")
public class WeatherIngestionController {

    private final WeatherEventProducer eventProducer;

    public WeatherIngestionController(@Nullable WeatherEventProducer eventProducer) {
        this.eventProducer = eventProducer;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> ingestWeatherEvent(@Valid @RequestBody WeatherEventDto request) {
        if (eventProducer == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "status", "UNAVAILABLE",
                    "message", "Kafka ingestion is disabled in this environment"
            ));
        }
        if (request.getId() == null) {
            request.setId(UUID.randomUUID());
        }
        if (request.getTimestamp() == null) {
            request.setTimestamp(LocalDateTime.now());
        }

        eventProducer.sendWeatherEvent(request);

        Map<String, Object> response = Map.of(
                "status", "QUEUED",
                "message", "Weather event accepted for real-time Kafka ingestion",
                "eventId", request.getId(),
                "topic", eventProducer.getTopicName(),
                "timestamp", LocalDateTime.now()
        );

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }
}
