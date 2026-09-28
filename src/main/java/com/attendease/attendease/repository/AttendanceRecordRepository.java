package com.attendease.attendease.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.attendease.attendease.model.AttendanceRecord;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    Optional<AttendanceRecord> findByStudentIdAndSessionId(Long studentId, Long sessionId);

    boolean existsByStudentIdAndSessionId(Long studentId, Long sessionId);

    List<AttendanceRecord> findByStudentId(Long studentId);

    List<AttendanceRecord> findBySessionId(Long sessionId);

    List<AttendanceRecord> findBySessionSessionDate(LocalDate sessionDate);

    long countByStudentId(Long studentId);

    long countByStudentIdAndPresentTrue(Long studentId);

    long countByStudentIdAndSessionSubjectId(Long studentId, Long subjectId);

    long countByStudentIdAndSessionSubjectIdAndPresentTrue(
            Long studentId,
            Long subjectId
    );
}