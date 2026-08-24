package com.weatherintel.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weatherintel.config.GeminiConfig.GeminiProperties;
import com.weatherintel.dto.CitizenReportCreateRequest;
import com.weatherintel.dto.GeminiValidationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiValidationService {

    private static final Logger log = LoggerFactory.getLogger(GeminiValidationService.class);

    private final RestClient geminiRestClient;
    private final GeminiProperties geminiProperties;
    private final ObjectMapper objectMapper;

    public GeminiValidationService(
            @Qualifier("geminiRestClient") RestClient geminiRestClient,
            GeminiProperties geminiProperties,
            ObjectMapper objectMapper) {
        this.geminiRestClient = geminiRestClient;
        this.geminiProperties = geminiProperties;
        this.objectMapper = objectMapper;
    }

    public GeminiValidationResult validate(CitizenReportCreateRequest report) {
        if (report == null) {
            return GeminiValidationResult.invalid("Citizen report payload was empty");
        }
        if (!geminiProperties.isConfigured()) {
            log.error("GEMINI_API_KEY is missing or blank; cannot call Generative Language API");
            return GeminiValidationResult.invalid("Gemini API key is not configured");
        }

        log.info(
                "Gemini key present: length={} prefix={} model={} fallbacks={}",
                geminiProperties.apiKey().length(),
                maskKeyPrefix(geminiProperties.apiKey()),
                geminiProperties.model(),
                geminiProperties.fallbackModels()
        );

        try {
            Map<String, Object> payload = buildRequestPayload(report);
            String requestJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(payload);
            GeminiHttpResult httpResult = callWithRetries(payload, requestJson);
            if (httpResult == null) {
                return GeminiValidationResult.invalid("Gemini API returned no usable response after retries");
            }

            if (!httpResult.success()) {
                log.error(
                        "Gemini HTTP error status={} body={}",
                        httpResult.status(),
                        httpResult.body()
                );
                return GeminiValidationResult.invalid("Gemini HTTP " + httpResult.status() + ": " + truncate(httpResult.body(), 400));
            }

            GeminiValidationResult result = parseResponse(httpResult.body());
            logVerdict(result);
            return result;
        } catch (Exception ex) {
            log.error("Gemini validation failed with exception: {}", ex.toString(), ex);
            return GeminiValidationResult.invalid("Gemini validation failed: " + ex.getMessage());
        }
    }

    private GeminiHttpResult callWithRetries(Map<String, Object> payload, String requestJson) {
        List<String> models = geminiProperties.modelCandidates();
        GeminiHttpResult last = null;

        for (String modelName : models) {
            String path = geminiProperties.generateContentPath(modelName);
            String url = geminiProperties.baseUrl() + path;
            for (int attempt = 1; attempt <= 2; attempt++) {
                log.info("Gemini outgoing request attempt={} model={} url={}", attempt, modelName, url);
                log.info("Gemini outgoing request body=\n{}", requestJson);
                last = executeCall(path, payload);
                log.info("Gemini raw HTTP status={} model={}", last.status(), modelName);
                log.info("Gemini raw response body=\n{}", last.body());

                if (last.success()) {
                    return last;
                }
                if (last.status() == 404 || last.status() == 400) {
                    log.warn("Gemini model {} rejected with HTTP {}; trying next model if available", modelName, last.status());
                    break;
                }
                if (last.status() == 503 || last.status() == 429) {
                    log.warn("Gemini model {} overloaded (HTTP {}); retrying", modelName, last.status());
                    sleepQuietly(800L * attempt);
                } else {
                    return last;
                }
            }
        }
        return last;
    }

    private GeminiHttpResult executeCall(String path, Map<String, Object> payload) {
        try {
            return geminiRestClient.post()
                    .uri(path)
                    .body(payload)
                    .exchange((request, response) -> {
                        HttpStatusCode status = response.getStatusCode();
                        String body = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
                        return new GeminiHttpResult(status.value(), body);
                    });
        } catch (Exception ex) {
            log.error("Gemini HTTP transport error: {}", ex.toString(), ex);
            return new GeminiHttpResult(0, ex.toString());
        }
    }

    private Map<String, Object> buildRequestPayload(CitizenReportCreateRequest report) {
        String prompt = """
                You only check whether this citizen submission is a genuine, coherent weather incident for the given place.
                Set isValid=true only if the description matches real weather or disaster conditions in that city/state.
                Set isValid=false for spam, jokes, ads, politics, empty claims, or reports that don't match the location.
                Return JSON that matches the schema exactly.
                
                Description: %s
                City: %s
                State: %s
                Hashtags: %s
                Latitude: %s
                Longitude: %s
                Image URL: %s
                """.formatted(
                nullToDash(report.getRawText()),
                nullToDash(report.getCity()),
                nullToDash(report.getState()),
                report.getHashtags() == null || report.getHashtags().isEmpty() ? "none" : String.join(", ", report.getHashtags()),
                report.getLatitude() != null ? report.getLatitude() : "not provided",
                report.getLongitude() != null ? report.getLongitude() : "not provided",
                nullToDash(report.getImageUrl())
        );

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> content = Map.of("role", "user", "parts", List.of(textPart));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", 0.1);
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("responseSchema", responseSchema());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("contents", List.of(content));
        payload.put("generationConfig", generationConfig);
        return payload;
    }

    private Map<String, Object> responseSchema() {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("isValid", typed("boolean"));
        properties.put("confidence", typed("number"));
        properties.put("reason", typed("string"));

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", properties);
        schema.put("required", List.of("isValid", "confidence", "reason"));
        return schema;
    }

    private GeminiValidationResult parseResponse(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            log.error("Gemini JSON parse failure: empty response body");
            return GeminiValidationResult.invalid("Gemini returned an empty response");
        }

        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            if (root.has("error")) {
                log.error("Gemini JSON parse failure: error payload {}", root.get("error"));
                return GeminiValidationResult.invalid(root.path("error").path("message").asText("Gemini error payload"));
            }
            String jsonText = extractCandidateText(root);
            if (jsonText == null || jsonText.isBlank()) {
                log.error("Gemini JSON parse failure: no candidates[].content.parts[].text in {}", rawResponse);
                return GeminiValidationResult.invalid("Gemini response did not contain JSON text");
            }
            log.info("Gemini candidate JSON text=\n{}", jsonText);

            GeminiValidationResult result = objectMapper.readValue(jsonText, GeminiValidationResult.class);
            result.setConfidence(clampConfidence(result.getConfidence()));
            return result;
        } catch (JsonProcessingException ex) {
            log.error("Gemini JSON parse failure: {} raw={}", ex.getOriginalMessage(), rawResponse, ex);
            return GeminiValidationResult.invalid("Failed to parse Gemini JSON: " + ex.getOriginalMessage());
        } catch (Exception ex) {
            log.error("Gemini JSON parse failure: {} raw={}", ex.getMessage(), rawResponse, ex);
            return GeminiValidationResult.invalid("Failed to parse Gemini JSON response");
        }
    }

    private String extractCandidateText(JsonNode root) {
        JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
        if (parts.isArray()) {
            StringBuilder text = new StringBuilder();
            for (JsonNode part : parts) {
                if (part.hasNonNull("text")) {
                    text.append(part.get("text").asText());
                }
            }
            return text.toString();
        }
        return null;
    }

    private Double clampConfidence(Double confidence) {
        if (confidence == null || confidence.isNaN()) {
            return 0.0;
        }
        return Math.min(1.0, Math.max(0.0, confidence));
    }

    private void logVerdict(GeminiValidationResult result) {
        log.info(
                "GEMINI VERDICT isValid={} confidence={} reason={}",
                result.isValid(),
                result.getConfidence(),
                result.getReason()
        );
    }

    private static Map<String, Object> typed(String type) {
        return Map.of("type", type);
    }

    private static String nullToDash(String value) {
        return (value == null || value.isBlank()) ? "not provided" : value;
    }

    private static String maskKeyPrefix(String key) {
        if (key == null || key.length() < 4) {
            return "****";
        }
        return key.substring(0, 4) + "****";
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() <= max ? value : value.substring(0, max) + "...";
    }

    private static void sleepQuietly(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    private record GeminiHttpResult(int status, String body) {
        boolean success() {
            return status >= 200 && status < 300;
        }
    }
}
