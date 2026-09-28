package com.attendease.attendease.model;
import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotNull;
@Entity
public class Session {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @NotNull(message="Session date is required")
    private LocalDate sessionDate;
    @ManyToOne
    @JoinColumn(name="subject_id",nullable=false)
    private Subject subject;
    public Session(){}
    public Session(LocalDate sessionDate,Subject subject){
        this.sessionDate=sessionDate;
        this.subject=subject;
    }
    public Long getId(){return id;}
    public LocalDate getSessionDate(){return sessionDate;}
    public Subject getSubject(){return subject;}
    public void setId(Long id){this.id=id;}
    public void setSessionDate(LocalDate sessionDate){this.sessionDate=sessionDate;}
    public void setSubject(Subject subject){this.subject=subject;}
}