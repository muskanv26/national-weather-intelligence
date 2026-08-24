package com.weatherintel.service;

import com.weatherintel.dto.CitizenReportEventDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class CitizenReportEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(CitizenReportEventConsumer.class);

    @KafkaListener(
            topics = "${kafka.topic.citizen-reports:citizen-reports}",
            groupId = "${kafka.consumer.group-id:weather-intelligence-group}",
            containerFactory = "citizenReportKafkaListenerContainerFactory",
            autoStartup = "${spring.kafka.listener.auto-startup:true}"
    )
    public void consumeCitizenReportEvent(CitizenReportEventDto eventDto) {
        log.info("Received Kafka citizen report event payload: id={}, city={}, state={}, status={}, sourceType={}, rawText={}",
                eventDto.getId(),
                eventDto.getCity(),
                eventDto.getState(),
                eventDto.getVerificationStatus(),
                eventDto.getSourceType(),
                eventDto.getRawText());

        // Downstream processing (AI verification, HBase storage, duplicate detection) can hook in here in future steps
    }
}
