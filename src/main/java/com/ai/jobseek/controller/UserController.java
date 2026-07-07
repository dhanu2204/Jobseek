package com.ai.jobseek.controller;

import com.ai.jobseek.model.Users;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ai.jobseek.service.UserService;


@RestController
@CrossOrigin("*")
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userservice;

    
    @PostMapping("register")
    public Users register(@RequestBody Users u){
        return userservice.registerUser(u);
    }

    @PostMapping("login")
    public Users login(@RequestBody Users u) {
        return userservice.validateUser(u.getEmail(), u.getPassword());
    }

    @GetMapping("get/{id}")
    public Users getUser(@PathVariable Integer id) {
        return userservice.getUserById(id);
    }

    @PostMapping("update")
    public Users updateProfile(@RequestBody Users u) {
        return userservice.updateUserProfile(u);
    }

    @PostMapping("upgrade/{id}")
    public Users upgradeToPremium(@PathVariable Integer id) {
        return userservice.upgradeToPremium(id);
    }
    
}
