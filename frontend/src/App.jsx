import React, { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Analytics from "./pages/Analytics";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [page, setPage] = useState("dashboard");

  if (!token) {
    return <Login setToken={setToken} setRole={setRole} />;
  }

  return (
    <div>
      <nav style={{marginBottom: "10px"}}>
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        {role === "client" && (
          <button onClick={() => setPage("upload")}>Upload</button>
        )}
        {role === "admin" && (
          <button onClick={() => setPage("analytics")}>Analytics</button>
        )}
        <button
          onClick={() => {
            localStorage.clear();
            setToken(null);
            setRole(null);
          }}
        >
          Logout
        </button>
      </nav>
      <hr />
      {page === "dashboard" && <Dashboard token={token} />}
      {page === "upload" && <Upload token={token} />}
      {page === "analytics" && <Analytics token={token} />}
    </div>
  );
}

export default App;
