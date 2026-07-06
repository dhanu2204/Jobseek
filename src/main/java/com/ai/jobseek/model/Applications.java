package com.ai.jobseek.model;

import java.time.LocalDateTime;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.PrePersist;


@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
public class Applications {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer externalJobId;
    private String jobTitle;
    private String companyName;
    private String jobUrl;
    private String status;
    private LocalDateTime appliedDate;

    @PrePersist
    protected void onCreate() {
        this.appliedDate = LocalDateTime.now();
    }


    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users userId;
}
