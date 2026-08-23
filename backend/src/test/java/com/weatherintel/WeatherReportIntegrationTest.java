package com.weatherintel;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.weatherintel.dto.CreateWeatherReportRequest;
import com.weatherintel.entity.EventType;
import com.weatherintel.entity.Severity;
import com.weatherintel.entity.SourceType;
import com.weatherintel.repository.WeatherReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WeatherReportIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WeatherReportRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void test1_CreateWeatherReport_Success() throws Exception {
        CreateWeatherReportRequest request = CreateWeatherReportRequest.builder()
                .title("Severe Rainfall in Gurugram")
                .description("Heavy waterlogging reported near Cyber City following continuous cloudburst.")
                .eventType(EventType.FLOOD)
                .severity(Severity.HIGH)
                .city("Gurugram")
                .state("Haryana")
                .latitude(28.4595)
                .longitude(77.0266)
                .source(SourceType.CITIZEN)
                .reportedAt(LocalDateTime.now())
                .build();

        mockMvc.perform(post("/api/v1/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title", is("Severe Rainfall in Gurugram")))
                .andExpect(jsonPath("$.eventType", is("FLOOD")))
                .andExpect(jsonPath("$.severity", is("HIGH")))
                .andExpect(jsonPath("$.city", is("Gurugram")))
                .andExpect(jsonPath("$.state", is("Haryana")))
                .andExpect(jsonPath("$.source", is("CITIZEN")))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void test2_GetAllReports_Success() throws Exception {
        createSampleReport("Cyclone Warning", EventType.CYCLONE, Severity.CRITICAL, "Kolkata", "West Bengal");
        createSampleReport("Heatwave Alert", EventType.HEATWAVE, Severity.MODERATE, "Jaipur", "Rajasthan");

        mockMvc.perform(get("/api/v1/reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void test3_GetReportById_Success() throws Exception {
        String responseContent = createSampleReport("Thunderstorm in Shimla", EventType.THUNDERSTORM, Severity.MODERATE, "Shimla", "Himachal Pradesh");
        String idStr = objectMapper.readTree(responseContent).get("id").asText();

        mockMvc.perform(get("/api/v1/reports/{id}", idStr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(idStr)))
                .andExpect(jsonPath("$.title", is("Thunderstorm in Shimla")))
                .andExpect(jsonPath("$.eventType", is("THUNDERSTORM")));
    }

    @Test
    void test4_FilterByEventType_Success() throws Exception {
        createSampleReport("Flash Flood", EventType.FLOOD, Severity.CRITICAL, "Patna", "Bihar");
        createSampleReport("Heavy Rain", EventType.RAIN, Severity.LOW, "Kochi", "Kerala");

        mockMvc.perform(get("/api/v1/reports")
                        .param("eventType", "FLOOD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].eventType", is("FLOOD")))
                .andExpect(jsonPath("$[0].title", is("Flash Flood")));
    }

    @Test
    void test5_ValidationFailure_InvalidLatitudeAndBlankTitle() throws Exception {
        CreateWeatherReportRequest invalidRequest = CreateWeatherReportRequest.builder()
                .title("") // Blank title
                .description("Invalid coordinates report")
                .eventType(EventType.RAIN)
                .severity(Severity.LOW)
                .city("Mumbai")
                .state("Maharashtra")
                .latitude(190.0) // Invalid latitude (> 90)
                .longitude(72.8777)
                .source(SourceType.WEATHER_API)
                .reportedAt(LocalDateTime.now())
                .build();

        mockMvc.perform(post("/api/v1/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Title is required")))
                .andExpect(jsonPath("$.message", containsString("Latitude must be between -90 and 90")));
    }

    @Test
    void test6_UnknownReportId_Returns404() throws Exception {
        UUID nonExistentId = UUID.randomUUID();

        mockMvc.perform(get("/api/v1/reports/{id}", nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", containsString("Weather report not found with id: " + nonExistentId)));
    }

    @Test
    void test7_HealthEndpoint_Success() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.service", containsString("National Weather Intelligence")));
    }

    private String createSampleReport(String title, EventType eventType, Severity severity, String city, String state) throws Exception {
        CreateWeatherReportRequest request = CreateWeatherReportRequest.builder()
                .title(title)
                .description("Sample weather event report description")
                .eventType(eventType)
                .severity(severity)
                .city(city)
                .state(state)
                .latitude(20.5937)
                .longitude(78.9629)
                .source(SourceType.GOVERNMENT)
                .reportedAt(LocalDateTime.now())
                .build();

        return mockMvc.perform(post("/api/v1/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }
}
