package com.attendease.attendease.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotNull;

@Entity
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    @NotNull(message = "Student is required")
    private Student student;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    @NotNull(message = "Session is required")
    private Session session;

    @NotNull(message = "Attendance status is required")
    private Boolean present;

    public AttendanceRecord() {
    }

    public AttendanceRecord(Student student, Session session, Boolean present) {
        this.student = student;
        this.session = session;
        this.present = present;
    }

    public Long getId() {
        return id;
    }

    public Student getStudent() {
        return student;
    }

    public Session getSession() {
        return session;
    }

    public Boolean getPresent() {
        return present;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public void setSession(Session session) {
        this.session = session;
    }

    public void setPresent(Boolean present) {
        this.present = present;
    }
}