package com.weatherintel.service;

import com.weatherintel.dto.WeatherEventDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class WeatherEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(WeatherEventConsumer.class);

    @KafkaListener(
            topics = "${kafka.topic.weather-events:weather-events}",
            groupId = "${kafka.consumer.group-id:weather-intelligence-group}",
            autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void consumeWeatherEvent(WeatherEventDto eventDto) {
        log.info("Received Kafka weather event payload: id={}, eventType={}, severity={}, city={}, state={}, temp={}°C, timestamp={}",
                eventDto.getId(),
                eventDto.getEventType(),
                eventDto.getSeverity(),
                eventDto.getCity(),
                eventDto.getState(),
                eventDto.getTemperature(),
                eventDto.getTimestamp());

        // Note: Future HBase wide-column NoSQL persistence layer will be attached here in Phase 2
    }
}
