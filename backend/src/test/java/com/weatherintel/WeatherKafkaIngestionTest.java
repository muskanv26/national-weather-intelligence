package com.weatherintel;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.weatherintel.dto.WeatherEventDto;
import com.weatherintel.entity.EventType;
import com.weatherintel.entity.Severity;
import com.weatherintel.entity.SourceType;
import com.weatherintel.service.WeatherEventProducer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WeatherKafkaIngestionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private WeatherEventProducer eventProducer;

    @Test
    void test1_IngestWeatherEvent_Success() throws Exception {
        when(eventProducer.sendWeatherEvent(any(WeatherEventDto.class)))
                .thenReturn(CompletableFuture.completedFuture(null));
        when(eventProducer.getTopicName()).thenReturn("weather-events");

        WeatherEventDto validEvent = WeatherEventDto.builder()
                .latitude(28.6139)
                .longitude(77.2090)
                .temperature(42.5)
                .humidity(68.0)
                .precipitation(12.4)
                .windSpeed(45.0)
                .atmosphericPressure(1008.2)
                .eventType(EventType.HEATWAVE)
                .severity(Severity.HIGH)
                .sourceType(SourceType.WEATHER_API)
                .state("Delhi")
                .city("New Delhi")
                .timestamp(LocalDateTime.now())
                .build();

        mockMvc.perform(post("/api/v1/ingestion/weather")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validEvent)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status", is("QUEUED")))
                .andExpect(jsonPath("$.topic", is("weather-events")))
                .andExpect(jsonPath("$.eventId").exists());

        verify(eventProducer).sendWeatherEvent(any(WeatherEventDto.class));
    }

    @Test
    void test2_IngestWeatherEvent_ValidationFailure_InvalidLatitudeAndMissingCity() throws Exception {
        WeatherEventDto invalidEvent = WeatherEventDto.builder()
                .latitude(190.0) // Invalid latitude > 90
                .longitude(77.2090)
                .eventType(EventType.RAIN)
                .severity(Severity.LOW)
                .sourceType(SourceType.CITIZEN)
                .state("Delhi")
                .city("") // Blank city
                .build();

        mockMvc.perform(post("/api/v1/ingestion/weather")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidEvent)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Latitude must be between -90 and 90")))
                .andExpect(jsonPath("$.message", containsString("City is required")));
    }

    @Test
    void test3_WeatherEventDtoSerializationDeserialization() throws Exception {
        WeatherEventDto original = WeatherEventDto.builder()
                .latitude(19.0760)
                .longitude(72.8777)
                .temperature(31.2)
                .humidity(85.0)
                .precipitation(54.0)
                .windSpeed(65.0)
                .atmosphericPressure(998.5)
                .eventType(EventType.RAIN)
                .severity(Severity.CRITICAL)
                .sourceType(SourceType.GOVERNMENT)
                .state("Maharashtra")
                .city("Mumbai")
                .timestamp(LocalDateTime.now())
                .build();

        String json = objectMapper.writeValueAsString(original);
        WeatherEventDto deserialized = objectMapper.readValue(json, WeatherEventDto.class);

        org.junit.jupiter.api.Assertions.assertEquals(original.getCity(), deserialized.getCity());
        org.junit.jupiter.api.Assertions.assertEquals(original.getEventType(), deserialized.getEventType());
        org.junit.jupiter.api.Assertions.assertEquals(original.getTemperature(), deserialized.getTemperature());
    }
}
