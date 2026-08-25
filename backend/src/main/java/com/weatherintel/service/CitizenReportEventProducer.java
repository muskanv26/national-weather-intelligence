package com.weatherintel.service;

import com.weatherintel.dto.CitizenReportEventDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class CitizenReportEventProducer {

    private static final Logger log = LoggerFactory.getLogger(CitizenReportEventProducer.class);

    private final KafkaTemplate<String, CitizenReportEventDto> kafkaTemplate;

    @Value("${kafka.topic.citizen-reports:citizen-reports}")
    private String topicName;

    public CitizenReportEventProducer(KafkaTemplate<String, CitizenReportEventDto> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public CompletableFuture<SendResult<String, CitizenReportEventDto>> sendCitizenReportEvent(CitizenReportEventDto eventDto) {
        // Use CitizenReport UUID/id as the Kafka message key
        String messageKey = (eventDto.getId() != null)
                ? eventDto.getId().toString()
                : UUID.randomUUID().toString();

        log.info("Publishing citizen report event to Kafka topic [{}]: id={}, city={}, state={}, verificationStatus={}, key={}",
                topicName, eventDto.getId(), eventDto.getCity(), eventDto.getState(), eventDto.getVerificationStatus(), messageKey);

        CompletableFuture<SendResult<String, CitizenReportEventDto>> future = kafkaTemplate.send(topicName, messageKey, eventDto);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Successfully published citizen report event to topic [{}] partition [{}] at offset [{}]",
                        topicName,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                log.error("Failed to publish citizen report event to topic [{}]: {}", topicName, ex.getMessage(), ex);
            }
        });

        return future;
    }

    public String getTopicName() {
        return topicName;
    }
}
