package com.weatherintel.repository;

import com.weatherintel.entity.EventType;
import com.weatherintel.entity.Severity;
import com.weatherintel.entity.WeatherReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WeatherReportRepository extends JpaRepository<WeatherReport, UUID>, JpaSpecificationExecutor<WeatherReport> {

    List<WeatherReport> findByEventType(EventType eventType);

    List<WeatherReport> findByStateIgnoreCase(String state);

    List<WeatherReport> findByCityIgnoreCase(String city);

    List<WeatherReport> findBySeverity(Severity severity);
}
