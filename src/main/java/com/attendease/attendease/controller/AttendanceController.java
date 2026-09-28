package com.attendease.attendease.controller;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.attendease.attendease.model.AttendanceRecord;
import com.attendease.attendease.model.Session;
import com.attendease.attendease.model.Student;
import com.attendease.attendease.model.Subject;
import com.attendease.attendease.service.AttendanceService;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
@RestController
@RequestMapping("/api")
@Validated
public class AttendanceController {
    private final AttendanceService attendanceService;
    public AttendanceController(AttendanceService attendanceService){
        this.attendanceService=attendanceService;
    }
    @GetMapping("/students")
    public ResponseEntity<List<Student>> getStudents(HttpSession session){
        requireTeacher(session);
        return ResponseEntity.ok(attendanceService.getAllStudents());
    }
    @GetMapping("/students/{id}")
    public ResponseEntity<Student> getStudent(@PathVariable @Positive Long id,HttpSession session){
        requireTeacher(session);
        return ResponseEntity.ok(attendanceService.getStudent(id));
    }
    @PostMapping("/students")
    public ResponseEntity<Student> createStudent(@Valid @RequestBody Student student,HttpSession session){
        requireTeacher(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.createStudent(student));
    }
    @PutMapping("/students/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable @Positive Long id,@Valid @RequestBody Student student,HttpSession session){
        requireTeacher(session);
        return ResponseEntity.ok(attendanceService.updateStudent(id,student));
    }
    @DeleteMapping("/students/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable @Positive Long id,HttpSession session){
        requireTeacher(session);
        attendanceService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/subjects")
    public ResponseEntity<List<Subject>> getSubjects(HttpSession session){
        requireTeacher(session);
        return ResponseEntity.ok(attendanceService.getAllSubjects());
    }
    @GetMapping("/subjects/{id}")
    public ResponseEntity<Subject> getSubject(@PathVariable @Positive Long id,HttpSession session){
        requireTeacher(session);
        return ResponseEntity.ok(attendanceService.getSubject(id));
    }
    @PostMapping("/subjects")
    public ResponseEntity<Subject> createSubject(@Valid @RequestBody Subject subject,HttpSession session){
        requireTeacher(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.createSubject(subject));
    }
    @PutMapping("/subjects/{id}")
    public ResponseEntity<Subject> updateSubject(@PathVariable @Positive Long id,@Valid @RequestBody Subject subject,HttpSession session){
        requireTeacher(session);
        return ResponseEntity.ok(attendanceService.updateSubject(id,subject));
    }
    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<Void> deleteSubject(@PathVariable @Positive Long id,HttpSession session){
        requireTeacher(session);
        attendanceService.deleteSubject(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/sessions")
    public ResponseEntity<List<Session>> getSessions(HttpSession session){
        requireTeacher(session);
        return ResponseEntity.ok(attendanceService.getAllSessions());
    }
    @GetMapping("/sessions/{id}")
    public ResponseEntity<Session> getSession(@PathVariable @Positive Long id,HttpSession session){
        requireTeacher(session);
        return ResponseEntity.ok(attendanceService.getSession(id));
    }
    @PostMapping("/sessions")
    public ResponseEntity<Session> createSession(@RequestParam @Positive Long subjectId,@Valid @RequestBody Session session,HttpSession httpSession){
        requireTeacher(httpSession);
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.createSession(subjectId,session));
    }
    @PutMapping("/sessions/{id}")
    public ResponseEntity<Session> updateSession(@PathVariable @Positive Long id,@RequestParam @Positive Long subjectId,@Valid @RequestBody Session session,HttpSession httpSession){
        requireTeacher(httpSession);
        return ResponseEntity.ok(attendanceService.updateSession(id,session,subjectId));
    }
    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable @Positive Long id,HttpSession session){
        requireTeacher(session);
        attendanceService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/attendance")
    public ResponseEntity<List<AttendanceRecord>> getAttendance(@RequestParam(required=false) LocalDate date,@RequestParam(required=false) String registerNumber,HttpSession session){
        requireTeacher(session);
        if(date!=null)return ResponseEntity.ok(attendanceService.getAttendanceByDate(date));
        if(registerNumber!=null&&!registerNumber.isBlank())return ResponseEntity.ok(attendanceService.getAttendanceByRegisterNumber(registerNumber));
        return ResponseEntity.ok(attendanceService.getAllAttendance());
    }
    @GetMapping("/attendance/{id}")
    public ResponseEntity<AttendanceRecord> getAttendance(@PathVariable @Positive Long id,HttpSession session){
        requireTeacher(session);
        return ResponseEntity.ok(attendanceService.getAttendance(id));
    }
    @PostMapping("/attendance")
    public ResponseEntity<AttendanceRecord> createAttendance(@RequestParam @Positive Long studentId,@RequestParam @Positive Long sessionId,@RequestParam(required=false) Boolean present,HttpSession session){
        requireTeacher(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.createAttendance(studentId,sessionId,present));
    }
    @PutMapping("/attendance/{id}")
    public ResponseEntity<AttendanceRecord> updateAttendance(@PathVariable @Positive Long id,@RequestParam(required=false) Boolean present,HttpSession session){
        requireTeacher(session);
        return ResponseEntity.ok(attendanceService.updateAttendance(id,present));
    }
    @GetMapping("/students/{studentId}/attendance")
    public ResponseEntity<List<AttendanceRecord>> getStudentAttendance(@PathVariable @Positive Long studentId,HttpSession session){
        requireStudentOrTeacher(session,studentId);
        return ResponseEntity.ok(attendanceService.getStudentAttendance(studentId));
    }
    @GetMapping("/students/{studentId}/attendance/percentage")
    public ResponseEntity<Map<String,Object>> getStudentPercentage(@PathVariable @Positive Long studentId,HttpSession session){
        requireStudentOrTeacher(session,studentId);
        double percentage=attendanceService.calculatePercentage(studentId);
        return ResponseEntity.ok(Map.of("studentId",studentId,"percentage",percentage,"threshold",attendanceService.getThreshold(),"status",attendanceService.getAttendanceStatus(studentId)));
    }
    @GetMapping("/students/{studentId}/attendance/summary")
    public ResponseEntity<List<Map<String,Object>>> getStudentSummary(@PathVariable @Positive Long studentId,HttpSession session){
        requireStudentOrTeacher(session,studentId);
        return ResponseEntity.ok(attendanceService.getStudentSubjectSummary(studentId));
    }
    @GetMapping("/sessions/{sessionId}/attendance")
    public ResponseEntity<List<AttendanceRecord>> getSessionAttendance(@PathVariable @Positive Long sessionId,HttpSession session){
        requireTeacher(session);
        return ResponseEntity.ok(attendanceService.getSessionAttendance(sessionId));
    }
    @GetMapping("/config/threshold")
    public ResponseEntity<Map<String,Object>> getThreshold(HttpSession session){
        requireTeacher(session);
        return ResponseEntity.ok(Map.of("threshold",attendanceService.getThreshold()));
    }
    @PutMapping("/config/threshold")
    public ResponseEntity<Map<String,Object>> updateThreshold(@RequestParam @NotNull Double threshold,HttpSession session){
        requireTeacher(session);
        attendanceService.setThreshold(threshold);
        return ResponseEntity.ok(Map.of("threshold",attendanceService.getThreshold()));
    }
    private void requireTeacher(HttpSession session){
        Object role=session.getAttribute("role");
        if(!"TEACHER".equals(role))throw new RuntimeException("Teacher access required");
    }
    private void requireStudentOrTeacher(HttpSession session,Long studentId){
        Object role=session.getAttribute("role");
        if("TEACHER".equals(role))return;
        if("STUDENT".equals(role)){
            Object loggedInStudentId=session.getAttribute("studentId");
            if(loggedInStudentId!=null&&Long.valueOf(loggedInStudentId.toString()).equals(studentId))return;
        }
        throw new RuntimeException("You can only view your own attendance");
    }
}