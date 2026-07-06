package com.ai.jobseek.service;

import com.ai.jobseek.model.CompletedChallenges;
import com.ai.jobseek.repositories.CompletedChallengesRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CompletedChallengesService {

    @Autowired
    private CompletedChallengesRepo repo;

    public String saveCompletedChallenge(CompletedChallenges challenge) {
        if (challenge.getUserId() == null || challenge.getUserId().getId() == null) {
            return "Invalid user details";
        }

        // Prevent duplicate logs for the same question
        boolean alreadySolved = repo.existsByUserIdIdAndProblemTitle(
            challenge.getUserId().getId(), 
            challenge.getProblemTitle()
        );

        if (!alreadySolved) {
            repo.save(challenge);
            return "Challenge saved successfully";
        }
        return "Challenge already solved previously";
    }

    public List<CompletedChallenges> getChallengesByUser(Integer userId) {
        return repo.findByUserIdId(userId);
    }
}
