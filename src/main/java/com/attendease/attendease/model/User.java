package com.attendease.attendease.model;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
@Entity
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @NotBlank(message="Username is required")
    @Size(min=3,max=50,message="Username must be between 3 and 50 characters")
    private String username;
    @NotBlank(message="Password is required")
    @Size(min=4,max=100,message="Password must be between 4 and 100 characters")
    private String password;
    @NotBlank(message="Role is required")
    @Pattern(regexp="^(TEACHER|STUDENT)$",message="Role must be TEACHER or STUDENT")
    private String role;
    @OneToOne
    @JoinColumn(name="student_id")
    private Student student;
    public User(){}
    public User(String username,String password,String role,Student student){
        this.username=username;
        this.password=password;
        this.role=role;
        this.student=student;
    }
    public Long getId(){return id;}
    public String getUsername(){return username;}
    public String getPassword(){return password;}
    public String getRole(){return role;}
    public Student getStudent(){return student;}
    public void setId(Long id){this.id=id;}
    public void setUsername(String username){this.username=username;}
    public void setPassword(String password){this.password=password;}
    public void setRole(String role){this.role=role;}
    public void setStudent(Student student){this.student=student;}
}