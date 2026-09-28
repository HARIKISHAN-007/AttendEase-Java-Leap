INSERT INTO student(name,register_number)
SELECT 'Demo Student','STU001'
WHERE NOT EXISTS(
    SELECT 1 FROM student WHERE register_number='STU001'
);

INSERT INTO users(username,password,role,student_id)
SELECT 'teacher','teacher123','TEACHER',NULL
WHERE NOT EXISTS(
    SELECT 1 FROM users WHERE username='teacher'
);

INSERT INTO users(username,password,role,student_id)
SELECT 'student','student123','STUDENT',
(SELECT id FROM student WHERE register_number='STU001')
WHERE NOT EXISTS(
    SELECT 1 FROM users WHERE username='student'
);