package com.example.Hlebnik.Service;

import com.example.Hlebnik.Entity.AppUser;
import com.example.Hlebnik.Repository.UserRepo;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepo userRepository;
    public AppUser findByLogin(String login) {
        return userRepository.findByLogin(login);
    }


    public UserService(UserRepo userRepository) {
        this.userRepository = userRepository;
    }

    public List<AppUser> getAllUsers() {
        return userRepository.findAll();
    }

    public AppUser getUserById(int id) {
        return userRepository.findById(id).orElse(null);
    }

    public AppUser saveUser(AppUser user) {
        return userRepository.save(user);
    }

    public void deleteUser(int id) {
        userRepository.deleteById(id);
    }

    public Optional<AppUser> findById(Integer id) {
        return userRepository.findById(id);
    }

    public void deleteById(Integer id) {
        userRepository.deleteById(id);
    }

    public List<AppUser> findAll() {
        return userRepository.findAll();
    }
}
