package com.weatherintel.dto;

import com.weatherintel.entity.CitizenReport;
import com.weatherintel.entity.SourceType;
import com.weatherintel.entity.VerificationStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CitizenReportResponse {

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
    private Double aiConfidenceScore;
    private Boolean isValid;
    private String reason;
    private UUID duplicateOfId;
    private LocalDateTime createdAt;

    public static CitizenReportResponse fromEntity(CitizenReport entity) {
        boolean verified = entity != null && entity.getVerificationStatus() == VerificationStatus.VERIFIED;
        return fromEntity(entity, verified, null);
    }

    public static CitizenReportResponse fromEntity(CitizenReport entity, boolean isValid, String reason) {
        if (entity == null) {
            return null;
        }
        return CitizenReportResponse.builder()
                .id(entity.getId())
                .rawText(entity.getRawText())
                .imageUrl(entity.getImageUrl())
                .city(entity.getCity())
                .state(entity.getState())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .hashtags(entity.getHashtags())
                .sourceHandle(entity.getSourceHandle())
                .sourceType(entity.getSourceType())
                .verificationStatus(entity.getVerificationStatus())
                .aiConfidenceScore(entity.getAiConfidenceScore())
                .isValid(isValid)
                .reason(reason)
                .duplicateOfId(entity.getDuplicateOfId())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
