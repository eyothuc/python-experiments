package com.example.Hlebnik.Repository;

import com.example.Hlebnik.Entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Integer> {
    AppUser findByLogin(String login);
    
}
