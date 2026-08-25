package com.weatherintel.service;

import com.weatherintel.dto.WeatherEventDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class WeatherEventProducer {

    private static final Logger log = LoggerFactory.getLogger(WeatherEventProducer.class);

    private final KafkaTemplate<String, WeatherEventDto> kafkaTemplate;

    @Value("${kafka.topic.weather-events:weather-events}")
    private String topicName;

    public WeatherEventProducer(KafkaTemplate<String, WeatherEventDto> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public CompletableFuture<SendResult<String, WeatherEventDto>> sendWeatherEvent(WeatherEventDto eventDto) {
        // Derive partition key based on state & city for regional event ordering
        String partitionKey = (eventDto.getState() != null && eventDto.getCity() != null)
                ? (eventDto.getState().toLowerCase().trim() + ":" + eventDto.getCity().toLowerCase().trim())
                : (eventDto.getId() != null ? eventDto.getId().toString() : "default-key");

        log.info("Publishing weather event to Kafka topic [{}]: id={}, eventType={}, severity={}, key={}",
                topicName, eventDto.getId(), eventDto.getEventType(), eventDto.getSeverity(), partitionKey);

        CompletableFuture<SendResult<String, WeatherEventDto>> future = kafkaTemplate.send(topicName, partitionKey, eventDto);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Successfully published weather event to topic [{}] partition [{}] at offset [{}]",
                        topicName,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                log.error("Failed to publish weather event to topic [{}]: {}", topicName, ex.getMessage(), ex);
            }
        });

        return future;
    }

    public String getTopicName() {
        return topicName;
    }
}
