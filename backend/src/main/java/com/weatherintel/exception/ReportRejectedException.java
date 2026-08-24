package com.weatherintel.exception;

import com.weatherintel.dto.GeminiValidationResult;

public class ReportRejectedException extends RuntimeException {

    private final GeminiValidationResult verdict;

    public ReportRejectedException(String message, GeminiValidationResult verdict) {
        super(message);
        this.verdict = verdict;
    }

    public GeminiValidationResult getVerdict() {
        return verdict;
    }
}
