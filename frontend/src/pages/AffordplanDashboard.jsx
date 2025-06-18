import React, { useEffect, useState } from 'react';
import axios from '../api';
import FileUpload from '../components/FileUpload';

export default function AffordplanDashboard() {
  const [files, setFiles] = useState([]);
  const [procFile, setProcFile] = useState(null);
  const [hospitalFileId, setHospitalFileId] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/affordplan/hospital-uploads')
      .then(res => setFiles(res.data))
      .catch(() => setError('Failed to fetch uploads'));
  }, []);

  const handleProcessedUpload = async () => {
    if (!procFile || !hospitalFileId || !manufacturerId) {
      setError('All fields required');
      return;
    }
    const formData = new FormData();
    formData.append('file', procFile);
    formData.append('hospital_file_id', hospitalFileId);
    formData.append('manufacturer_id', manufacturerId);
    try {
      await axios.post('/affordplan/processed', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setError('');
      alert('Processed file uploaded');
    } catch (e) {
      setError('Upload failed');
    }
  };

  const download = (id) => {
    window.open(`/affordplan/download/${id}?token=${localStorage.getItem('token')}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Affordplan Dashboard</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <table className="min-w-full divide-y divide-gray-200 mb-4">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map(f => (
            <tr key={f.id}>
              <td className="px-6 py-4 whitespace-nowrap">{f.id}</td>
              <td className="px-6 py-4 whitespace-nowrap">{f.filename}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onClick={() => download(f.id)} className="text-indigo-600 hover:text-indigo-900">Download</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Upload Processed File</h2>
        <div className="mb-2">
          <label className="block text-sm">Hospital File ID</label>
          <input value={hospitalFileId} onChange={e => setHospitalFileId(e.target.value)} className="border rounded w-full" />
        </div>
        <div className="mb-2">
          <label className="block text-sm">Manufacturer ID</label>
          <input value={manufacturerId} onChange={e => setManufacturerId(e.target.value)} className="border rounded w-full" />
        </div>
        <FileUpload onFileSelect={setProcFile} uploading={false} error={''} />
        <button onClick={handleProcessedUpload} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Upload</button>
      </div>
    </div>
  );
}
