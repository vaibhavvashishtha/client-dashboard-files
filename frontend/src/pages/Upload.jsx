import React, { useState } from "react";
import axios from "../api";
import { format } from "date-fns";
import { CalendarIcon } from "@heroicons/react/24/outline";
import FileUpload from "../components/FileUpload";
import DateRangePicker from "../components/DateRangePicker";
import FileList from "../components/FileList";

export default function Upload({ token }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadHistory, setUploadHistory] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const validateDateRange = () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return false;
    }
    if (startDate > endDate) {
      setError("Start date must be before end date");
      return false;
    }
    setError("");
    return true;
  };

  const validateFile = (file) => {
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         'application/vnd.ms-excel'];
    
    if (!allowedTypes.includes(file.type)) {
      setError("Please select an XLS or XLSX file");
      return false;
    }
    
    if (file.size > maxSize) {
      setError("File size exceeds 100MB limit");
      return false;
    }
    
    setError("");
    return true;
  };



  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    if (!validateDateRange()) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("start_date", format(startDate, 'yyyy-MM-dd'));
      formData.append("end_date", format(endDate, 'yyyy-MM-dd'));
      
      const response = await axios.post("/api/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setUploadHistory(prev => prev.map(item => 
          item.name === file.name ? { ...item, status: "success" } : item
        ));
        alert("File uploaded successfully!");
        setFile(null);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err.response?.data);
      setError(err.response?.data?.detail || err.message || "Failed to upload file");
      setUploadHistory(prev => prev.map(item => 
        item.name === file.name ? { ...item, status: "error" } : item
      ));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">File Upload</h1>
        <p className="text-lg text-gray-600">Upload your Excel files here</p>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-6">
          <FileUpload 
            file={file} 
            setFile={setFile} 
            handleUpload={handleUpload} 
            uploading={uploading} 
            error={error} 
          />
          
          <div className="border-t border-gray-200 pt-6">
            <DateRangePicker 
              startDate={startDate} 
              endDate={endDate} 
              setStartDate={setStartDate} 
              setEndDate={setEndDate} 
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <FileList uploadHistory={uploadHistory} />
      </div>
    </div>
  );
}
