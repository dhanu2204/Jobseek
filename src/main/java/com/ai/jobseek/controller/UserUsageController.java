package com.ai.jobseek.controller;

import com.ai.jobseek.repositories.ResumeRepo;
import com.ai.jobseek.repositories.MockInterviewReportRepo;
import com.ai.jobseek.repositories.UserRepo;
import com.ai.jobseek.service.UserService;
import com.ai.jobseek.model.Users;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/user")
@CrossOrigin("*")
public class UserUsageController {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ResumeRepo resumeRepo;

    @Autowired
    private MockInterviewReportRepo mockInterviewReportRepo;

    @Autowired
    private UserService userservice;

    @GetMapping("usage/{userId}")
    public ResponseEntity<?> getUserUsage(@PathVariable Integer userId) {
        Users user = userRepo.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        long resumesCount = resumeRepo.countByUserId(userId);
        long interviewsCount = mockInterviewReportRepo.countByUserIdId(userId);
        long atsScansCount = user.getAtsScansCount(); 

        Map<String, Object> stats = new HashMap<>();
        stats.put("resumesCount", resumesCount);
        stats.put("interviewsCount", interviewsCount);
        stats.put("atsScansCount", atsScansCount);

        return ResponseEntity.ok(stats);
    }
    @PostMapping("increment-ats/{userId}")
    public ResponseEntity<?> incrementAtsScans(@PathVariable Integer userId) {
        Users updated = userservice.incrementAtsScanCount(userId);
        if(updated == null)
        {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }
    
}
