import React, { useState, useEffect } from 'react';
import axios from '../api';
import { format } from 'date-fns';
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function AdminDashboard({ token }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

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
          setSelectedClient(response.data[0].id);
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
    if (selectedClient) {
      setLoading(true);
      fetchClientFiles();
    }
  }, [selectedClient]);

  const fetchClientFiles = async () => {
    try {
      const response = await axios.get(`/admin/files/client/${selectedClient}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching client files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      // Create a form element
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = `/files/download/${file.id}`;
      form.target = '_blank'; // Open in new tab

      // Create hidden input for token
      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token';
      tokenInput.value = localStorage.getItem('token');
      form.appendChild(tokenInput);

      // Create hidden input for filename
      const filenameInput = document.createElement('input');
      filenameInput.type = 'hidden';
      filenameInput.name = 'filename';
      filenameInput.value = file.filename;
      form.appendChild(filenameInput);

      // Append form to body and submit
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">Manage all client files and uploads</p>
      </div>

      <div className="mb-8">
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
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Files</h2>
        
        {files.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No files uploaded for this client</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
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
                          <ArrowDownTrayIcon className="h-5 w-5 mr-2" aria-hidden="true" />
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
        )}
      </div>
    </div>
  );
}
