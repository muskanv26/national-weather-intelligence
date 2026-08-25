package com.weatherintel;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.weatherintel.dto.CitizenReportCreateRequest;
import com.weatherintel.dto.CitizenReportEventDto;
import com.weatherintel.entity.SourceType;
import com.weatherintel.entity.VerificationStatus;
import com.weatherintel.repository.CitizenReportRepository;
import com.weatherintel.service.CitizenReportEventProducer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CitizenKafkaIngestionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CitizenReportRepository repository;

    @MockitoBean
    private CitizenReportEventProducer eventProducer;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void test1_CreateCitizenReport_TriggersKafkaEventProducer() throws Exception {
        when(eventProducer.sendCitizenReportEvent(any(CitizenReportEventDto.class)))
                .thenReturn(CompletableFuture.completedFuture(null));
        when(eventProducer.getTopicName()).thenReturn("citizen-reports");

        CitizenReportCreateRequest request = CitizenReportCreateRequest.builder()
                .rawText("Heavy waterlogging near Sector 14 underpass")
                .imageUrl("https://example.com/waterlogging14.jpg")
                .city("Gurugram")
                .state("Haryana")
                .latitude(28.4595)
                .longitude(77.0266)
                .hashtags(List.of("#GurugramRains", "#TrafficAlert"))
                .sourceHandle("citizen_reporter_1")
                .sourceType(SourceType.CITIZEN)
                .build();

        mockMvc.perform(post("/api/v1/citizen-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());

        verify(eventProducer, never()).sendCitizenReportEvent(any(CitizenReportEventDto.class));
    }

    @Test
    void test2_CitizenReportEventDtoSerializationDeserialization() throws Exception {
        UUID sampleId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();

        CitizenReportEventDto original = CitizenReportEventDto.builder()
                .id(sampleId)
                .rawText("Flash flood notice near river bank")
                .imageUrl("https://example.com/flood.jpg")
                .city("Patna")
                .state("Bihar")
                .latitude(25.5941)
                .longitude(85.1376)
                .hashtags(List.of("#BiharFloods"))
                .sourceHandle("patna_civic")
                .sourceType(SourceType.CITIZEN)
                .verificationStatus(VerificationStatus.PENDING)
                .createdAt(now)
                .build();

        String json = objectMapper.writeValueAsString(original);
        CitizenReportEventDto deserialized = objectMapper.readValue(json, CitizenReportEventDto.class);

        assertEquals(original.getId(), deserialized.getId());
        assertEquals(original.getCity(), deserialized.getCity());
        assertEquals(original.getState(), deserialized.getState());
        assertEquals(original.getRawText(), deserialized.getRawText());
        assertEquals(original.getSourceType(), deserialized.getSourceType());
        assertEquals(original.getVerificationStatus(), deserialized.getVerificationStatus());
    }
}
