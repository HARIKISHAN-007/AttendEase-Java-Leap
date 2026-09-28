CREATE DATABASE IF NOT EXISTS attendease;

USE attendease;

CREATE TABLE IF NOT EXISTS student (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    register_number VARCHAR(20) NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS subject (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS session (
    id BIGINT NOT NULL AUTO_INCREMENT,
    session_date DATE NOT NULL,
    subject_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (subject_id, session_date),
    FOREIGN KEY (subject_id) REFERENCES subject(id)
);

CREATE TABLE IF NOT EXISTS attendance_record (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    session_id BIGINT NOT NULL,
    present BOOLEAN NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (student_id, session_id),
    FOREIGN KEY (student_id) REFERENCES student(id),
    FOREIGN KEY (session_id) REFERENCES session(id)
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    student_id BIGINT,
    PRIMARY KEY (id),
    FOREIGN KEY (student_id) REFERENCES student(id)
);

INSERT INTO student (name, register_number)
SELECT 'Demo Student', 'STU001'
WHERE NOT EXISTS (
    SELECT 1 FROM student
    WHERE register_number = 'STU001'
);

INSERT INTO users (username, password, role, student_id)
SELECT 'teacher', 'teacher123', 'TEACHER', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM users
    WHERE username = 'teacher'
);

INSERT INTO users (username, password, role, student_id)
SELECT 'student',
       'student123',
       'STUDENT',
       (SELECT id FROM student WHERE register_number = 'STU001')
WHERE NOT EXISTS (
    SELECT 1 FROM users
    WHERE username = 'student'
);