package com.ai.jobseek.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    private String email;
    private String password;
    private String mobile;
    
    // New Professional Profile Columns
    private String headline;
    private String bio;
    private String skills;
    private String experienceLevel;
    private String education;
    private String githubUrl;
    private String linkedinUrl;
}
