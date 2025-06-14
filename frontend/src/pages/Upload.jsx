import React, { useState } from "react";
import axios from "../api";

export default function Upload({ token }) {
  const [file, setFile] = useState(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !start || !end) return;
    const form = new FormData();
    form.append("file", file);
    form.append("start_date", start);
    form.append("end_date", end);
    await axios.post("/files/upload", form, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMsg("Uploaded!");
    setFile(null);
    setStart("");
    setEnd("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Upload File</h3>
      {msg && <div>{msg}</div>}
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        required
      />
      <input
        type="date"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        required
      />
      <input
        type="date"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        required
      />
      <button type="submit">Upload</button>
    </form>
  );
}
