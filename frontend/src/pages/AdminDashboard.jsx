import React, { useState, useEffect } from 'react';
import axios from '../api';
import { format } from 'date-fns';
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function AdminDashboard({ token }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No token found. Please log in as an admin user.');
        return;
      }
      
      const response = await axios.get(`/files/debug/files`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('All files:', response.data);
      const { files, total_data } = response.data;
      console.log('Database files:', files);
      
      // Display more detailed information
      alert(`
        Database Statistics:
        - Total Files: ${total_data.total_files}
        - Files with Paths: ${total_data.files_with_paths}
        - Files without Paths: ${total_data.files_without_paths}
        - Unique Clients: ${total_data.unique_clients}
        - Unique Uploaders: ${total_data.unique_uploaders}
        
        Check browser console for detailed file list.
      `);
    } catch (error) {
      console.error('Error fetching all files:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(`Failed to fetch files: ${error.response.data.detail}`);
      } else {
        console.error('Network error:', error.message);
        alert('Failed to fetch files. Please try again.');
      }
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get('/admin/clients', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setClients(response.data);
        if (response.data.length > 0) {
          const firstClient = response.data[0];
          console.log('Setting first client:', firstClient);
          setSelectedClient(firstClient.id);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [token]);

  useEffect(() => {
    console.log('Selected client changed:', selectedClient);
    if (selectedClient) {
      setLoading(true);
      fetchClientFiles();
    }
  }, [selectedClient]);

  const fetchClientFiles = async () => {
    try {
      console.log('Fetching files for client:', selectedClient);
      const response = await axios.get(`/files/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          client_id: selectedClient === 'all' ? null : selectedClient
        }
      });
      console.log('Files response:', response.data);
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching client files:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(`Failed to fetch files: ${error.response.data.detail}`);
      } else {
        console.error('Network error:', error.message);
        alert('Failed to fetch files. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (file) => {
    try {
      // Create a new iframe to trigger the download
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/files/download/${file.id}?token=${encodeURIComponent(localStorage.getItem('token'))}&filename=${encodeURIComponent(file.filename)}`;
      document.body.appendChild(iframe);
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`/files/delete/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.msg === 'File deleted successfully') {
        // Refresh the file list
        fetchClientFiles();
        alert('File deleted successfully');
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div role="status">
          <svg className="animate-spin h-12 w-12 text-gray-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Client
          </label>
          <select
            id="client-select"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Select a client</option>
            <option value="all">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchAllFiles}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          title="List all files in database"
        >
          Debug Files
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Files</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {file.filename}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {file.client_name || 'No Client'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {file.uploaded_by}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(file.uploaded_at), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(file.start_date), 'MMM d, yyyy')} - {format(new Date(file.end_date), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(file)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
                      title="Download file"
                    >
                      <ArrowUpTrayIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
                      title="Delete file"
                    >
                      <TrashIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
