import { useState } from 'react';
import './Login.css';
import axios from 'axios';

function normalizeCode(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
}

function normalizeText(value) {
    return String(value || '')
        .trim()
        .toLowerCase();
}

export default function Login() {

    const [token, setToken] = useState([])
    const [email, setEmail] = useState("")
    const [pass, setPass] = useState("")

    async function submit(e) {
        e.preventDefault();

        if (email === "" || pass === "") {
            return;
        }

        try {
            let res = await axios.post("http://127.0.0.1:8000/api/login", {
                "email": email,
                "password": pass
            })

            if (res.status === 200) {
                const authToken = res.data.token;
                setToken(authToken)
                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(res.data.user));

                let fullUser = res.data.user;
                let permissions = [];

                try {
                    const me = await axios.get("http://127.0.0.1:8000/api/me", {
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                        },
                    });

                    fullUser = me.data.user || fullUser;
                    permissions = me.data.permissions || [];

                    localStorage.setItem('user', JSON.stringify(fullUser));
                    localStorage.setItem('permissions', JSON.stringify(permissions));
                } catch (profileErr) {
                    console.log(profileErr.response || profileErr);
                }

                const departmentCode = normalizeCode(
                    fullUser?.employee?.department?.code ||
                    fullUser?.department?.code
                );

                const departmentName = normalizeText(
                    fullUser?.employee?.department?.name ||
                    fullUser?.department?.name
                );

                const isDoctor = fullUser?.type === 'doctor';

                const isStudentAffairsEmployee =
                    fullUser?.type === 'employee' &&
                    (
                        departmentCode === 'student_affairs' ||
                        departmentCode === 'std_aff' ||
                        departmentCode === 'stu_affairs' ||
                        departmentName.includes('student affairs') ||
                        departmentName.includes('شؤون الطلاب') ||
                        permissions.includes('view undergraduate students') ||
                        permissions.includes('create undergraduate students') ||
                        permissions.includes('update undergraduate students') ||
                        permissions.includes('change undergraduate student status') ||
                        permissions.includes('manage undergraduate schedules') ||
                        permissions.includes('set course attendance limits') ||
                        permissions.includes('send student notifications')
                    );

                const isExaminationsEmployee =
                    fullUser?.type === 'employee' &&
                    (
                        departmentCode === 'exams' ||
                        departmentCode === 'exam' ||
                        departmentCode === 'examinations' ||
                        departmentName.includes('examination') ||
                        departmentName.includes('exam') ||
                        departmentName.includes('الامتحانات') ||
                        permissions.includes('manage grade objections') ||
                        permissions.includes('manage student grades') ||
                        permissions.includes('manage exam schedules') ||
                        permissions.includes('manage supplementary exam schedules') ||
                        permissions.includes('review supplementary requests') ||
                        permissions.includes('close academic year')
                    );

                const isFinanceEmployee =
                    fullUser?.type === 'employee' &&
                    (
                        departmentCode === 'finance' ||
                        departmentCode === 'fin' ||
                        departmentName.includes('finance') ||
                        departmentName.includes('financial') ||
                        departmentName.includes('المالية') ||
                        permissions.includes('set annual tuition fees') ||
                        permissions.includes('update tuition payment status')
                    );

                const isHigherStudiesEmployee =
                    fullUser?.type === 'employee' &&
                    (
                        departmentCode === 'higher_studies' ||
                        departmentCode === 'postgraduate' ||
                        departmentCode === 'pg' ||
                        departmentCode === 'graduate_studies' ||
                        departmentName.includes('higher studies') ||
                        departmentName.includes('postgraduate') ||
                        departmentName.includes('graduate studies') ||
                        departmentName.includes('الدراسات العليا') ||
                        permissions.includes('view postgraduate students') ||
                        permissions.includes('create postgraduate students') ||
                        permissions.includes('update postgraduate students') ||
                        permissions.includes('manage postgraduate schedules')
                    );

                if (fullUser?.type === 'student') {
                    window.location.pathname = `/auth/student/profile`;
                } else if (isDoctor) {
                    window.location.pathname = `/auth/doctor/profile`;
                } else if (isStudentAffairsEmployee) {
                    window.location.pathname = `/auth/student-affairs`;
                } else if (isExaminationsEmployee) {
                    window.location.pathname = `/auth/examinations-dept`;
                } else if (isFinanceEmployee) {
                    window.location.pathname = `/auth/finance-dept`;
                } else if (isHigherStudiesEmployee) {
                    window.location.pathname = `/auth/higher-studies`;
                } else {
                    window.location.pathname = `/auth/dashboard`;
                }
            }
        } catch (err) {
            console.log(err.response)
        }
    }

    console.log(token)

    return (
        <div className="body">
            <div className="wrapper">
                <form onSubmit={submit}>

                    <h2>Login</h2>
                    <div className="input-field">
                        <input type="email" required onChange={(e) => setEmail(e.target.value)} />
                        <label>Enter your email</label>
                    </div>

                    <div className="input-field">
                        <input type="password" required onChange={(e) => setPass(e.target.value)} />
                        <label>Enter your password</label>
                    </div>

                    <div className="forget">
                        <label htmlFor="remember">
                            <input type="checkbox" id="remember" />
                            <p>Remember me</p>
                        </label>
                        <a href="#">Forgot password?</a>
                    </div>

                    <button type="submit">Log In</button>

                    <div className="register">
                        <p>Don't have an account? <a href="#">Register</a></p>
                    </div>

                </form>
            </div>
        </div>
    )
}
