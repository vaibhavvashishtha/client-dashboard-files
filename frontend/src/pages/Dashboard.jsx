import React, { useEffect, useState } from "react";
import axios from "../api";

export default function Dashboard({ token }) {
  const [files, setFiles] = useState([]);
  useEffect(() => {
    axios
      .get("/files/list", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setFiles(res.data));
  }, [token]);
  return (
    <div>
      <h3>Files</h3>
      <table border={1}>
        <thead>
          <tr>
            <th>Filename</th>
            <th>Start</th>
            <th>End</th>
            <th>Uploaded At</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id}>
              <td>{f.filename}</td>
              <td>{f.start_date}</td>
              <td>{f.end_date}</td>
              <td>{f.uploaded_at}</td>
              <td>
                <a
                  href={`http://localhost:8000/files/download/${f.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
