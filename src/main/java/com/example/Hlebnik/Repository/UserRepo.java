package com.example.Hlebnik.Repository;

import com.example.Hlebnik.Entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepo extends JpaRepository<AppUser, Integer> {
    AppUser findByLogin(String login);
}
