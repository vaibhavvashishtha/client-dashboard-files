import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Analytics from "./pages/Analytics";
import AdminDashboard from "./pages/AdminDashboard";
import { format } from "date-fns";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    // Reset logout modal state when token changes
    if (token) {
      setShowLogoutModal(false);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
  };

  if (!token) {
    return <Login setToken={setToken} setRole={setRole} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-primary-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link to="/dashboard" className="text-xl font-bold hover:text-white">
                    Client Dashboard
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {role === 'admin' && (
                    <>
                      <Link
                        to="/dashboard"
                        className="inline-flex items-center px-1 pt-1 border-b-2 border-primary-500 text-sm font-medium text-white"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/admin"
                        className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-white hover:border-primary-500 hover:text-white"
                      >
                        Admin Dashboard
                      </Link>
                      <Link
                        to="/analytics"
                        className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-white hover:border-primary-500 hover:text-white"
                      >
                        Analytics
                      </Link>
                    </>
                  )}
                  {role === "client" && (
                    <Link
                      to="/upload"
                      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-white hover:border-primary-500 hover:text-white"
                    >
                      Upload
                    </Link>
                  )}
                  {role === "admin" && (
                    <Link
                      to="/upload"
                      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-white hover:border-primary-500 hover:text-white"
                    >
                      Upload
                    </Link>
                  )}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/dashboard" element={<Dashboard token={token} role={role} />} />
            <Route path="/upload" element={<Upload token={token} role={role} />} />
            <Route path="/analytics" element={<Analytics token={token} role={role} />} />
            <Route path="/admin" element={<AdminDashboard token={token} role={role} />} />
            <Route path="/" element={<Dashboard token={token} role={role} />} />
          </Routes>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Confirm Logout
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to logout?
                    </p>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Logout
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLogoutModal(false)}
                      className="mt-3 inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
