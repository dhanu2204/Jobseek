package com.ai.jobseek.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.ai.jobseek.model.Resume;
import com.ai.jobseek.service.ResumeService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/resume")
public class ResumeController {

    @Autowired
    private ResumeService resumeservice;

    @PostMapping("/create")
    public Resume createResume(@RequestBody Resume resume) {
        return resumeservice.createResume(resume);
    }

    @GetMapping("/get/{userId}")
    public List<Resume> getResumeByUserId(@PathVariable Integer userId) {
        return resumeservice.getResumeByUserId(userId);
    }

    @DeleteMapping("/delete/{id}")
    public void deleteResume(@PathVariable Integer id) {
        resumeservice.deleteResume(id);
    }

}
