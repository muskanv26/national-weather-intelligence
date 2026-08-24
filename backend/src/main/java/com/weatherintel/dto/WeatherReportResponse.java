package com.weatherintel.dto;

import com.weatherintel.entity.EventType;
import com.weatherintel.entity.Severity;
import com.weatherintel.entity.SourceType;
import com.weatherintel.entity.WeatherReport;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeatherReportResponse {

    private UUID id;
    private String title;
    private String description;
    private String author;
    private String imageUrl;
    private String externalId;
    private EventType eventType;
    private Severity severity;
    private String city;
    private String state;
    private Double latitude;
    private Double longitude;
    private SourceType source;
    private LocalDateTime reportedAt;
    private LocalDateTime createdAt;

    public static WeatherReportResponse fromEntity(WeatherReport entity) {
        return WeatherReportResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .externalId(entity.getExternalId())
                .eventType(entity.getEventType())
                .severity(entity.getSeverity())
                .city(entity.getCity())
                .state(entity.getState())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .source(entity.getSource())
                .reportedAt(entity.getReportedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
