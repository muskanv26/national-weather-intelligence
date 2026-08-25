package com.weatherintel.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class GeminiConfig {

    private static final Logger log = LoggerFactory.getLogger(GeminiConfig.class);

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.base-url:https://generativelanguage.googleapis.com}")
    private String baseUrl;

    @Value("${gemini.api.model:gemini-3.7-flash}")
    private String model;

    @Value("${gemini.api.fallback-models:gemini-3.6-flash,gemini-flash-latest,gemini-2.5-flash}")
    private String fallbackModels;

    @Value("${gemini.api.connect-timeout-ms:5000}")
    private int connectTimeoutMs;

    @Value("${gemini.api.read-timeout-ms:20000}")
    private int readTimeoutMs;

    @PostConstruct
    void logGeminiStatus() {
        boolean configured = apiKey != null && !apiKey.isBlank();
        log.info("Gemini API {}: model={} fallbacks={}",
                configured ? "configured" : "not configured (GEMINI_API_KEY missing)",
                model,
                fallbackModels);
    }

    @Bean
    public GeminiProperties geminiProperties() {
        return new GeminiProperties(apiKey, baseUrl, model, fallbackModels);
    }

    @Bean
    public RestClient geminiRestClient(GeminiProperties geminiProperties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        RestClient.Builder builder = RestClient.builder()
                .baseUrl(geminiProperties.baseUrl())
                .requestFactory(requestFactory)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);

        if (geminiProperties.apiKey() != null && !geminiProperties.apiKey().isBlank()) {
            builder.defaultHeader("x-goog-api-key", geminiProperties.apiKey());
        }

        return builder.build();
    }

    public record GeminiProperties(String apiKey, String baseUrl, String model, String fallbackModels) {

        public String generateContentPath() {
            return generateContentPath(model);
        }

        public String generateContentPath(String modelName) {
            return "/v1beta/models/" + modelName + ":generateContent";
        }

        public java.util.List<String> modelCandidates() {
            java.util.LinkedHashSet<String> models = new java.util.LinkedHashSet<>();
            if (model != null && !model.isBlank()) {
                models.add(model.trim());
            }
            if (fallbackModels != null) {
                for (String candidate : fallbackModels.split(",")) {
                    if (candidate != null && !candidate.isBlank()) {
                        models.add(candidate.trim());
                    }
                }
            }
            return java.util.List.copyOf(models);
        }

        public boolean isConfigured() {
            return apiKey != null && !apiKey.isBlank();
        }
    }
}
