package com.attendease.attendease.service;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.attendease.attendease.model.AttendanceRecord;
import com.attendease.attendease.model.Session;
import com.attendease.attendease.model.Student;
import com.attendease.attendease.model.Subject;
import com.attendease.attendease.repository.AttendanceRecordRepository;
import com.attendease.attendease.repository.SessionRepository;
import com.attendease.attendease.repository.StudentRepository;
import com.attendease.attendease.repository.SubjectRepository;
@Service
public class AttendanceService {
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final SessionRepository sessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private double threshold=75.0;
    public AttendanceService(StudentRepository studentRepository,SubjectRepository subjectRepository,SessionRepository sessionRepository,AttendanceRecordRepository attendanceRecordRepository){
        this.studentRepository=studentRepository;
        this.subjectRepository=subjectRepository;
        this.sessionRepository=sessionRepository;
        this.attendanceRecordRepository=attendanceRecordRepository;
    }
    public List<Student> getAllStudents(){
        return studentRepository.findAll();
    }
    public Student getStudent(Long id){
        return studentRepository.findById(id).orElseThrow(()->new RuntimeException("Student not found"));
    }
    public Student createStudent(Student student){
        if(studentRepository.existsByRegisterNumber(student.getRegisterNumber()))throw new RuntimeException("Register number already exists");
        return studentRepository.save(student);
    }
    public Student updateStudent(Long id,Student student){
        Student existing=getStudent(id);
        if(!existing.getRegisterNumber().equals(student.getRegisterNumber())&&studentRepository.existsByRegisterNumber(student.getRegisterNumber()))throw new RuntimeException("Register number already exists");
        existing.setName(student.getName());
        existing.setRegisterNumber(student.getRegisterNumber());
        return studentRepository.save(existing);
    }
    public void deleteStudent(Long id){
        Student student=getStudent(id);
        if(!attendanceRecordRepository.findByStudentId(id).isEmpty())throw new RuntimeException("Cannot delete student with attendance records");
        studentRepository.delete(student);
    }
    public List<Subject> getAllSubjects(){
        return subjectRepository.findAll();
    }
    public Subject getSubject(Long id){
        return subjectRepository.findById(id).orElseThrow(()->new RuntimeException("Subject not found"));
    }
    public Subject createSubject(Subject subject){
        if(subjectRepository.existsByName(subject.getName()))throw new RuntimeException("Subject already exists");
        return subjectRepository.save(subject);
    }
    public Subject updateSubject(Long id,Subject subject){
        Subject existing=getSubject(id);
        if(!existing.getName().equals(subject.getName())&&subjectRepository.existsByName(subject.getName()))throw new RuntimeException("Subject already exists");
        existing.setName(subject.getName());
        return subjectRepository.save(existing);
    }
    public void deleteSubject(Long id){
        Subject subject=getSubject(id);
        if(!sessionRepository.findBySubjectId(id).isEmpty())throw new RuntimeException("Cannot delete subject with sessions");
        subjectRepository.delete(subject);
    }
    public List<Session> getAllSessions(){
        return sessionRepository.findAll();
    }
    public Session getSession(Long id){
        return sessionRepository.findById(id).orElseThrow(()->new RuntimeException("Session not found"));
    }
    public Session createSession(Long subjectId,Session session){
        Subject subject=getSubject(subjectId);
        if(sessionRepository.existsBySubjectIdAndSessionDate(subjectId,session.getSessionDate()))throw new RuntimeException("Session already exists for this subject and date");
        session.setSubject(subject);
        Session saved=sessionRepository.save(session);
        createMissingAttendanceRecords(saved);
        return saved;
    }
    public Session updateSession(Long id,Session session,Long subjectId){
        Session existing=getSession(id);
        Subject subject=getSubject(subjectId);
        if((!existing.getSubject().getId().equals(subjectId)||!existing.getSessionDate().equals(session.getSessionDate()))&&sessionRepository.existsBySubjectIdAndSessionDate(subjectId,session.getSessionDate()))throw new RuntimeException("Session already exists for this subject and date");
        existing.setSessionDate(session.getSessionDate());
        existing.setSubject(subject);
        return sessionRepository.save(existing);
    }
    public void deleteSession(Long id){
        Session session=getSession(id);
        if(!attendanceRecordRepository.findBySessionId(id).isEmpty())throw new RuntimeException("Cannot delete session with attendance records");
        sessionRepository.delete(session);
    }
    public AttendanceRecord createAttendance(Long studentId,Long sessionId,Boolean present){
        Student student=getStudent(studentId);
        Session session=getSession(sessionId);
        if(attendanceRecordRepository.existsByStudentIdAndSessionId(studentId,sessionId))throw new RuntimeException("Attendance already exists for this student and session");
        return attendanceRecordRepository.save(new AttendanceRecord(student,session,present));
    }
    public AttendanceRecord updateAttendance(Long id,Boolean present){
        AttendanceRecord record=attendanceRecordRepository.findById(id).orElseThrow(()->new RuntimeException("Attendance record not found"));
        record.setPresent(present);
        return attendanceRecordRepository.save(record);
    }
    public List<AttendanceRecord> getAllAttendance(){
        return attendanceRecordRepository.findAll();
    }
    public AttendanceRecord getAttendance(Long id){
        return attendanceRecordRepository.findById(id).orElseThrow(()->new RuntimeException("Attendance record not found"));
    }
    public List<AttendanceRecord> getStudentAttendance(Long studentId){
        getStudent(studentId);
        return attendanceRecordRepository.findByStudentId(studentId);
    }
    public List<AttendanceRecord> getSessionAttendance(Long sessionId){
        getSession(sessionId);
        return attendanceRecordRepository.findBySessionId(sessionId);
    }
    public List<AttendanceRecord> getAttendanceByDate(LocalDate date){
        return attendanceRecordRepository.findBySessionSessionDate(date);
    }
    public List<AttendanceRecord> getAttendanceByRegisterNumber(String registerNumber){
        Student student=studentRepository.findByRegisterNumber(registerNumber).orElseThrow(()->new RuntimeException("Student not found"));
        return attendanceRecordRepository.findByStudentId(student.getId());
    }
    public double calculatePercentage(Long studentId){
        getStudent(studentId);
        long marked=attendanceRecordRepository.countByStudentIdAndPresentIsNotNull(studentId);
        if(marked==0)return 0.0;
        long present=attendanceRecordRepository.countByStudentIdAndPresentTrue(studentId);
        return Math.round((present*10000.0)/marked)/100.0;
    }
    public double calculatePercentage(Long studentId,Long subjectId){
        getStudent(studentId);
        getSubject(subjectId);
        long marked=attendanceRecordRepository.countByStudentIdAndSessionSubjectIdAndPresentIsNotNull(studentId,subjectId);
        if(marked==0)return 0.0;
        long present=attendanceRecordRepository.countByStudentIdAndSessionSubjectIdAndPresentTrue(studentId,subjectId);
        return Math.round((present*10000.0)/marked)/100.0;
    }
    public String getAttendanceStatus(Long studentId){
        return calculatePercentage(studentId)<threshold?"SHORTAGE":"NORMAL";
    }
    public String getAttendanceStatus(Long studentId,Long subjectId){
        return calculatePercentage(studentId,subjectId)<threshold?"SHORTAGE":"NORMAL";
    }
    public List<Map<String,Object>> getStudentSubjectSummary(Long studentId){
        getStudent(studentId);
        List<Map<String,Object>> summary=new ArrayList<>();
        for(Subject subject:subjectRepository.findAll()){
            long total=attendanceRecordRepository.countByStudentIdAndSessionSubjectIdAndPresentIsNotNull(studentId,subject.getId());
            if(total==0)continue;
            long present=attendanceRecordRepository.countByStudentIdAndSessionSubjectIdAndPresentTrue(studentId,subject.getId());
            double percentage=Math.round((present*10000.0)/total)/100.0;
            Map<String,Object> item=new HashMap<>();
            item.put("subjectId",subject.getId());
            item.put("subjectName",subject.getName());
            item.put("present",present);
            item.put("total",total);
            item.put("percentage",percentage);
            item.put("status",percentage<threshold?"SHORTAGE":"NORMAL");
            summary.add(item);
        }
        return summary;
    }
    private void createMissingAttendanceRecords(Session session){
        for(Student student:studentRepository.findAll()){
            if(!attendanceRecordRepository.existsByStudentIdAndSessionId(student.getId(),session.getId())){
                attendanceRecordRepository.save(new AttendanceRecord(student,session,null));
            }
        }
    }
    public double getThreshold(){
        return threshold;
    }
    public void setThreshold(double threshold){
        if(threshold<0||threshold>100)throw new RuntimeException("Threshold must be between 0 and 100");
        this.threshold=threshold;
    }
}