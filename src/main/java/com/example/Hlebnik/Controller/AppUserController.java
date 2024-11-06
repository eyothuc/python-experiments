package com.example.Hlebnik.Controller;

import com.example.Hlebnik.Service.AppUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
public class AppUserController {
    private static final Logger logger = LoggerFactory.getLogger(AppUserController.class);

    @Autowired
    private AppUserService userService;

    @GetMapping("/login")
    public String login() {
        logger.info("Accessing login page");
        return "login";  // Возвращает имя шаблона для страницы логина
    }

    @GetMapping("/register")
    public String register() {
        logger.info("Accessing register page");
        return "register";  // Возвращает имя шаблона для страницы регистрации
    }

    @PostMapping("/register")
    public String registerUser(@RequestParam("login") String login,
                               @RequestParam("password") String password,
                               Model model) {
        logger.info("Attempting to register user: {}", login);

        if (userService.isLoginTaken(login)) {
            logger.warn("Login taken: {}", login);
            model.addAttribute("error", "This login is already taken.");
            return "register";  
        }

        userService.registerNewUser(login, password);
        logger.info("User registered successfully: {}", login);

        return "register";  
    }
}
