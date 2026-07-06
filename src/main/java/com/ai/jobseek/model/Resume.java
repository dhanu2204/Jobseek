package com.ai.jobseek.model;

import jakarta.annotation.Generated;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Resume {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users user;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String website;
    @Column(columnDefinition = "TEXT")
    private String summary;
    @Column(columnDefinition = "TEXT")
    private String education;
    @Column(columnDefinition = "TEXT")
    private String experienceJson;
    @Column(columnDefinition = "TEXT")
    private String skillsJson;
    @Column(columnDefinition = "TEXT")
    private String projectsJson;
    @Column(columnDefinition = "TEXT")
    private String certificationsJson;

}
