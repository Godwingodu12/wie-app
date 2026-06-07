import React from 'react';
import { Link } from 'react-router-dom';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <Link to="/" className="text-sm underline">Back to Home</Link>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
};
export default AdminLayout;