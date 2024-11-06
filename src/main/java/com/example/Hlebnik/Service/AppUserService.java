package com.example.Hlebnik.Service;

import com.example.Hlebnik.Entity.AppUser;
import com.example.Hlebnik.Repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AppUserService {

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public void registerNewUser(String login, String password) {
        AppUser newUser = new AppUser();
        newUser.setLogin(login);
        newUser.setPassword(passwordEncoder.encode(password));  
        newUser.setEnabled(true);  

        appUserRepository.save(newUser);      }

    public boolean isLoginTaken(String login) {
        return appUserRepository.findByLogin(login) != null; 
    }
}