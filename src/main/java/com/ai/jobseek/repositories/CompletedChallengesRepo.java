package com.ai.jobseek.repositories;

import com.ai.jobseek.model.CompletedChallenges;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CompletedChallengesRepo extends JpaRepository<CompletedChallenges, Integer> {
    
    // Finds all challenges solved by a specific candidate
    List<CompletedChallenges> findByUserIdId(Integer userId);
    
    // Checks if the user has already registered a solved result for this problem
    boolean existsByUserIdIdAndProblemTitle(Integer userId, String problemTitle);
}
