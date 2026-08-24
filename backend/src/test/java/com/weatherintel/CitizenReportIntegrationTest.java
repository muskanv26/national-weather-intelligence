package com.weatherintel;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.weatherintel.dto.CitizenReportCreateRequest;
import com.weatherintel.dto.UpdateCitizenReportStatusRequest;
import com.weatherintel.entity.SourceType;
import com.weatherintel.entity.VerificationStatus;
import com.weatherintel.repository.CitizenReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CitizenReportIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CitizenReportRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void test1_CreateCitizenReport_Success() throws Exception {
        CitizenReportCreateRequest request = CitizenReportCreateRequest.builder()
                .rawText("Waterlogging on Golf Course Road after heavy downpour")
                .imageUrl("https://example.com/waterlogging.jpg")
                .city("Gurugram")
                .state("Haryana")
                .latitude(28.4595)
                .longitude(77.0266)
                .hashtags(List.of("GurugramRain", "Waterlogging"))
                .sourceHandle("@citizen_jane")
                .sourceType(SourceType.CITIZEN)
                .build();

        mockMvc.perform(post("/api/v1/citizen-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.rawText", is("Waterlogging on Golf Course Road after heavy downpour")))
                .andExpect(jsonPath("$.city", is("Gurugram")))
                .andExpect(jsonPath("$.state", is("Haryana")))
                .andExpect(jsonPath("$.sourceType", is("CITIZEN")))
                .andExpect(jsonPath("$.verificationStatus", is("PENDING")))
                .andExpect(jsonPath("$.hashtags", hasSize(2)))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void test2_NewReportDefaultsToPending() throws Exception {
        CitizenReportCreateRequest request = CitizenReportCreateRequest.builder()
                .rawText("Severe wind blowing near coastal belt")
                .city("Kochi")
                .state("Kerala")
                .sourceType(SourceType.SOCIAL_MEDIA)
                .build();

        mockMvc.perform(post("/api/v1/citizen-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verificationStatus", is("PENDING")));
    }

    @Test
    void test3_RequiredFieldValidationWorks() throws Exception {
        CitizenReportCreateRequest invalidRequest = CitizenReportCreateRequest.builder()
                .rawText("") // Blank
                .city("") // Blank
                .state("") // Blank
                .sourceType(null) // Null
                .build();

        mockMvc.perform(post("/api/v1/citizen-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Raw text is required")))
                .andExpect(jsonPath("$.message", containsString("City is required")))
                .andExpect(jsonPath("$.message", containsString("State is required")))
                .andExpect(jsonPath("$.message", containsString("Source type is required")));
    }

    @Test
    void test4_InvalidLatitudeIsRejected() throws Exception {
        CitizenReportCreateRequest invalidRequest = CitizenReportCreateRequest.builder()
                .rawText("Landslide alert near highway")
                .city("Shimla")
                .state("Himachal Pradesh")
                .latitude(95.0) // Invalid latitude > 90
                .longitude(77.1734)
                .sourceType(SourceType.NEWS)
                .build();

        mockMvc.perform(post("/api/v1/citizen-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Latitude must be between -90 and 90")));
    }

    @Test
    void test5_InvalidLongitudeIsRejected() throws Exception {
        CitizenReportCreateRequest invalidRequest = CitizenReportCreateRequest.builder()
                .rawText("Flash flood near river bed")
                .city("Patna")
                .state("Bihar")
                .latitude(25.5941)
                .longitude(-190.0) // Invalid longitude < -180
                .sourceType(SourceType.GOVERNMENT)
                .build();

        mockMvc.perform(post("/api/v1/citizen-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Longitude must be between -180 and 180")));
    }

    @Test
    void test6_GetReturnsCitizenReports() throws Exception {
        createSampleReport("Flood in locality A", "Mumbai", "Maharashtra", SourceType.CITIZEN);
        createSampleReport("Tree fallen on road B", "Pune", "Maharashtra", SourceType.SOCIAL_MEDIA);

        mockMvc.perform(get("/api/v1/citizen-reports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void test7_GetWithStatusPendingFiltersCorrectly() throws Exception {
        String report1Json = createSampleReport("Report 1", "Delhi", "Delhi", SourceType.CITIZEN);
        createSampleReport("Report 2", "Noida", "Uttar Pradesh", SourceType.SOCIAL_MEDIA);

        String id1 = objectMapper.readTree(report1Json).get("id").asText();

        // Update report 1 to VERIFIED
        UpdateCitizenReportStatusRequest updateRequest = UpdateCitizenReportStatusRequest.builder()
                .status(VerificationStatus.VERIFIED)
                .build();

        mockMvc.perform(patch("/api/v1/citizen-reports/{id}/status", id1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());

        // GET with status=PENDING should return only 1 report (Report 2)
        mockMvc.perform(get("/api/v1/citizen-reports").param("status", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].city", is("Noida")))
                .andExpect(jsonPath("$[0].verificationStatus", is("PENDING")));

        // GET with status=VERIFIED should return only 1 report (Report 1)
        mockMvc.perform(get("/api/v1/citizen-reports").param("status", "VERIFIED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].city", is("Delhi")))
                .andExpect(jsonPath("$[0].verificationStatus", is("VERIFIED")));
    }

    @Test
    void test8_PatchChangesPendingToVerified() throws Exception {
        String reportJson = createSampleReport("Heavy hail in village", "Chandigarh", "Punjab", SourceType.CITIZEN);
        String idStr = objectMapper.readTree(reportJson).get("id").asText();

        UpdateCitizenReportStatusRequest updateRequest = UpdateCitizenReportStatusRequest.builder()
                .status(VerificationStatus.VERIFIED)
                .build();

        mockMvc.perform(patch("/api/v1/citizen-reports/{id}/status", idStr)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(idStr)))
                .andExpect(jsonPath("$.verificationStatus", is("VERIFIED")));
    }

    @Test
    void test9_PatchChangesStatusCorrectlyForOtherValidStatuses() throws Exception {
        String reportJson = createSampleReport("Unverified rumour of tornado", "Surat", "Gujarat", SourceType.SOCIAL_MEDIA);
        String idStr = objectMapper.readTree(reportJson).get("id").asText();

        // Update to FLAGGED
        UpdateCitizenReportStatusRequest updateFlagged = UpdateCitizenReportStatusRequest.builder()
                .status(VerificationStatus.FLAGGED)
                .build();

        mockMvc.perform(patch("/api/v1/citizen-reports/{id}/status", idStr)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateFlagged)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationStatus", is("FLAGGED")));

        // Update to REJECTED
        UpdateCitizenReportStatusRequest updateRejected = UpdateCitizenReportStatusRequest.builder()
                .status(VerificationStatus.REJECTED)
                .build();

        mockMvc.perform(patch("/api/v1/citizen-reports/{id}/status", idStr)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRejected)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationStatus", is("REJECTED")));
    }

    @Test
    void test10_InvalidStatusIsRejected() throws Exception {
        String reportJson = createSampleReport("Rain alert", "Jaipur", "Rajasthan", SourceType.CITIZEN);
        String idStr = objectMapper.readTree(reportJson).get("id").asText();

        // Invalid JSON body status string
        String invalidBody = "{\"status\": \"INVALID_STATUS\"}";

        mockMvc.perform(patch("/api/v1/citizen-reports/{id}/status", idStr)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBody))
                .andExpect(status().isBadRequest());

        // Invalid status query parameter
        mockMvc.perform(get("/api/v1/citizen-reports").param("status", "INVALID_STATUS"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void test11_UnknownReportUuidReturnsNotFound() throws Exception {
        UUID nonExistentId = UUID.randomUUID();

        UpdateCitizenReportStatusRequest updateRequest = UpdateCitizenReportStatusRequest.builder()
                .status(VerificationStatus.VERIFIED)
                .build();

        mockMvc.perform(patch("/api/v1/citizen-reports/{id}/status", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", containsString("Citizen report not found with id: " + nonExistentId)));
    }

    private String createSampleReport(String rawText, String city, String state, SourceType sourceType) throws Exception {
        CitizenReportCreateRequest request = CitizenReportCreateRequest.builder()
                .rawText(rawText)
                .city(city)
                .state(state)
                .sourceType(sourceType)
                .build();

        return mockMvc.perform(post("/api/v1/citizen-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }
}
