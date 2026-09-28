package com.attendease.attendease.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.attendease.attendease.model.Session;

public interface SessionRepository extends JpaRepository<Session, Long> {

    List<Session> findBySubjectId(Long subjectId);

    List<Session> findBySessionDate(LocalDate sessionDate);

    boolean existsBySubjectIdAndSessionDate(Long subjectId, LocalDate sessionDate);
}