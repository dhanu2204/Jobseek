package com.ai.jobseek.model;

import java.time.LocalDateTime;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompletedChallenges {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String problemTitle;
    private String language;
    private LocalDateTime solvedAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private Users userId;

    @PrePersist
    protected void onCreate() {
        this.solvedAt = LocalDateTime.now();
    }
}
