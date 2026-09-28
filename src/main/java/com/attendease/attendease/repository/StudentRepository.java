package com.attendease.attendease.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.attendease.attendease.model.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByRegisterNumber(String registerNumber);
    boolean existsByRegisterNumber(String registerNumber);
}