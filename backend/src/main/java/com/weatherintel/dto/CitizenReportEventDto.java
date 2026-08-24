package com.weatherintel.dto;

import com.weatherintel.entity.CitizenReport;
import com.weatherintel.entity.SourceType;
import com.weatherintel.entity.VerificationStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CitizenReportEventDto {

    private UUID id;
    private String rawText;
    private String imageUrl;
    private String city;
    private String state;
    private Double latitude;
    private Double longitude;
    private List<String> hashtags;
    private String sourceHandle;
    private SourceType sourceType;
    private VerificationStatus verificationStatus;
    private LocalDateTime createdAt;

    public static CitizenReportEventDto fromEntity(CitizenReport entity) {
        if (entity == null) return null;
        return CitizenReportEventDto.builder()
                .id(entity.getId())
                .rawText(entity.getRawText())
                .imageUrl(entity.getImageUrl())
                .city(entity.getCity())
                .state(entity.getState())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .hashtags(entity.getHashtags() != null ? new ArrayList<>(entity.getHashtags()) : new ArrayList<>())
                .sourceHandle(entity.getSourceHandle())
                .sourceType(entity.getSourceType())
                .verificationStatus(entity.getVerificationStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
