import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginUser, registerUser } from "../services/auth";
import { AuthContext } from "../context/AuthContext";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function AuthPage() {
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const validateEmail = (email) => emailRegex.test(email.trim().toLowerCase());

  const handleLogin = async (e) => {
    e.preventDefault();

    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;

    if (!validateEmail(email)) {
      toast.error("Enter valid email");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const data = await loginUser({ email, password });
      localStorage.setItem("token", data.token);
      await refreshUser();
      toast.success("Signed in!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Sign in failed");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const name = registerForm.name.trim();
    const email = registerForm.email.trim().toLowerCase();
    const password = registerForm.password;

    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Enter valid email");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await registerUser({ name, email, password });

      toast.success("Account created! Please Sign In.");

      // ✅ Switch to login + prefill
      setLoginForm({ email, password });
      setMode("login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Sign up failed");
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div
        className="row w-100 auth-card-anim"
        style={{ maxWidth: 1040, borderRadius: 18, overflow: "hidden" }}
      >
        {/* LEFT PANEL */}
        <div className="col-md-6 p-5 text-light" style={{ background: "#0b1220" }}>
          <h1 className="fw-bold" style={{ letterSpacing: 0.2 }}>CodeSync Live</h1>

          <p className="text-secondary mt-3" style={{ lineHeight: 1.6, fontSize: 16 }}>
            Collaborate on code instantly. Share a room, edit together, and run code in
            multiple languages — all in one place.
          </p>

          <div className="mt-4">
            <div className="d-flex gap-3 align-items-center mb-3">
              <span className="rounded-circle" style={{ width: 10, height: 10, background: "#22c55e" }} />
              <span style={{ fontSize: 16 }}>Real-time collaborative editing</span>
            </div>
            <div className="d-flex gap-3 align-items-center mb-3">
              <span className="rounded-circle" style={{ width: 10, height: 10, background: "#22c55e" }} />
              <span style={{ fontSize: 16 }}>Create or join rooms instantly</span>
            </div>
            <div className="d-flex gap-3 align-items-center">
              <span className="rounded-circle" style={{ width: 10, height: 10, background: "#22c55e" }} />
              <span style={{ fontSize: 16 }}>Run code in multiple languages</span>
            </div>
          </div>

          {/* Optional illustration */}
          <div className="mt-5">
            {/* Put an image here if you want */}
            {/* <img src="/images/auth-illustration.png" alt="illustration" className="img-fluid" /> */}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-md-6 p-5 bg-light">
          {/* Center toggle */}
          <div className="d-flex justify-content-center mb-4">
            <div className="btn-group">
              <button
                type="button"
                className={`btn btn-sm ${mode === "login" ? "btn-success" : "btn-outline-success"}`}
                onClick={() => setMode("login")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === "register" ? "btn-success" : "btn-outline-success"}`}
                onClick={() => setMode("register")}
              >
                Sign Up
              </button>
            </div>
          </div>

          {mode === "login" ? (
            <>
              {/* Heading: LOGIN (as you requested) */}
              <h3 className="fw-bold mb-4">Login</h3>

              <form onSubmit={handleLogin} noValidate>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="name@gmail.com"
                    type="text"
                    autoComplete="email"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    className="form-control"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                  />
                </div>

                <button className="btn btn-success w-100 py-2 mt-2">
                  Sign In
                </button>

                {/* Bottom line: Don't have an account? Sign Up */}
                <div className="text-center mt-3 text-secondary">
                  Don&apos;t have an account?{" "}
                  <span
                    style={{ cursor: "pointer", color: "#16a34a", fontWeight: 600 }}
                    onClick={() => setMode("register")}
                  >
                    Sign Up
                  </span>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Keep create account (as you requested) */}
              <h3 className="fw-bold mb-4">Create account</h3>

              <form onSubmit={handleRegister} noValidate>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    placeholder="Your name"
                    type="text"
                    autoComplete="name"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="name@gmail.com"
                    type="text"
                    autoComplete="email"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    className="form-control"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    type="password"
                    autoComplete="new-password"
                  />
                </div>

                <button className="btn btn-success w-100 py-2 mt-2">
                  Sign Up
                </button>

                {/* Bottom line: Already have an account? Sign In */}
                <div className="text-center mt-3 text-secondary">
                  Already have an account?{" "}
                  <span
                    style={{ cursor: "pointer", color: "#16a34a", fontWeight: 600 }}
                    onClick={() => setMode("login")}
                  >
                    Sign In
                  </span>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
