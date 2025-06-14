import React, { useState } from "react";
import axios from "../api";

export default function Login({ setToken, setRole }) {
  const [username, setUsername] = useState("client1");
  const [password, setPassword] = useState("client123");
  const [err, setErr] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append("username", username);
      form.append("password", password);
      const res = await axios.post("/auth/login", form);
      setToken(res.data.access_token);
      localStorage.setItem("token", res.data.access_token);
      // Decode role from username for demo (in production, decode JWT)
      if (username === "admin") localStorage.setItem("role", "admin");
      else if (username === "employee1") localStorage.setItem("role", "employee");
      else localStorage.setItem("role", "client");
      setRole(localStorage.getItem("role"));
    } catch (e) {
      setErr("Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      {err && <div style={{ color: "red" }}>{err}</div>}
      <input
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      /><br/>
      <input
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        required
      /><br/>
      <button type="submit">Login</button>
    </form>
  );
}
