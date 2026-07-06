package com.ai.jobseek.service;

import com.ai.jobseek.model.MockInterviewReport;
import com.ai.jobseek.repositories.MockInterviewReportRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MockInterviewReportService {

    @Autowired
    private MockInterviewReportRepo repo;

    public MockInterviewReport saveReport(MockInterviewReport report) {
        return repo.save(report);
    }

    public List<MockInterviewReport> getReportsByUser(Integer userId) {
        return repo.findByUserIdId(userId);
    }
}
