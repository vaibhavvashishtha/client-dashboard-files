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

  // Fetch history when token changes
  React.useEffect(() => {
    if (token) {
      fetchUploadHistory();
    }
  }, [token]);

  const fetchUploadHistory = async () => {
    try {
      const response = await axios.get('/files/history');
      setUploadHistory(response.data);
    } catch (error) {
      console.error('Error fetching upload history:', error);
      setError(error.response?.data?.detail || 'Failed to fetch upload history');
    }
  };

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
      setError("Please select a file");
      return;
    }

    if (!validateDateRange()) return;
    if (!validateFile(file)) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('start_date', format(startDate, 'yyyy-MM-dd'));
    formData.append('end_date', format(endDate, 'yyyy-MM-dd'));

    try {
      setUploading(true);
      setError("");
      
      const response = await axios.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update upload history
      fetchUploadHistory();
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload File</h1>
        <div className="flex space-x-4">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M9 4a1 1 0 00-2 0v2H4a1 1 0 100 2h2v2a1 1 0 102 0V8h2a1 1 0 100-2H9V4z" clipRule="evenodd" />
            </svg>
            New Upload
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Upload Details</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleUpload} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <FileUpload
                onFileSelect={setFile}
                error={error}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                className="w-full"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={uploading || !file || !startDate || !endDate}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  "Upload File"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Upload History</h2>
          </div>
          <div className="p-6">
            <FileList
              files={uploadHistory}
              token={token}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
