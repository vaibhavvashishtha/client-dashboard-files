import React, { useEffect, useState } from 'react';
import axios from '../api';
import FileUpload from '../components/FileUpload';

export default function ManufacturerDashboard() {
  const [files, setFiles] = useState([]);
  const [quoteFile, setQuoteFile] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/manufacturer/consumption')
      .then(res => setFiles(res.data))
      .catch(() => setError('Failed to fetch files'));
  }, []);

  const uploadQuote = async () => {
    if (!quoteFile || !selectedId) {
      setError('Select file and processed ID');
      return;
    }
    const formData = new FormData();
    formData.append('file', quoteFile);
    formData.append('processed_file_id', selectedId);
    try {
      await axios.post('/manufacturer/quote', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setError('');
      alert('Quote uploaded');
    } catch {
      setError('Upload failed');
    }
  };

  const download = (id) => {
    window.open(`/manufacturer/download/${id}?token=${localStorage.getItem('token')}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manufacturer Dashboard</h1>
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
        <h2 className="text-lg font-semibold mb-2">Upload Quote</h2>
        <div className="mb-2">
          <label className="block text-sm">Processed File ID</label>
          <input value={selectedId} onChange={e => setSelectedId(e.target.value)} className="border rounded w-full" />
        </div>
        <FileUpload onFileSelect={setQuoteFile} uploading={false} error={''} />
        <button onClick={uploadQuote} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Upload</button>
      </div>
    </div>
  );
}
