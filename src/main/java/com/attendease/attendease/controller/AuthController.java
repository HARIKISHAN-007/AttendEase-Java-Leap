package com.attendease.attendease.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.attendease.attendease.model.User;
import com.attendease.attendease.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> loginData,
            HttpSession session
    ) {
        String username = loginData.get("username");
        String password = loginData.get("password");

        if (username == null || username.isBlank()) {
            throw new RuntimeException("Username is required");
        }

        if (password == null || password.isBlank()) {
            throw new RuntimeException("Password is required");
        }

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("Invalid username or password"));

        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Invalid username or password");
        }

        session.setAttribute("userId", user.getId());
        session.setAttribute("role", user.getRole());

        if (user.getStudent() != null) {
            session.setAttribute("studentId", user.getStudent().getId());
        } else {
            session.removeAttribute("studentId");
        }

        Map<String, Object> response = new HashMap<>();

        response.put("message", "Login successful");
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());

        if (user.getStudent() != null) {
            response.put("studentId", user.getStudent().getId());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> currentUser(
            HttpSession session
    ) {
        Object userId = session.getAttribute("userId");
        Object role = session.getAttribute("role");

        if (userId == null || role == null) {
            throw new RuntimeException("User is not logged in");
        }

        Map<String, Object> response = new HashMap<>();

        response.put("userId", userId);
        response.put("role", role);

        Object studentId = session.getAttribute("studentId");

        if (studentId != null) {
            response.put("studentId", studentId);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            HttpSession session
    ) {
        session.invalidate();

        return ResponseEntity.ok(
                Map.of("message", "Logout successful")
        );
    }
}