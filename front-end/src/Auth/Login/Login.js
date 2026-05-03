import { useEffect, useState } from 'react';
import './Login.css';
import axios from 'axios';

export default function Login() {

    const [token, setToken] = useState([])
    const [email, setEmail] = useState("")
    const [pass, setPass] = useState("")

    // useEffect(() => {

    // })

    async function submit(e) {
        let flag = true;
        e.preventDefault();
        if (email === "" || pass === "") {
            flag = false
        } else flag = true

        try {
            let res = await axios.post("http://127.0.0.1:8000/api/login", {
                "email": email,
                "password": pass
            })
            if (res.status === 200) {
                setToken(res.data.token)
                localStorage.setItem('token', res.data.token);
                window.location.pathname = `/auth/dashboard`;
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