package com.ai.jobseek.controller;

import com.ai.jobseek.model.CompletedChallenges;
import com.ai.jobseek.service.CompletedChallengesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@CrossOrigin("*")
@RequestMapping("/challenge")
public class CompletedChallengesController {

    @Autowired
    private CompletedChallengesService service;

    @PostMapping("/complete")
    public String completeChallenge(@RequestBody CompletedChallenges challenge) {
        return service.saveCompletedChallenge(challenge);
    }

    @GetMapping("/user/{userId}")
    public List<CompletedChallenges> getSolved(@PathVariable Integer userId) {
        return service.getChallengesByUser(userId);
    }
}
