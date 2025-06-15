import React, { useState } from "react";
import axios from "../api";
import { format } from "date-fns";
import { CalendarIcon } from "@heroicons/react/24/outline";
import FileUpload from "../components/FileUpload";
import DateRangePicker from "../components/DateRangePicker";
import FileList from "../components/FileList";

export default function Upload({ token, role: userRole }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [error, setError] = useState("");
  const [uploadHistory, setUploadHistory] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [clients, setClients] = useState([]);

  // Fetch history and clients when token or role changes
  React.useEffect(() => {
    console.log('useEffect - token:', token, 'role:', userRole);
    if (token) {
      console.log('Token exists, fetching history and clients...');
      fetchUploadHistory();
      if (userRole === 'admin') {
        console.log('User is admin, fetching clients...');
        fetchClients();
      } else {
        console.log('User is not admin, skipping client fetch');
      }
    } else {
      console.log('No token available');
    }
  }, [token, userRole]);

  const fetchClients = async () => {
    console.log('fetchClients called, role:', userRole);
    if (userRole !== 'admin') {
      console.log('Not an admin, skipping client fetch');
      return;
    }
    
    try {
      console.log('Fetching clients...');
      setLoadingClients(true);
      setError('');
      const response = await axios.get('/admin/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Clients fetched:', response.data);
      setClients(response.data);
      
      // Auto-select the first client if available
      if (response.data.length > 0) {
        console.log('Setting first client:', response.data[0]);
        setSelectedClient(response.data[0].id.toString());
      } else {
        console.log('No clients available');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      setError('Failed to fetch client list');
    } finally {
      setLoadingClients(false);
    }
  };

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

    if (userRole === 'admin' && !selectedClient) {
      setError("Please select a client for this upload");
      return;
    }

    if (!validateDateRange()) return;
    if (!validateFile(file)) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('start_date', format(startDate, 'yyyy-MM-dd'));
    formData.append('end_date', format(endDate, 'yyyy-MM-dd'));
    if (userRole === 'admin') {
      formData.append('client_id', selectedClient);
    }

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload File</h1>
        </div>
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center text-gray-900">Upload Excel File</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {userRole === 'admin' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Client
                  <span className="text-red-500 ml-1">*</span>
                </label>
                {loadingClients ? (
                  <div className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md bg-gray-100">
                    Loading clients...
                    <div className="text-xs text-gray-500 mt-1">Debug: {`loadingClients=${loadingClients}, clients.length=${clients.length}`}</div>
                  </div>
                ) : (
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    disabled={loadingClients || clients.length === 0}
                  >
                    {clients.length === 0 ? (
                      <option value="">No clients available</option>
                    ) : (
                      <>
                        <option value="">Select a client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                )}
                {clients.length === 0 && !loadingClients && (
                  <p className="mt-1 text-sm text-red-600">No clients found. Please add clients first.</p>
                )}
              </div>
            )}
            
            <div className="flex justify-center">
              <FileUpload
                onFileSelect={setFile}
                uploading={uploading}
                error={error}
              />
            </div>
            
            <div className="mt-6">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={uploading || !file || !startDate || !endDate || (userRole === 'admin' && (!selectedClient || clients.length === 0))}
                className="relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  'Upload File'
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Upload History</h2>
            <FileList files={uploadHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
