package com.weatherintel.config;

import com.weatherintel.entity.EventType;
import com.weatherintel.entity.Severity;
import com.weatherintel.entity.SourceType;
import com.weatherintel.entity.WeatherReport;
import com.weatherintel.repository.WeatherReportRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

        private final WeatherReportRepository repository;

        public DatabaseSeeder(WeatherReportRepository repository) {
                this.repository = repository;
        }

        @Override
        public void run(String... args) {
                if (repository.count() == 0) {
                        List<WeatherReport> seedReports = List.of(
                                        WeatherReport.builder()
                                                        .title("Severe Cyclonic Storm Warning & Coastal Surge")
                                                        .description("IMD issues red alert for severe cyclonic landfall near Sundarbans. Gusty winds exceeding 120 km/h with heavy rainfall expected.")
                                                        .eventType(EventType.CYCLONE)
                                                        .severity(Severity.CRITICAL)
                                                        .city("Kolkata")
                                                        .state("West Bengal")
                                                        .latitude(22.5726)
                                                        .longitude(88.3639)
                                                        .source(SourceType.GOVERNMENT)
                                                        .reportedAt(LocalDateTime.now().minusHours(2))
                                                        .build(),
                                        WeatherReport.builder()
                                                        .title("Urban Waterlogging & Cloudburst Flash Flood")
                                                        .description("Continuous heavy rain causes submersed underpasses and massive traffic gridlocks across Cyber City and Golf Course Road.")
                                                        .eventType(EventType.FLOOD)
                                                        .severity(Severity.HIGH)
                                                        .city("Gurugram")
                                                        .state("Haryana")
                                                        .latitude(28.4595)
                                                        .longitude(77.0266)
                                                        .source(SourceType.CITIZEN)
                                                        .reportedAt(LocalDateTime.now().minusHours(1))
                                                        .build(),
                                        WeatherReport.builder()
                                                        .title("Extreme Heatwave Alert & Thermal Strain")
                                                        .description("Temperatures cross 46.5°C in western districts. Public safety advisory issued to prevent heatstroke and dehydration.")
                                                        .eventType(EventType.HEATWAVE)
                                                        .severity(Severity.CRITICAL)
                                                        .city("Jaipur")
                                                        .state("Rajasthan")
                                                        .latitude(26.9124)
                                                        .longitude(75.7873)
                                                        .source(SourceType.WEATHER_API)
                                                        .reportedAt(LocalDateTime.now().minusHours(3))
                                                        .build(),
                                        WeatherReport.builder()
                                                        .title("Monsoon Downpour & High Tide Warning")
                                                        .description("Heavy continuous rains combined with 4.5m high tide prompt civic alerts along Marine Drive and low-lying coastal quarters.")
                                                        .eventType(EventType.RAIN)
                                                        .severity(Severity.HIGH)
                                                        .city("Mumbai")
                                                        .state("Maharashtra")
                                                        .latitude(19.0760)
                                                        .longitude(72.8777)
                                                        .source(SourceType.NEWS)
                                                        .reportedAt(LocalDateTime.now().minusHours(4))
                                                        .build(),
                                        WeatherReport.builder()
                                                        .title("Severe Thunderstorm & Lightning Strikes")
                                                        .description("Intense convective lightning and hail recorded in upper ridge areas. Local power distribution disrupted.")
                                                        .eventType(EventType.THUNDERSTORM)
                                                        .severity(Severity.MODERATE)
                                                        .city("Shimla")
                                                        .state("Himachal Pradesh")
                                                        .latitude(31.1048)
                                                        .longitude(77.1734)
                                                        .source(SourceType.GOVERNMENT)
                                                        .reportedAt(LocalDateTime.now().minusHours(5))
                                                        .build(),
                                        WeatherReport.builder()
                                                        .title("River Basin Overflow & Inundation Warning")
                                                        .description("Ganges water level surpasses danger mark near Digha Ghat. NDRF teams deployed for low-lying evacuations.")
                                                        .eventType(EventType.FLOOD)
                                                        .severity(Severity.CRITICAL)
                                                        .city("Patna")
                                                        .state("Bihar")
                                                        .latitude(25.5941)
                                                        .longitude(85.1376)
                                                        .source(SourceType.GOVERNMENT)
                                                        .reportedAt(LocalDateTime.now().minusHours(2))
                                                        .build(),
                                        WeatherReport.builder()
                                                        .title("Dust Storm & Severe Squall")
                                                        .description("Visibility reduced to under 50m due to intense dust storm carrying winds up to 75 km/h.")
                                                        .eventType(EventType.DUST_STORM)
                                                        .severity(Severity.MODERATE)
                                                        .city("Ahmedabad")
                                                        .state("Gujarat")
                                                        .latitude(23.0225)
                                                        .longitude(72.5714)
                                                        .source(SourceType.SOCIAL_MEDIA)
                                                        .reportedAt(LocalDateTime.now().minusHours(6))
                                                        .build(),
                                        WeatherReport.builder()
                                                        .title("Coastal Gales & High Sea Swells")
                                                        .description("Fishermen warned against venturing into deep sea due to persistent gale winds and heavy swells.")
                                                        .eventType(EventType.STRONG_WIND)
                                                        .severity(Severity.MODERATE)
                                                        .city("Chennai")
                                                        .state("Tamil Nadu")
                                                        .latitude(13.0827)
                                                        .longitude(80.2707)
                                                        .source(SourceType.WEATHER_API)
                                                        .reportedAt(LocalDateTime.now().minusHours(1))
                                                        .build(),
                                        WeatherReport.builder()
                                                        .title("Dense Morning Radiation Fog")
                                                        .description("Airport operations experience minor delay due to zero visibility fog over runway sectors.")
                                                        .eventType(EventType.FOG)
                                                        .severity(Severity.LOW)
                                                        .city("New Delhi")
                                                        .state("Delhi")
                                                        .latitude(28.6139)
                                                        .longitude(77.2090)
                                                        .source(SourceType.WEATHER_API)
                                                        .reportedAt(LocalDateTime.now().minusHours(7))
                                                        .build(),
                                        WeatherReport.builder()
                                                        .title("Monsoon Inundation & Heavy Rainfall")
                                                        .description("Low-lying residential colonies report waterlogging following overnight heavy showers.")
                                                        .eventType(EventType.RAIN)
                                                        .severity(Severity.MODERATE)
                                                        .city("Bengaluru")
                                                        .state("Karnataka")
                                                        .latitude(12.9716)
                                                        .longitude(77.5946)
                                                        .source(SourceType.CITIZEN)
                                                        .reportedAt(LocalDateTime.now().minusHours(3))
                                                        .build(),
                                        WeatherReport.builder()
                                                        .title("Urban Thunderstorm & Lightning Surge")
                                                        .description("Sudden convective storm brings heavy downpour and lightning across HITEC city sector.")
                                                        .eventType(EventType.THUNDERSTORM)
                                                        .severity(Severity.HIGH)
                                                        .city("Hyderabad")
                                                        .state("Telangana")
                                                        .latitude(17.3850)
                                                        .longitude(78.4867)
                                                        .source(SourceType.WEATHER_API)
                                                        .reportedAt(LocalDateTime.now().minusHours(2))
                                                        .build());

                        repository.saveAll(seedReports);
                }
        }
}
