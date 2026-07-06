package com.ai.jobseek.controller;

import com.ai.jobseek.model.MockInterviewReport;
import com.ai.jobseek.service.MockInterviewReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@CrossOrigin("*")
@RequestMapping("/interview-report")
public class MockInterviewReportController {

    @Autowired
    private MockInterviewReportService service;

    @PostMapping("/save")
    public MockInterviewReport saveReport(@RequestBody MockInterviewReport report) {
        return service.saveReport(report);
    }

    @GetMapping("/user/{userId}")
    public List<MockInterviewReport> getReports(@PathVariable Integer userId) {
        return service.getReportsByUser(userId);
    }
}
