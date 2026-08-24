package com.weatherintel.repository;

import com.weatherintel.entity.CitizenReport;
import com.weatherintel.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CitizenReportRepository extends JpaRepository<CitizenReport, UUID> {

    List<CitizenReport> findByVerificationStatus(VerificationStatus verificationStatus);
}
