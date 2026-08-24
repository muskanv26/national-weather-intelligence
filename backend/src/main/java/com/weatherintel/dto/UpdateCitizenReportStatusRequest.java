package com.weatherintel.dto;

import com.weatherintel.entity.VerificationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCitizenReportStatusRequest {

    @NotNull(message = "Verification status is required")
    private VerificationStatus status;
}
