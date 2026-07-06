package com.ai.jobseek.repositories;

import com.ai.jobseek.model.MockInterviewReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MockInterviewReportRepo extends JpaRepository<MockInterviewReport, Integer> {
    List<MockInterviewReport> findByUserIdId(Integer userId);
}
