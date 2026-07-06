package com.ai.jobseek.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ai.jobseek.model.Resume;
import com.ai.jobseek.model.Users;

@Repository
public interface ResumeRepo extends JpaRepository<Resume, Integer> {
    public List<Resume> findByUserId(Integer userId);
    public void deleteById(Integer id);
}
