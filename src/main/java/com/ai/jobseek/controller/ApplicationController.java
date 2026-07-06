package com.ai.jobseek.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ai.jobseek.model.Applications;
import com.ai.jobseek.service.ApplicationService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/application")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationservice;

    @PostMapping("/")
    public String applyJob(@RequestBody Applications applications) {
        return applicationservice.applyJob(applications);
    }
    

}
