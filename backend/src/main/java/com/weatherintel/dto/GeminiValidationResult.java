package com.weatherintel.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class GeminiValidationResult {

    @JsonProperty("isValid")
    private boolean valid;

    private Double confidence;
    private String reason;

    public static GeminiValidationResult invalid(String reason) {
        return GeminiValidationResult.builder()
                .valid(false)
                .confidence(0.0)
                .reason(reason)
                .build();
    }
}
