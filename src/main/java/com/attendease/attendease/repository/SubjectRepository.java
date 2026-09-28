package com.attendease.attendease.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.attendease.attendease.model.Subject;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    Optional<Subject> findByName(String name);
    boolean existsByName(String name);
}