package com.ai.jobseek.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ai.jobseek.model.Users;

@Repository
public interface UserRepo extends JpaRepository<Users, Integer>{
    public Users findByEmail(String email);
    public Users save(Users u);
}
