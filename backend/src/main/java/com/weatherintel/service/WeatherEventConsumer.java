package com.weatherintel.service;

import com.weatherintel.dto.WeatherEventDto;
import com.weatherintel.entity.WeatherReport;
import com.weatherintel.repository.WeatherReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class WeatherEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(WeatherEventConsumer.class);
    
    private final WeatherReportRepository repository;
    
    public WeatherEventConsumer(WeatherReportRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(
            topics = "${kafka.topic.weather-events:weather-events}",
            groupId = "${kafka.consumer.group-id:weather-intelligence-group}",
            autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void consumeWeatherEvent(WeatherEventDto eventDto) {
        if (eventDto.getExternalId() != null && repository.existsByExternalId(eventDto.getExternalId())) {
            log.info("Duplicate event ignored: externalId={}", eventDto.getExternalId());
            return;
        }

        log.info("Received Kafka weather event payload: id={}, eventType={}, severity={}, city={}, state={}, temp={}°C, timestamp={}",
                eventDto.getId(),
                eventDto.getEventType(),
                eventDto.getSeverity(),
                eventDto.getCity(),
                eventDto.getState(),
                eventDto.getTemperature(),
                eventDto.getTimestamp());

        WeatherReport report = WeatherReport.builder()
                .externalId(eventDto.getExternalId())
                .title(eventDto.getTitle() != null ? eventDto.getTitle() : (eventDto.getEventType() + " in " + eventDto.getCity()))
                .description(eventDto.getDescription() != null ? eventDto.getDescription() : "Automated weather report from social media.")
                .eventType(eventDto.getEventType())
                .severity(eventDto.getSeverity())
                .city(eventDto.getCity())
                .state(eventDto.getState())
                .latitude(eventDto.getLatitude())
                .longitude(eventDto.getLongitude())
                .source(eventDto.getSourceType())
                .imageUrl(eventDto.getImageUrl())
                .reportedAt(eventDto.getTimestamp() != null ? eventDto.getTimestamp() : LocalDateTime.now())
                .build();
                
        repository.save(report);
        log.info("Saved weather report to database!");
    }
}
