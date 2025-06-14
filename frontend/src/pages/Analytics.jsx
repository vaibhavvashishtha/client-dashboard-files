import React, { useEffect, useState } from "react";
import axios from "../api";

export default function Analytics({ token }) {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    axios
      .get("/analytics/logs", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setLogs(res.data));
  }, [token]);
  return (
    <div>
      <h3>Activity Logs</h3>
      <table border={1}>
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>File ID</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l, idx) => (
            <tr key={idx}>
              <td>{l.user}</td>
              <td>{l.action}</td>
              <td>{l.file_id}</td>
              <td>{l.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
