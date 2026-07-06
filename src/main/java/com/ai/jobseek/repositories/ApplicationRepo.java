package com.ai.jobseek.repositories;

import com.ai.jobseek.model.Applications;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApplicationRepo extends JpaRepository<Applications, Integer> {
    // Custom query to find all applications submitted by a specific user id
    public List<Applications> findByUserIdId(Integer userId);
    
    Applications save(Applications applications);
    public boolean existsByUserIdIdAndExternalJobId(Integer userId,Integer externalJobId);
}

