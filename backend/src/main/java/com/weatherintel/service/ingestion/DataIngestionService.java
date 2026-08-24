package com.weatherintel.service.ingestion;

import com.fasterxml.jackson.databind.JsonNode;
import com.weatherintel.entity.EventType;
import com.weatherintel.entity.Severity;
import com.weatherintel.entity.SourceType;
import com.weatherintel.entity.WeatherReport;
import com.weatherintel.repository.WeatherReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataIngestionService {

    private final WeatherReportRepository repository;
    private final RestClient restClient = RestClient.create();

    @Value("${openweathermap.api.key:#{environment.OPENWEATHERMAP_API_KEY}}")
    private String openWeatherKey;

    private LocalDateTime lastFetchTime = LocalDateTime.MIN;

    public void triggerOnDemandRefresh() {
        if (openWeatherKey == null || openWeatherKey.isBlank()) {
            log.warn("OPENWEATHERMAP_API_KEY is not set. Skipping ingestion.");
            return;
        }

        if (LocalDateTime.now().isBefore(lastFetchTime.plusMinutes(5))) {
            log.info("Data is already fresh. Skipping refresh to save API limit.");
            return;
        }

        log.info("Starting on-demand fetch from OpenWeatherMap...");
        fetchFromOpenWeatherMap();
        lastFetchTime = LocalDateTime.now();
        log.info("Finished on-demand fetch.");
    }

    private void fetchFromOpenWeatherMap() {
        List<String> cities = Arrays.asList("Mumbai", "Delhi", "Chennai", "Kolkata", "Bengaluru", "Hyderabad");

        for (String city : cities) {
            String url = "https://api.openweathermap.org/data/2.5/weather?q=" + city + ",IN&appid=" + openWeatherKey + "&units=metric";

            try {
                JsonNode response = restClient.get()
                        .uri(url)
                        .retrieve()
                        .body(JsonNode.class);

                if (response != null) {
                    WeatherReport report = mapToWeatherReport(response, city);
                    repository.save(report);
                    log.info("Saved new weather report for city: {}", city);
                }
            } catch (Exception e) {
                log.error("Failed to fetch data for city {}: {}", city, e.getMessage());
            }
        }
    }

    private WeatherReport mapToWeatherReport(JsonNode node, String city) {
        String mainWeather = node.path("weather").get(0).path("main").asText("");
        String desc = node.path("weather").get(0).path("description").asText("");
        double temp = node.path("main").path("temp").asDouble();
        double lat = node.path("coord").path("lat").asDouble();
        double lon = node.path("coord").path("lon").asDouble();

        EventType eventType = determineEventType(mainWeather, temp);
        Severity severity = determineSeverity(mainWeather, temp);

        String title = "Live OpenWeather Update: " + mainWeather;
        String description = String.format("Current temperature is %.1f°C. Conditions: %s.", temp, desc);

        return WeatherReport.builder()
                .title(title)
                .description(description)
                .eventType(eventType)
                .severity(severity)
                .city(city)
                .state("Unknown") // OWM doesn't easily return state for all cities in this endpoint
                .latitude(lat)
                .longitude(lon)
                .source(SourceType.WEATHER_API)
                .reportedAt(LocalDateTime.now())
                .build();
    }

    private EventType determineEventType(String weatherMain, double temp) {
        String w = weatherMain.toLowerCase();
        if (w.contains("rain") || w.contains("drizzle")) return EventType.RAIN;
        if (w.contains("thunderstorm")) return EventType.THUNDERSTORM;
        if (w.contains("snow")) return EventType.OTHER;
        if (w.contains("clear") || w.contains("clouds") || w.contains("haze") || w.contains("mist")) {
            if (temp > 40) return EventType.HEATWAVE;
            return EventType.OTHER;
        }
        return EventType.OTHER;
    }

    private Severity determineSeverity(String weatherMain, double temp) {
        String w = weatherMain.toLowerCase();
        if (w.contains("thunderstorm") || temp > 45) return Severity.CRITICAL;
        if (temp > 40 || w.contains("heavy rain") || w.contains("squall")) return Severity.HIGH;
        if (w.contains("rain") || temp > 35) return Severity.MODERATE;
        return Severity.LOW;
    }
}
