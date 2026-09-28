package com.attendease.attendease.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Entity
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Student name is required")
    @Size(min = 2, max = 50, message = "Student name must be between 2 and 50 characters")
    @Pattern(
            regexp = "^[A-Za-z][A-Za-z .'-]*$",
            message = "Student name can contain only letters, spaces, dots, apostrophes and hyphens"
    )
    private String name;

    @NotBlank(message = "Register number is required")
    @Size(min = 3, max = 20, message = "Register number must be between 3 and 20 characters")
    @Pattern(
            regexp = "^[A-Za-z0-9-]+$",
            message = "Register number can contain only letters, numbers and hyphens"
    )
    private String registerNumber;

    public Student() {
    }

    public Student(String name, String registerNumber) {
        this.name = name;
        this.registerNumber = registerNumber;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getRegisterNumber() {
        return registerNumber;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setRegisterNumber(String registerNumber) {
        this.registerNumber = registerNumber;
    }
}