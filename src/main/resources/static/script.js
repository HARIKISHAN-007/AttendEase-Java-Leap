const API_BASE="/api";
let currentUser=null;
let students=[];
let subjects=[];
let sessions=[];
let attendanceRecords=[];
let selectedAttendanceStudent=null;
let threshold=75;
let editingStudentId=null;
let editingSubjectId=null;
let editingSessionId=null;

document.addEventListener("DOMContentLoaded",async()=>{
    setupNavigation();
    setupForms();
    await checkCurrentUser();
});

async function api(endpoint,options={}){
    const response=await fetch(API_BASE+endpoint,{
        credentials:"include",
        headers:{"Content-Type":"application/json",...(options.headers||{})},
        ...options
    });
    let data=null;
    const text=await response.text();
    if(text){
        try{
            data=JSON.parse(text);
        }catch{
            data=text;
        }
    }
    if(!response.ok)throw new Error(data?.message||"Request failed");
    return data;
}

function showMessage(message,type="success",elementId="message"){
    const element=document.getElementById(elementId);
    if(!element)return;
    element.textContent=message;
    element.className=`message ${type}`;
    setTimeout(()=>{
        element.textContent="";
        element.className="message";
    },3500);
}

function setupNavigation(){
    document.querySelectorAll(".nav-item").forEach(button=>{
        button.addEventListener("click",()=>{
            const section=button.dataset.section;
            if(!section)return;
            if(currentUser?.role==="STUDENT"&&section!=="studentDashboard")return;
            showSection(section);
        });
    });
    const logoutButton=document.getElementById("logoutButton");
    if(logoutButton)logoutButton.addEventListener("click",logout);
}

function showSection(section){
    if(currentUser?.role==="STUDENT"&&section!=="studentDashboard")return;
    document.querySelectorAll(".content-section").forEach(item=>item.classList.add("hidden"));
    const target=document.getElementById(section);
    if(target)target.classList.remove("hidden");
    document.querySelectorAll(".nav-item").forEach(item=>{
        item.classList.toggle("active",item.dataset.section===section);
    });
    const titles={
        dashboard:"Dashboard",
        students:"Students",
        subjects:"Subjects",
        sessions:"Sessions",
        attendance:"Attendance",
        studentDashboard:"My Attendance"
    };
    const title=document.getElementById("pageTitle");
    const subtitle=document.getElementById("pageSubtitle");
    if(title)title.textContent=titles[section]||"AttendEase";
    if(subtitle)subtitle.textContent=section==="attendance"?"Date-wise attendance management":"Classroom Attendance Marking System";
    if(section==="dashboard")loadDashboard();
    if(section==="students")loadStudents();
    if(section==="subjects")loadSubjects();
    if(section==="sessions")loadSessions();
    if(section==="attendance")loadAttendancePage();
    if(section==="studentDashboard")loadStudentDashboard();
}

async function checkCurrentUser(){
    try{
        currentUser=await api("/auth/current");
        showApplication();
    }catch{
        showLogin();
    }
}

function showLogin(){
    const loginPage=document.getElementById("loginPage");
    const appPage=document.getElementById("appPage");
    if(loginPage)loginPage.classList.remove("hidden");
    if(appPage)appPage.classList.add("hidden");
}

function showApplication(){
    const loginPage=document.getElementById("loginPage");
    const appPage=document.getElementById("appPage");
    if(loginPage)loginPage.classList.add("hidden");
    if(appPage)appPage.classList.remove("hidden");
    applyRoleUI();
    updateUserDetails();
    if(currentUser.role==="STUDENT"){
        showSection("studentDashboard");
    }else{
        showSection("dashboard");
    }
}

function updateUserDetails(){
    const username=currentUser?.username||"User";
    const role=currentUser?.role||"";
    const elements=[
        document.getElementById("sidebarUserName"),
        document.getElementById("topUserName")
    ];
    elements.forEach(element=>{
        if(element)element.textContent=username;
    });
    const roleElements=[
        document.getElementById("sidebarUserRole"),
        document.getElementById("topUserRole")
    ];
    roleElements.forEach(element=>{
        if(element)element.textContent=role;
    });
    const avatars=[
        document.getElementById("topUserAvatar"),
        document.getElementById("sidebarUserAvatar")
    ];
    avatars.forEach(element=>{
        if(element)element.textContent=username.charAt(0).toUpperCase();
    });
}

function applyRoleUI(){
    const teacherOnly=document.querySelectorAll(".teacher-only");
    const studentOnly=document.querySelectorAll(".student-only");
    teacherOnly.forEach(element=>{
        element.classList.toggle("hidden",currentUser?.role!=="TEACHER");
    });
    studentOnly.forEach(element=>{
        element.classList.toggle("hidden",currentUser?.role!=="STUDENT");
    });
    if(currentUser?.role==="STUDENT"){
        document.querySelectorAll(".nav-item").forEach(item=>{
            item.classList.toggle("hidden",item.dataset.section!=="studentDashboard");
        });
        document.querySelectorAll(".teacher-only").forEach(item=>item.classList.add("hidden"));
        document.querySelectorAll(".student-only").forEach(item=>item.classList.remove("hidden"));
        hideStudentEditControls();
    }else{
        document.querySelectorAll(".nav-item").forEach(item=>item.classList.remove("hidden"));
    }
}

function hideStudentEditControls(){
    const selectors=[
        "#studentFormCard",
        "#subjectFormCard",
        "#sessionFormCard",
        "#thresholdForm",
        "#attendanceForm",
        "#attendanceControls",
        ".student-edit-control",
        ".student-management-control"
    ];
    selectors.forEach(selector=>{
        document.querySelectorAll(selector).forEach(element=>element.classList.add("hidden"));
    });
}

function setupForms(){
    const loginForm=document.getElementById("loginForm");
    if(loginForm)loginForm.addEventListener("submit",login);
    const studentForm=document.getElementById("studentForm");
    if(studentForm)studentForm.addEventListener("submit",saveStudent);
    const subjectForm=document.getElementById("subjectForm");
    if(subjectForm)subjectForm.addEventListener("submit",saveSubject);
    const sessionForm=document.getElementById("sessionForm");
    if(sessionForm)sessionForm.addEventListener("submit",saveSession);
    const cancelStudent=document.getElementById("cancelStudentButton");
    if(cancelStudent)cancelStudent.addEventListener("click",resetStudentForm);
    const cancelSubject=document.getElementById("cancelSubjectButton");
    if(cancelSubject)cancelSubject.addEventListener("click",resetSubjectForm);
    const cancelSession=document.getElementById("cancelSessionButton");
    if(cancelSession)cancelSession.addEventListener("click",resetSessionForm);
    const thresholdForm=document.getElementById("thresholdForm");
    if(thresholdForm)thresholdForm.addEventListener("submit",saveThreshold);
    const attendanceStudent=document.getElementById("attendanceStudent");
    if(attendanceStudent)attendanceStudent.addEventListener("change",loadAttendanceMatrix);
    const loadAttendanceButton=document.getElementById("loadAttendanceReportButton");
    if(loadAttendanceButton)loadAttendanceButton.addEventListener("click",loadAttendanceMatrix);
}

async function login(event){
    event.preventDefault();
    const username=document.getElementById("loginUsername")?.value.trim();
    const password=document.getElementById("loginPassword")?.value;
    if(!username||!password){
        showMessage("Username and password are required","error","loginMessage");
        return;
    }
    try{
        const data=await api("/auth/login",{
            method:"POST",
            body:JSON.stringify({username,password})
        });
        currentUser=data;
        showApplication();
    }catch(error){
        showMessage(error.message,"error","loginMessage");
    }
}

async function logout(){
    try{
        await api("/auth/logout",{method:"POST"});
    }catch{}
    currentUser=null;
    students=[];
    subjects=[];
    sessions=[];
    attendanceRecords=[];
    selectedAttendanceStudent=null;
    showLogin();
}

async function loadDashboard(){
    if(currentUser?.role!=="TEACHER")return;
    try{
        const [studentData,subjectData,sessionData,attendanceData]=await Promise.all([
            api("/students"),
            api("/subjects"),
            api("/sessions"),
            api("/attendance")
        ]);
        students=studentData;
        subjects=subjectData;
        sessions=sessionData;
        attendanceRecords=attendanceData;
        setText("studentCount",students.length);
        setText("subjectCount",subjects.length);
        setText("sessionCount",sessions.length);
        setText("attendanceCount",attendanceRecords.length);
        await loadThreshold();
    }catch(error){
        showMessage(error.message,"error");
    }
}

async function loadStudents(){
    if(currentUser?.role!=="TEACHER")return;
    try{
        students=await api("/students");
        renderStudents();
        populateAttendanceStudentSelect();
    }catch(error){
        showMessage(error.message,"error");
    }
}

function renderStudents(){
    const body=document.getElementById("studentsTableBody");
    if(!body)return;
    body.innerHTML="";
    if(!students.length){
        body.innerHTML='<tr><td colspan="4" class="empty-attendance">No students found</td></tr>';
        return;
    }
    students.forEach(student=>{
        const row=document.createElement("tr");
        row.innerHTML=`
            <td>${escapeHtml(student.id)}</td>
            <td>${escapeHtml(student.name)}</td>
            <td>${escapeHtml(student.registerNumber)}</td>
            <td>
                <button class="btn btn-primary btn-small" onclick="editStudent(${student.id})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteStudent(${student.id})">Delete</button>
            </td>
        `;
        body.appendChild(row);
    });
}

function editStudent(id){
    if(currentUser?.role!=="TEACHER")return;
    const student=students.find(item=>item.id===id);
    if(!student)return;
    editingStudentId=id;
    setValue("studentName",student.name);
    setValue("registerNumber",student.registerNumber);
    setText("studentFormTitle","Edit Student");
    setText("studentSubmitButton","Update Student");
    document.getElementById("studentFormCard")?.scrollIntoView({behavior:"smooth"});
}

async function saveStudent(event){
    if(currentUser?.role!=="TEACHER")return;
    event.preventDefault();
    const name=document.getElementById("studentName")?.value.trim();
    const registerNumber=document.getElementById("registerNumber")?.value.trim();
    try{
        if(editingStudentId){
            await api(`/students/${editingStudentId}`,{
                method:"PUT",
                body:JSON.stringify({name,registerNumber})
            });
            showMessage("Student updated successfully");
        }else{
            await api("/students",{
                method:"POST",
                body:JSON.stringify({name,registerNumber})
            });
            showMessage("Student added successfully");
        }
        resetStudentForm();
        await loadStudents();
        await loadDashboard();
    }catch(error){
        showMessage(error.message,"error");
    }
}

async function deleteStudent(id){
    if(currentUser?.role!=="TEACHER")return;
    if(!confirm("Delete this student?"))return;
    try{
        await api(`/students/${id}`,{method:"DELETE"});
        showMessage("Student deleted successfully");
        await loadStudents();
        await loadDashboard();
    }catch(error){
        showMessage(error.message,"error");
    }
}

function resetStudentForm(){
    editingStudentId=null;
    document.getElementById("studentForm")?.reset();
    setText("studentFormTitle","Add Student");
    setText("studentSubmitButton","Add Student");
}

async function loadSubjects(){
    if(currentUser?.role!=="TEACHER")return;
    try{
        subjects=await api("/subjects");
        renderSubjects();
        populateSessionSubjectSelect();
        renderAttendanceSubjectHeaders();
    }catch(error){
        showMessage(error.message,"error");
    }
}

function renderSubjects(){
    const body=document.getElementById("subjectsTableBody");
    if(!body)return;
    body.innerHTML="";
    if(!subjects.length){
        body.innerHTML='<tr><td colspan="3" class="empty-attendance">No subjects found</td></tr>';
        return;
    }
    subjects.forEach(subject=>{
        const row=document.createElement("tr");
        row.innerHTML=`
            <td>${escapeHtml(subject.id)}</td>
            <td>${escapeHtml(subject.name)}</td>
            <td>
                <button class="btn btn-primary btn-small" onclick="editSubject(${subject.id})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteSubject(${subject.id})">Delete</button>
            </td>
        `;
        body.appendChild(row);
    });
}

function editSubject(id){
    if(currentUser?.role!=="TEACHER")return;
    const subject=subjects.find(item=>item.id===id);
    if(!subject)return;
    editingSubjectId=id;
    setValue("subjectName",subject.name);
    setText("subjectFormTitle","Edit Subject");
    setText("subjectSubmitButton","Update Subject");
    document.getElementById("subjectFormCard")?.scrollIntoView({behavior:"smooth"});
}

async function saveSubject(event){
    if(currentUser?.role!=="TEACHER")return;
    event.preventDefault();
    const name=document.getElementById("subjectName")?.value.trim();
    try{
        if(editingSubjectId){
            await api(`/subjects/${editingSubjectId}`,{
                method:"PUT",
                body:JSON.stringify({name})
            });
            showMessage("Subject updated successfully");
        }else{
            await api("/subjects",{
                method:"POST",
                body:JSON.stringify({name})
            });
            showMessage("Subject added successfully");
        }
        resetSubjectForm();
        await loadSubjects();
        await loadDashboard();
    }catch(error){
        showMessage(error.message,"error");
    }
}

async function deleteSubject(id){
    if(currentUser?.role!=="TEACHER")return;
    if(!confirm("Delete this subject?"))return;
    try{
        await api(`/subjects/${id}`,{method:"DELETE"});
        showMessage("Subject deleted successfully");
        await loadSubjects();
        await loadDashboard();
    }catch(error){
        showMessage(error.message,"error");
    }
}

function resetSubjectForm(){
    editingSubjectId=null;
    document.getElementById("subjectForm")?.reset();
    setText("subjectFormTitle","Add Subject");
    setText("subjectSubmitButton","Add Subject");
}

async function loadSessions(){
    if(currentUser?.role!=="TEACHER")return;
    try{
        sessions=await api("/sessions");
        if(!subjects.length)subjects=await api("/subjects");
        renderSessions();
        populateSessionSubjectSelect();
    }catch(error){
        showMessage(error.message,"error");
    }
}

function renderSessions(){
    const body=document.getElementById("sessionsTableBody");
    if(!body)return;
    body.innerHTML="";
    if(!sessions.length){
        body.innerHTML='<tr><td colspan="4" class="empty-attendance">No sessions found</td></tr>';
        return;
    }
    sessions.forEach(session=>{
        const row=document.createElement("tr");
        row.innerHTML=`
            <td>${escapeHtml(session.id)}</td>
            <td>${formatDate(session.sessionDate)}</td>
            <td>${escapeHtml(session.subject?.name||getSubjectName(session.subject?.id))}</td>
            <td>
                <button class="btn btn-primary btn-small" onclick="editSession(${session.id})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteSession(${session.id})">Delete</button>
            </td>
        `;
        body.appendChild(row);
    });
}

function editSession(id){
    if(currentUser?.role!=="TEACHER")return;
    const session=sessions.find(item=>item.id===id);
    if(!session)return;
    editingSessionId=id;
    setValue("sessionDate",session.sessionDate);
    setValue("sessionSubject",session.subject?.id||"");
    setText("sessionFormTitle","Edit Session");
    setText("sessionSubmitButton","Update Session");
    document.getElementById("sessionFormCard")?.scrollIntoView({behavior:"smooth"});
}

async function saveSession(event){
    if(currentUser?.role!=="TEACHER")return;
    event.preventDefault();
    const sessionDate=document.getElementById("sessionDate")?.value;
    const subjectId=document.getElementById("sessionSubject")?.value;
    try{
        if(editingSessionId){
            await api(`/sessions/${editingSessionId}?subjectId=${subjectId}`,{
                method:"PUT",
                body:JSON.stringify({sessionDate})
            });
            showMessage("Session updated successfully");
        }else{
            await api(`/sessions?subjectId=${subjectId}`,{
                method:"POST",
                body:JSON.stringify({sessionDate})
            });
            showMessage("Session added successfully");
        }
        resetSessionForm();
        await loadSessions();
        await loadDashboard();
    }catch(error){
        showMessage(error.message,"error");
    }
}

async function deleteSession(id){
    if(currentUser?.role!=="TEACHER")return;
    if(!confirm("Delete this session?"))return;
    try{
        await api(`/sessions/${id}`,{method:"DELETE"});
        showMessage("Session deleted successfully");
        await loadSessions();
        await loadDashboard();
    }catch(error){
        showMessage(error.message,"error");
    }
}

function resetSessionForm(){
    editingSessionId=null;
    document.getElementById("sessionForm")?.reset();
    setText("sessionFormTitle","Add Session");
    setText("sessionSubmitButton","Add Session");
}

function populateSessionSubjectSelect(){
    const select=document.getElementById("sessionSubject");
    if(!select)return;
    const current=select.value;
    select.innerHTML='<option value="">Select subject</option>';
    subjects.forEach(subject=>{
        const option=document.createElement("option");
        option.value=subject.id;
        option.textContent=subject.name;
        select.appendChild(option);
    });
    if(current)select.value=current;
}

async function loadAttendancePage(){
    if(currentUser?.role!=="TEACHER")return;
    try{
        if(!students.length)students=await api("/students");
        if(!subjects.length)subjects=await api("/subjects");
        if(!sessions.length)sessions=await api("/sessions");
        populateAttendanceStudentSelect();
        renderAttendanceSubjectHeaders();
        await loadThreshold();
        await loadAttendanceMatrix();
    }catch(error){
        showMessage(error.message,"error");
    }
}

function populateAttendanceStudentSelect(){
    const select=document.getElementById("attendanceStudent");
    if(!select)return;
    const current=select.value;
    select.innerHTML='<option value="">Select student</option>';
    students.forEach(student=>{
        const option=document.createElement("option");
        option.value=student.id;
        option.textContent=`${student.name} (${student.registerNumber})`;
        select.appendChild(option);
    });
    if(current)select.value=current;
}

function renderAttendanceSubjectHeaders(){
    const row=document.getElementById("attendanceSubjectHeaderRow");
    if(!row)return;
    row.innerHTML="";
    subjects.forEach(subject=>{
        const th=document.createElement("th");
        th.className="subject-header-group";
        th.textContent=subject.name;
        row.appendChild(th);
    });
}

async function loadAttendanceMatrix(){
    if(currentUser?.role!=="TEACHER")return;
    const select=document.getElementById("attendanceStudent");
    const studentId=select?.value;
    if(!studentId){
        renderEmptyAttendance("Select a student to view attendance");
        return;
    }
    selectedAttendanceStudent=students.find(student=>student.id===Number(studentId))||null;
    try{
        const [records,sessionData]=await Promise.all([
            api(`/students/${studentId}/attendance`),
            sessions.length?Promise.resolve(sessions):api("/sessions")
        ]);
        attendanceRecords=records;
        sessions=sessionData;
        renderAttendanceSubjectHeaders();
        renderAttendanceStudentInfo(selectedAttendanceStudent);
        renderAttendanceMatrix(Number(studentId),records,sessions,true);
        updateAttendanceSummary(Number(studentId),new Map(records.map(record=>[record.session.id,record])));
    }catch(error){
        showMessage(error.message,"error","attendanceSaveMessage");
    }
}

function renderAttendanceStudentInfo(student){
    if(!student)return;
    setText("selectedStudentName",student.name);
    setText("selectedStudentRegister",student.registerNumber);
    const avatar=document.getElementById("attendanceStudentAvatar");
    if(avatar)avatar.textContent=student.name.charAt(0).toUpperCase();
}

function renderAttendanceMatrix(studentId,records,sessionList,editable=false){
    const body=document.getElementById("attendanceMatrixBody");
    if(!body)return;
    body.innerHTML="";
    if(!sessionList.length){
        renderEmptyAttendance("No sessions available");
        return;
    }
    const recordMap=new Map();
    records.forEach(record=>{
        if(record.session?.id)recordMap.set(record.session.id,record);
    });
    const grouped=new Map();
    sessionList.forEach(session=>{
        const date=session.sessionDate;
        if(!grouped.has(date))grouped.set(date,[]);
        grouped.get(date).push(session);
    });
    let index=1;
    grouped.forEach((dateSessions,date)=>{
        const row=document.createElement("tr");
        const dateCell=document.createElement("td");
        dateCell.className="sticky-column";
        dateCell.textContent=index++;
        row.appendChild(dateCell);
        const dateValue=document.createElement("td");
        dateValue.className="sticky-column";
        dateValue.textContent=formatDate(date);
        row.appendChild(dateValue);
        const dayCell=document.createElement("td");
        dayCell.className="sticky-column";
        dayCell.textContent=getDayName(date);
        row.appendChild(dayCell);
        const bySubject=new Map();
        dateSessions.forEach(session=>bySubject.set(session.subject?.id,session));
        subjects.forEach(subject=>{
            const cell=document.createElement("td");
            cell.className="attendance-cell";
            const session=bySubject.get(subject.id);
            if(!session){
                cell.textContent="—";
                row.appendChild(cell);
                return;
            }
            const record=recordMap.get(session.id);
            if(editable&&currentUser?.role==="TEACHER"){
                const button=document.createElement("button");
                applyAttendanceButtonState(button,record);
                button.addEventListener("click",()=>toggleAttendance(studentId,session,record,button));
                cell.appendChild(button);
            }else{
                const status=document.createElement("span");
                applyAttendanceViewState(status,record);
                cell.appendChild(status);
            }
            row.appendChild(cell);
        });
        body.appendChild(row);
    });
}

function applyAttendanceButtonState(button,record){
    button.className="";
    if(!record||record.present===null){
        button.classList.add("attendance-not-marked");
        button.textContent="N";
    }else if(record.present===true){
        button.classList.add("attendance-present");
        button.textContent="P";
    }else{
        button.classList.add("attendance-absent");
        button.textContent="A";
    }
}

function applyAttendanceViewState(element,record){
    if(!record||record.present===null){
        element.className="attendance-not-marked";
        element.textContent="N";
    }else if(record.present===true){
        element.className="attendance-present";
        element.textContent="P";
    }else{
        element.className="attendance-absent";
        element.textContent="A";
    }
}

async function toggleAttendance(studentId,session,record,button){
    if(currentUser?.role!=="TEACHER")return;
    const oldText=button.textContent;
    const oldClass=button.className;
    button.disabled=true;
    try{
        let nextStatus;
        if(!record||record.present===null)nextStatus=true;
        else if(record.present===true)nextStatus=false;
        else nextStatus=null;
        if(record){
            if(nextStatus===null){
                await api(`/attendance/${record.id}`,{method:"PUT"});
            }else{
                await api(`/attendance/${record.id}?present=${nextStatus}`,{method:"PUT"});
            }
        }else{
            await api(`/attendance?studentId=${studentId}&sessionId=${session.id}&present=true`,{method:"POST"});
        }
        await loadAttendanceMatrix();
        await loadDashboard();
        const message=document.getElementById("attendanceSaveMessage");
        if(message){
            message.textContent="Attendance updated";
            setTimeout(()=>message.textContent="",1800);
        }
    }catch(error){
        button.textContent=oldText;
        button.className=oldClass;
        showMessage(error.message,"error","attendanceSaveMessage");
    }finally{
        button.disabled=false;
    }
}

function updateAttendanceSummary(studentId,recordMap){
    let present=0;
    let absent=0;
    let notMarked=0;
    recordMap.forEach(record=>{
        if(record.present===true)present++;
        else if(record.present===false)absent++;
        else notMarked++;
    });
    const marked=present+absent;
    const percentage=marked===0?0:(present/marked)*100;
    const total=present+absent+notMarked;
    const presentPercent=total===0?0:(present/total)*100;
    const absentPercent=total===0?0:(absent/total)*100;
    const donutStartAbsent=presentPercent;
    const donutEndAbsent=presentPercent+absentPercent;
    setText("attendancePresentCount",present);
    setText("attendanceAbsentCount",absent);
    setText("attendanceNotMarkedCount",notMarked);
    setText("attendanceMarkedCount",marked);
    setText("attendancePercentage",`${percentage.toFixed(1)}%`);
    setText("attendanceDonutPercentage",`${percentage.toFixed(1)}%`);
    const status=document.getElementById("attendanceStatus");
    if(status){
        status.textContent=percentage<threshold?"SHORTAGE":"NORMAL";
        status.className=percentage<threshold?"attendance-status-shortage":"attendance-status-normal";
    }
    const donut=document.getElementById("attendanceDonut");
    if(donut){
        if(total===0){
            donut.style.background="conic-gradient(#cbd5e1 0% 100%)";
        }else{
            donut.style.background=`conic-gradient(#22c55e 0% ${presentPercent}%,#ef4444 ${donutStartAbsent}% ${donutEndAbsent}%,#cbd5e1 ${donutEndAbsent}% 100%)`;
        }
    }
    const totalElement=document.getElementById("attendanceTotalCount");
    if(totalElement)totalElement.textContent=marked;
}

function renderEmptyAttendance(message){
    const body=document.getElementById("attendanceMatrixBody");
    if(!body)return;
    const columnCount=Math.max(subjects.length+3,4);
    body.innerHTML=`<tr><td colspan="${columnCount}" class="empty-attendance">${escapeHtml(message)}</td></tr>`;
    setText("selectedStudentName","No student selected");
    setText("selectedStudentRegister","Select a student above");
    setText("attendancePresentCount","0");
    setText("attendanceAbsentCount","0");
    setText("attendanceNotMarkedCount","0");
    setText("attendanceMarkedCount","0");
    setText("attendancePercentage","0.0%");
    setText("attendanceDonutPercentage","0.0%");
    const donut=document.getElementById("attendanceDonut");
    if(donut)donut.style.background="conic-gradient(#cbd5e1 0% 100%)";
}

async function loadThreshold(){
    if(currentUser?.role!=="TEACHER")return;
    try{
        const data=await api("/config/threshold");
        threshold=Number(data.threshold);
        const input=document.getElementById("threshold");
        if(input)input.value=threshold;
        setText("thresholdValue",`${threshold}%`);
    }catch{}
}

async function saveThreshold(event){
    if(currentUser?.role!=="TEACHER")return;
    event.preventDefault();
    const value=Number(document.getElementById("threshold")?.value);
    try{
        const data=await api(`/config/threshold?threshold=${value}`,{method:"PUT"});
        threshold=Number(data.threshold);
        setText("thresholdValue",`${threshold}%`);
        showMessage("Threshold updated successfully");
        if(selectedAttendanceStudent)await loadAttendanceMatrix();
    }catch(error){
        showMessage(error.message,"error");
    }
}

async function loadStudentDashboard(){
    if(currentUser?.role!=="STUDENT")return;
    const studentId=currentUser.studentId;
    if(!studentId){
        showMessage("Student account is not linked to a student record","error");
        return;
    }
    try{
        const [summary,history,percentage]=await Promise.all([
            api(`/students/${studentId}/attendance/summary`),
            api(`/students/${studentId}/attendance`),
            api(`/students/${studentId}/attendance/percentage`)
        ]);
        renderStudentSummary(summary);
        renderStudentAttendance(history);
        setText("studentOverallPercentage",`${Number(percentage.percentage).toFixed(1)}%`);
        setText("studentOverallStatus",percentage.status);
        setText("selectedStudentName",history[0]?.student?.name||currentUser.username);
        if(history[0]?.student?.registerNumber)setText("selectedStudentRegister",history[0].student.registerNumber);
        hideStudentEditControls();
    }catch(error){
        showMessage(error.message,"error");
    }
}

function renderStudentSummary(summary){
    const body=document.getElementById("studentSummaryBody");
    if(!body)return;
    body.innerHTML="";
    if(!summary.length){
        body.innerHTML='<tr><td colspan="6" class="empty-attendance">No attendance marked yet</td></tr>';
        return;
    }
    summary.forEach(item=>{
        const row=document.createElement("tr");
        row.innerHTML=`
            <td>${escapeHtml(item.subjectName)}</td>
            <td>${item.present}</td>
            <td>${item.total}</td>
            <td>${Number(item.percentage).toFixed(1)}%</td>
            <td><span class="status-badge ${item.status==="NORMAL"?"status-normal":"status-shortage"}">${item.status}</span></td>
        `;
        body.appendChild(row);
    });
}

function renderStudentAttendance(records){
    const body=document.getElementById("studentHistoryBody");
    if(!body)return;
    body.innerHTML="";
    if(!records.length){
        body.innerHTML='<tr><td colspan="5" class="empty-attendance">No attendance records found</td></tr>';
        return;
    }
    const sorted=[...records].sort((a,b)=>{
        const dateA=a.session?.sessionDate||"";
        const dateB=b.session?.sessionDate||"";
        return dateB.localeCompare(dateA);
    });
    sorted.forEach(record=>{
        const status=record.present===true?"P":record.present===false?"A":"N";
        const statusClass=status==="P"?"status-present":status==="A"?"status-absent":"";
        const row=document.createElement("tr");
        row.innerHTML=`
            <td>${formatDate(record.session?.sessionDate)}</td>
            <td>${escapeHtml(record.session?.subject?.name||"")}</td>
            <td>${getDayName(record.session?.sessionDate)}</td>
            <td><span class="status-badge ${statusClass}">${status==="N"?"NOT MARKED":status}</span></td>
        `;
        body.appendChild(row);
    });
}

function getSubjectName(id){
    const subject=subjects.find(item=>item.id===id);
    return subject?subject.name:"";
}

function formatDate(date){
    if(!date)return"";
    const parts=String(date).split("-");
    if(parts.length!==3)return date;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function getDayName(date){
    if(!date)return"";
    const parts=String(date).split("-");
    if(parts.length!==3)return"";
    const value=new Date(Number(parts[0]),Number(parts[1])-1,Number(parts[2]));
    return value.toLocaleDateString("en-US",{weekday:"short"});
}

function setText(id,value){
    const element=document.getElementById(id);
    if(element)element.textContent=value;
}

function setValue(id,value){
    const element=document.getElementById(id);
    if(element)element.value=value;
}

function escapeHtml(value){
    if(value===null||value===undefined)return"";
    return String(value).replace(/[&<>"']/g,char=>({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
    }[char]));
}