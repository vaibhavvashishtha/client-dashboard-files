import React, { useState } from 'react';
import { format } from 'date-fns';

export default function FileUpload({ file, setFile, handleUpload, uploading, error }) {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700">
          Select File
        </label>
        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-2 text-center">
            <svg
              className="mx-auto h-8 w-8 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file"
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
              >
                <span>Upload a file</span>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => {
                    const selectedFile = e.target.files[0];
                    if (selectedFile) {
                      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
                      const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                          'application/vnd.ms-excel'];
                      
                      if (!allowedTypes.includes(selectedFile.type)) {
                        error("Please select an XLS or XLSX file");
                        return;
                      }
                      
                      if (selectedFile.size > maxSize) {
                        error("File size exceeds 100MB limit");
                        return;
                      }
                      
                      setFile(selectedFile);
                    }
                  }}
                  className="sr-only"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              XLS/XLSX files up to 100MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {error}
              </h3>
            </div>
          </div>
        </div>
      )}

      <div>
        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>
          ) : (
            <span>Upload File</span>
          )}
        </button>
      </div>

      {file && (
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {format(new Date(), 'MMM d, yyyy')}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}