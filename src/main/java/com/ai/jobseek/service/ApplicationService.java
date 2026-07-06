package com.ai.jobseek.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ai.jobseek.model.Applications;
import com.ai.jobseek.repositories.ApplicationRepo; // Added missing import

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepo applicationrepo;

    public String applyJob(Applications applications) {
        if (applications.getUserId() == null || applications.getUserId().getId() == 0) {
            return "Invalid user details";
        }

        boolean alreadyApplied = applicationrepo.existsByUserIdIdAndExternalJobId(
            applications.getUserId().getId(),
            applications.getExternalJobId()
        );

        if (!alreadyApplied) {
            applicationrepo.save(applications);
            return "Job applied successfully";
        }
        return "Job already applied";
    }
}
