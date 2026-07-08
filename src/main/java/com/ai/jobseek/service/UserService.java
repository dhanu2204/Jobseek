package com.ai.jobseek.service;

import com.ai.jobseek.model.Users;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ai.jobseek.repositories.UserRepo;

@Service
public class UserService {

    @Autowired
    private UserRepo userrepo;

    public Users registerUser(Users u) {
        if (userrepo.findByEmail(u.getEmail()) != null) {
            return null;
        }
        if (u.getPremium() == null) {
            u.setPremium(false);
        }
        if (u.getAtsScansCount() == null) {
            u.setAtsScansCount(0);
        }
        return userrepo.save(u);
    }

    public Users validateUser(String email, String password) {
        Users u = userrepo.findByEmail(email);
        if (u != null && u.getPassword().equals(password)) {
            return u;
        }
        return null;
    }

    public Users getUserById(Integer id) {
        return userrepo.findById(id).orElse(null);
    }

    public Users updateUserProfile(Users updated) {
        Users existing = userrepo.findById(updated.getId()).orElse(null);
        if (existing != null) {
            existing.setName(updated.getName());
            existing.setMobile(updated.getMobile());
            existing.setHeadline(updated.getHeadline());
            existing.setBio(updated.getBio());
            existing.setSkills(updated.getSkills());
            existing.setExperienceLevel(updated.getExperienceLevel());
            existing.setEducation(updated.getEducation());
            existing.setGithubUrl(updated.getGithubUrl());
            existing.setLinkedinUrl(updated.getLinkedinUrl());
            return userrepo.save(existing);
        }
        return null;
    }

    public Users upgradeToPremium(Integer id) {
        Users existing = userrepo.findById(id).orElse(null);
        if (existing != null) {
            existing.setPremium(true);
            return userrepo.save(existing);
        }
        return null;
    }

    public Users incrementAtsScanCount(Integer id) {
        Users existing = userrepo.findById(id).orElse(null);
        if (existing != null) {
            existing.setAtsScansCount(existing.getAtsScansCount() + 1);
            return userrepo.save(existing);
        }
        return null;
    }
}
