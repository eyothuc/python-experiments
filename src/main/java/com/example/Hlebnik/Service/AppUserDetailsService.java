package com.example.Hlebnik.Service;

import com.example.Hlebnik.Entity.AppUser;
import com.example.Hlebnik.Repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AppUserDetailsService implements UserDetailsService {

    @Autowired
    private AppUserRepository appUserRepository;  // Репозиторий для доступа к базе данных

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser appUser = appUserRepository.findByLogin(username);
        if (appUser == null) {
            throw new UsernameNotFoundException("User not found with login: " + username);
        }
        return appUser;
    }
}
