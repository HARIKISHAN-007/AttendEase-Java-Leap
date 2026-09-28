let currentUser = null;

const API_BASE = "/api";

async function api(url, options = {}) {
    const config = {
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    };

    const response = await fetch(API_BASE + url, config);

    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        throw new Error(data?.message || "Something went wrong");
    }

    return data;
}

function showMessage(
    message,
    type = "success",
    target = "globalMessage"
) {
    const element = document.getElementById(target);

    if (!element) {
        return;
    }

    element.textContent = message;
    element.className = `message ${type}`;

    if (target === "globalMessage") {
        element.classList.add("global-message-visible");
    }

    setTimeout(() => {
        element.textContent = "";

        if (target === "globalMessage") {
            element.classList.remove("global-message-visible");
        }
    }, 3500);
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================
   LOGIN
========================= */

document.getElementById("loginForm").addEventListener(
    "submit",
    async function(event) {
        event.preventDefault();

        const username = document
            .getElementById("loginUsername")
            .value
            .trim();

        const password = document
            .getElementById("loginPassword")
            .value;

        try {
            const user = await api("/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            currentUser = user;
            showApplication();

        } catch (error) {
            showMessage(
                error.message,
                "error",
                "loginMessage"
            );
        }
    }
);

async function checkCurrentUser() {
    try {
        const user = await api("/auth/current");

        currentUser = user;
        showApplication();

    } catch (error) {
        showLogin();
    }
}

function showLogin() {
    document
        .getElementById("loginPage")
        .classList.remove("hidden");

    document
        .getElementById("appPage")
        .classList.add("hidden");
}

function showApplication() {
    document
        .getElementById("loginPage")
        .classList.add("hidden");

    document
        .getElementById("appPage")
        .classList.remove("hidden");

    const role = currentUser.role;

    document.getElementById("loggedUsername").textContent =
        currentUser.username || "User";

    document.getElementById("loggedRole").textContent = role;

    document.getElementById("userAvatar").textContent =
        (currentUser.username || "U")
            .charAt(0)
            .toUpperCase();

    if (role === "TEACHER") {
        document
            .getElementById("teacherNavigation")
            .classList.remove("hidden");

        document
            .getElementById("studentNavigation")
            .classList.add("hidden");

        showSection("dashboardSection");
        loadDashboard();

    } else {
        document
            .getElementById("teacherNavigation")
            .classList.add("hidden");

        document
            .getElementById("studentNavigation")
            .classList.remove("hidden");

        showSection("studentDashboardSection");
        loadStudentDashboard();
    }
}


/* =========================
   LOGOUT
========================= */

document.getElementById("logoutButton").addEventListener(
    "click",
    async function() {
        try {
            await api("/auth/logout", {
                method: "POST"
            });
        } catch (error) {
            console.error(error);
        }

        currentUser = null;
        showLogin();

        document
            .getElementById("loginForm")
            .reset();
    }
);


/* =========================
   NAVIGATION
========================= */

document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener("click", function() {
            showSection(button.dataset.section);
        });

    });

function showSection(sectionId) {

    document
        .querySelectorAll(".content-section")
        .forEach(section => {
            section.classList.add("hidden");
        });

    const section = document.getElementById(sectionId);

    if (!section) {
        return;
    }

    section.classList.remove("hidden");

    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.classList.remove("active");

            if (button.dataset.section === sectionId) {
                button.classList.add("active");
            }

        });

    const titles = {

        dashboardSection: [
            "Dashboard",
            "Manage classroom attendance easily."
        ],

        studentsSection: [
            "Students",
            "Manage student records."
        ],

        subjectsSection: [
            "Subjects",
            "Manage class subjects."
        ],

        sessionsSection: [
            "Sessions",
            "Manage class sessions."
        ],

        attendanceSection: [
            "Attendance",
            "Mark and correct attendance."
        ],

        studentDashboardSection: [
            "My Attendance",
            "View your attendance summary."
        ]
    };

    if (titles[sectionId]) {
        document.getElementById("pageTitle").textContent =
            titles[sectionId][0];

        document.getElementById("pageSubtitle").textContent =
            titles[sectionId][1];
    }

    if (sectionId === "studentsSection") {
        loadStudents();
    }

    if (sectionId === "subjectsSection") {
        loadSubjects();
    }

    if (sectionId === "sessionsSection") {
        loadSessionSubjects();
        loadSessions();
    }

    if (sectionId === "attendanceSection") {
        loadAttendanceFormData();
        loadAttendance();
    }
}


/* =========================
   DASHBOARD
========================= */

async function loadDashboard() {
    try {

        const [
            students,
            subjects,
            sessions,
            attendance,
            threshold
        ] = await Promise.all([
            api("/students"),
            api("/subjects"),
            api("/sessions"),
            api("/attendance"),
            api("/config/threshold")
        ]);

        document.getElementById("studentCount").textContent =
            students.length;

        document.getElementById("subjectCount").textContent =
            subjects.length;

        document.getElementById("sessionCount").textContent =
            sessions.length;

        document.getElementById("attendanceCount").textContent =
            attendance.length;

        document.getElementById("thresholdInput").value =
            threshold.threshold;

    } catch (error) {
        showMessage(error.message, "error");
    }
}


/* =========================
   THRESHOLD
========================= */

document
    .getElementById("updateThresholdButton")
    .addEventListener("click", async function() {

        const value = document
            .getElementById("thresholdInput")
            .value;

        if (value === "") {
            return;
        }

        try {

            const result = await api(
                `/config/threshold?threshold=${value}`,
                {
                    method: "PUT"
                }
            );

            showMessage(
                `Threshold updated to ${result.threshold}%`,
                "success",
                "thresholdMessage"
            );

        } catch (error) {

            showMessage(
                error.message,
                "error",
                "thresholdMessage"
            );
        }
    });


/* =========================
   STUDENTS
========================= */

async function loadStudents() {

    try {

        const students = await api("/students");

        const tbody =
            document.getElementById("studentsTableBody");

        tbody.innerHTML = "";

        students.forEach(student => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${student.id}</td>

                <td>
                    ${escapeHtml(student.name)}
                </td>

                <td>
                    ${escapeHtml(student.registerNumber)}
                </td>

                <td>
                    <button
                        class="btn btn-small btn-primary"
                        onclick="editStudent(${student.id})"
                    >
                        Edit
                    </button>

                    <button
                        class="btn btn-small btn-danger"
                        onclick="deleteStudent(${student.id})"
                    >
                        Delete
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

    } catch (error) {
        showMessage(error.message, "error");
    }
}

function showStudentForm() {

    document
        .getElementById("studentFormCard")
        .classList.remove("hidden");

    document
        .getElementById("studentFormTitle")
        .textContent = "Add Student";
}

function resetStudentForm() {

    document
        .getElementById("studentForm")
        .reset();

    document.getElementById("studentId").value = "";

    document
        .getElementById("studentFormCard")
        .classList.add("hidden");

    document
        .getElementById("studentFormTitle")
        .textContent = "Add Student";
}

document
    .getElementById("studentForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const id =
            document.getElementById("studentId").value;

        const data = {
            name: document
                .getElementById("studentName")
                .value
                .trim(),

            registerNumber: document
                .getElementById("studentRegisterNumber")
                .value
                .trim()
        };

        try {

            if (id) {

                await api(`/students/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(data)
                });

                showMessage(
                    "Student updated successfully",
                    "success"
                );

            } else {

                await api("/students", {
                    method: "POST",
                    body: JSON.stringify(data)
                });

                showMessage(
                    "Student added successfully",
                    "success"
                );
            }

            resetStudentForm();
            await loadStudents();
            await loadDashboard();

        } catch (error) {
            showMessage(error.message, "error");
        }
    });

async function editStudent(id) {

    try {

        const student = await api(`/students/${id}`);

        document
            .getElementById("studentFormCard")
            .classList.remove("hidden");

        document.getElementById("studentFormTitle").textContent =
            "Edit Student";

        document.getElementById("studentId").value =
            student.id;

        document.getElementById("studentName").value =
            student.name;

        document.getElementById("studentRegisterNumber").value =
            student.registerNumber;

    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function deleteStudent(id) {

    if (!confirm("Delete this student?")) {
        return;
    }

    try {

        await api(`/students/${id}`, {
            method: "DELETE"
        });

        showMessage(
            "Student deleted successfully",
            "success"
        );

        await loadStudents();
        await loadDashboard();

    } catch (error) {
        showMessage(error.message, "error");
    }
}


/* =========================
   SUBJECTS
========================= */

async function loadSubjects() {

    try {

        const subjects = await api("/subjects");

        const tbody =
            document.getElementById("subjectsTableBody");

        tbody.innerHTML = "";

        subjects.forEach(subject => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${subject.id}</td>

                <td>
                    ${escapeHtml(subject.name)}
                </td>

                <td>
                    <button
                        class="btn btn-small btn-primary"
                        onclick="editSubject(${subject.id})"
                    >
                        Edit
                    </button>

                    <button
                        class="btn btn-small btn-danger"
                        onclick="deleteSubject(${subject.id})"
                    >
                        Delete
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

    } catch (error) {
        showMessage(error.message, "error");
    }
}

function showSubjectForm() {

    document
        .getElementById("subjectFormCard")
        .classList.remove("hidden");

    document
        .getElementById("subjectFormTitle")
        .textContent = "Add Subject";
}

function resetSubjectForm() {

    document
        .getElementById("subjectForm")
        .reset();

    document.getElementById("subjectId").value = "";

    document
        .getElementById("subjectFormCard")
        .classList.add("hidden");

    document
        .getElementById("subjectFormTitle")
        .textContent = "Add Subject";
}

document
    .getElementById("subjectForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const id =
            document.getElementById("subjectId").value;

        const data = {
            name: document
                .getElementById("subjectName")
                .value
                .trim()
        };

        try {

            if (id) {

                await api(`/subjects/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(data)
                });

                showMessage(
                    "Subject updated successfully",
                    "success"
                );

            } else {

                await api("/subjects", {
                    method: "POST",
                    body: JSON.stringify(data)
                });

                showMessage(
                    "Subject added successfully",
                    "success"
                );
            }

            resetSubjectForm();
            await loadSubjects();
            await loadSessionSubjects();
            await loadDashboard();

        } catch (error) {
            showMessage(error.message, "error");
        }
    });

async function editSubject(id) {

    try {

        const subject = await api(`/subjects/${id}`);

        document
            .getElementById("subjectFormCard")
            .classList.remove("hidden");

        document.getElementById("subjectFormTitle").textContent =
            "Edit Subject";

        document.getElementById("subjectId").value =
            subject.id;

        document.getElementById("subjectName").value =
            subject.name;

    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function deleteSubject(id) {

    if (!confirm("Delete this subject?")) {
        return;
    }

    try {

        await api(`/subjects/${id}`, {
            method: "DELETE"
        });

        showMessage(
            "Subject deleted successfully",
            "success"
        );

        await loadSubjects();
        await loadDashboard();

    } catch (error) {
        showMessage(error.message, "error");
    }
}


/* =========================
   SESSIONS
   DATE VERSION
========================= */

async function loadSessionSubjects() {

    try {

        const subjects = await api("/subjects");

        const select =
            document.getElementById("sessionSubject");

        select.innerHTML =
            `<option value="">Select Subject</option>`;

        subjects.forEach(subject => {

            const option =
                document.createElement("option");

            option.value = subject.id;
            option.textContent = subject.name;

            select.appendChild(option);
        });

    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function loadSessions() {

    try {

        const sessions = await api("/sessions");

        const tbody =
            document.getElementById("sessionsTableBody");

        tbody.innerHTML = "";

        sessions.sort((a, b) =>
            String(a.sessionDate).localeCompare(
                String(b.sessionDate)
            )
        );

        sessions.forEach(session => {

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${escapeHtml(session.sessionDate)}
                </td>

                <td>
                    ${escapeHtml(session.subject.name)}
                </td>

                <td>
                    <button
                        class="btn btn-small btn-primary"
                        onclick="editSession(${session.id})"
                    >
                        Edit
                    </button>

                    <button
                        class="btn btn-small btn-danger"
                        onclick="deleteSession(${session.id})"
                    >
                        Delete
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

    } catch (error) {
        showMessage(error.message, "error");
    }
}

document
    .getElementById("sessionForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const id =
            document.getElementById("sessionId").value;

        const sessionDate =
            document.getElementById("sessionDate").value;

        const subjectId =
            document.getElementById("sessionSubject").value;

        if (!sessionDate || !subjectId) {

            showMessage(
                "Please select date and subject",
                "error",
                "sessionMessage"
            );

            return;
        }

        const data = {
            sessionDate: sessionDate,
            subject: {
                id: Number(subjectId)
            }
        };

        try {

            if (id) {

                await api(
                    `/sessions/${id}?subjectId=${subjectId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(data)
                    }
                );

                showMessage(
                    "Session updated successfully",
                    "success",
                    "sessionMessage"
                );

            } else {

                await api(
                    `/sessions?subjectId=${subjectId}`,
                    {
                        method: "POST",
                        body: JSON.stringify(data)
                    }
                );

                showMessage(
                    "Session created successfully",
                    "success",
                    "sessionMessage"
                );
            }

            resetSessionForm();

            await loadSessions();
            await loadDashboard();
            await loadAttendanceFormData();

        } catch (error) {

            showMessage(
                error.message,
                "error",
                "sessionMessage"
            );
        }
    });

async function editSession(id) {

    try {

        const session =
            await api(`/sessions/${id}`);

        await loadSessionSubjects();

        document.getElementById("sessionId").value =
            session.id;

        document.getElementById("sessionDate").value =
            session.sessionDate;

        document.getElementById("sessionSubject").value =
            session.subject.id;

        document.getElementById("sessionFormTitle").textContent =
            "Edit Session";

        document
            .getElementById("cancelSessionEdit")
            .classList.remove("hidden");

    } catch (error) {
        showMessage(error.message, "error");
    }
}

async function deleteSession(id) {

    if (!confirm("Delete this session?")) {
        return;
    }

    try {

        await api(`/sessions/${id}`, {
            method: "DELETE"
        });

        showMessage(
            "Session deleted successfully",
            "success"
        );

        await loadSessions();
        await loadDashboard();
        await loadAttendanceFormData();

    } catch (error) {
        showMessage(error.message, "error");
    }
}

function resetSessionForm() {

    document
        .getElementById("sessionForm")
        .reset();

    document.getElementById("sessionId").value = "";

    document.getElementById("sessionFormTitle").textContent =
        "Add Session";

    document
        .getElementById("cancelSessionEdit")
        .classList.add("hidden");
}

document
    .getElementById("cancelSessionEdit")
    .addEventListener(
        "click",
        resetSessionForm
    );


/* =========================
   ATTENDANCE FORM
========================= */

async function loadAttendanceFormData() {

    try {

        const [
            students,
            sessions
        ] = await Promise.all([
            api("/students"),
            api("/sessions")
        ]);

        const studentSelect =
            document.getElementById("attendanceStudent");

        const sessionSelect =
            document.getElementById("attendanceSession");

        studentSelect.innerHTML =
            `<option value="">Select Student</option>`;

        students.forEach(student => {

            const option =
                document.createElement("option");

            option.value = student.id;

            option.textContent =
                `${student.registerNumber} - ${student.name}`;

            studentSelect.appendChild(option);
        });

        sessionSelect.innerHTML =
            `<option value="">Select Session</option>`;

        sessions.sort((a, b) =>
            String(a.sessionDate).localeCompare(
                String(b.sessionDate)
            )
        );

        sessions.forEach(session => {

            const option =
                document.createElement("option");

            option.value = session.id;

            option.textContent =
                `${session.sessionDate} - ${session.subject.name}`;

            sessionSelect.appendChild(option);
        });

    } catch (error) {
        showMessage(error.message, "error");
    }
}


/* =========================
   CREATE ATTENDANCE
========================= */

document
    .getElementById("attendanceForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const studentId =
            document.getElementById("attendanceStudent").value;

        const sessionId =
            document.getElementById("attendanceSession").value;

        const present =
            document.getElementById("attendanceStatus").value;

        if (!studentId || !sessionId || present === "") {

            showMessage(
                "Please fill all attendance fields",
                "error",
                "attendanceMessage"
            );

            return;
        }

        try {

            await api(
                `/attendance?studentId=${studentId}&sessionId=${sessionId}&present=${present}`,
                {
                    method: "POST"
                }
            );

            showMessage(
                "Attendance marked successfully",
                "success",
                "attendanceMessage"
            );

            document
                .getElementById("attendanceForm")
                .reset();

            await loadAttendance();
            await loadDashboard();

        } catch (error) {

            showMessage(
                error.message,
                "error",
                "attendanceMessage"
            );
        }
    });


/* =========================
   LOAD ATTENDANCE
========================= */

async function loadAttendance() {

    try {

        const date =
            document
                .getElementById("attendanceDate")
                .value;

        const registerNumber =
            document
                .getElementById("attendanceRegisterNumber")
                .value
                .trim();

        const params =
            new URLSearchParams();

        if (date) {
            params.append("date", date);
        }

        if (registerNumber) {
            params.append(
                "registerNumber",
                registerNumber
            );
        }

        let url = "/attendance";

        if (params.toString()) {
            url += "?" + params.toString();
        }

        const attendance = await api(url);

        renderAttendanceTable(attendance);

    } catch (error) {
        showMessage(error.message, "error");
    }
}

function renderAttendanceTable(attendance) {

    const tbody =
        document.getElementById(
            "attendanceTableBody"
        );

    tbody.innerHTML = "";

    attendance.forEach(record => {

        const row =
            document.createElement("tr");

        const status =
            record.present
                ? "PRESENT"
                : "ABSENT";

        row.innerHTML = `
            <td>
                ${escapeHtml(record.student.name)}
            </td>

            <td>
                ${escapeHtml(
                    record.student.registerNumber
                )}
            </td>

            <td>
                ${escapeHtml(
                    record.session.subject.name
                )}
            </td>

            <td>
                ${escapeHtml(
                    record.session.sessionDate
                )}
            </td>

            <td>
                <span class="status-badge ${
                    record.present
                        ? "status-present"
                        : "status-absent"
                }">
                    ${status}
                </span>
            </td>

            <td>
                <button
                    class="btn btn-small btn-primary"
                    onclick="editAttendance(
                        ${record.id},
                        ${record.present}
                    )"
                >
                    Change
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}


/* =========================
   UPDATE ATTENDANCE
========================= */

async function editAttendance(
    id,
    currentStatus
) {

    const newStatus = confirm(
        "Click OK for PRESENT.\nClick Cancel for ABSENT."
    );

    if (newStatus === currentStatus) {

        showMessage(
            "Attendance is already set to this status",
            "error"
        );

        return;
    }

    try {

        await api(
            `/attendance/${id}?present=${newStatus}`,
            {
                method: "PUT"
            }
        );

        showMessage(
            "Attendance updated successfully",
            "success"
        );

        await loadAttendance();
        await loadDashboard();

    } catch (error) {
        showMessage(error.message, "error");
    }
}


/* =========================
   ATTENDANCE SEARCH
========================= */

document
    .getElementById("searchAttendanceButton")
    .addEventListener(
        "click",
        function() {
            loadAttendance();
        }
    );

document
    .getElementById("clearAttendanceSearchButton")
    .addEventListener(
        "click",
        function() {

            document
                .getElementById("attendanceDate")
                .value = "";

            document
                .getElementById("attendanceRegisterNumber")
                .value = "";

            loadAttendance();
        }
    );


/* =========================
   STUDENT DASHBOARD
========================= */

async function loadStudentDashboard() {

    try {

        const current =
            await api("/auth/current");

        const studentId =
            current.studentId;

        if (!studentId) {

            showMessage(
                "Student account is not linked to a student",
                "error"
            );

            return;
        }

        const [
            percentage,
            summary,
            attendance
        ] = await Promise.all([

            api(
                `/students/${studentId}/attendance/percentage`
            ),

            api(
                `/students/${studentId}/attendance/summary`
            ),

            api(
                `/students/${studentId}/attendance`
            )
        ]);

        document.getElementById("myPercentage").textContent =
            `${percentage.percentage}%`;

        document.getElementById("myThreshold").textContent =
            `${percentage.threshold}%`;

        const statusElement =
            document.getElementById("myStatus");

        statusElement.textContent =
            percentage.status;

        statusElement.className =
            "stat-value " +
            (
                percentage.status === "NORMAL"
                    ? "status-normal"
                    : "status-shortage"
            );

        renderStudentSummary(summary);
        renderStudentAttendance(attendance);

    } catch (error) {
        showMessage(error.message, "error");
    }
}

function renderStudentSummary(summary) {

    const tbody =
        document.getElementById(
            "subjectSummaryTable"
        );

    tbody.innerHTML = "";

    summary.forEach(item => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                ${escapeHtml(item.subjectName)}
            </td>

            <td>
                ${item.present}
            </td>

            <td>
                ${item.total}
            </td>

            <td>
                ${item.percentage}%
            </td>

            <td>
                <span class="status-badge ${
                    item.status === "NORMAL"
                        ? "status-present"
                        : "status-absent"
                }">
                    ${item.status}
                </span>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function renderStudentAttendance(attendance) {

    const tbody =
        document.getElementById(
            "myAttendanceTable"
        );

    tbody.innerHTML = "";

    attendance.forEach(record => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                ${escapeHtml(
                    record.session.subject.name
                )}
            </td>

            <td>
                ${escapeHtml(
                    record.session.sessionDate
                )}
            </td>

            <td>
                <span class="status-badge ${
                    record.present
                        ? "status-present"
                        : "status-absent"
                }">
                    ${
                        record.present
                            ? "PRESENT"
                            : "ABSENT"
                    }
                </span>
            </td>
        `;

        tbody.appendChild(row);
    });
}


/* =========================
   START APPLICATION
========================= */

checkCurrentUser();