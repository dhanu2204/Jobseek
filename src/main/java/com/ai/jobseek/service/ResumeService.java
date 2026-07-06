package com.ai.jobseek.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ai.jobseek.model.Resume;
import com.ai.jobseek.repositories.ResumeRepo;

@Service
public class ResumeService {
    @Autowired
    private ResumeRepo resumeRepo;

    public Resume createResume(Resume resume) {
        return resumeRepo.save(resume);
    }

    public List<Resume> getResumeByUserId(Integer userId)
    {
        return resumeRepo.findByUserId(userId);
    }

    public void deleteResume(Integer id)
    {
        resumeRepo.deleteById(id);
    }

}
