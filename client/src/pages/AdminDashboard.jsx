import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getAllUsers, blockUser, unblockUser } from '../services/adminService';
import Modal from '../components/Modal';
import AdminLayout from '../layouts/AdminLayout';

const AdminDashboard = () => {
  const { token } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null); // { userId, action }

  const fetchUsers = async () => {
    const res = await getAllUsers();
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const confirmAction = async () => {
    if (modal?.action === 'block') {
      await blockUser(modal.userId);
    } else {
      await unblockUser(modal.userId);
    }
    setModal(null);
    fetchUsers();
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-blue-800 mb-6">Admin Dashboard</h1>
      <table className="w-full bg-white rounded shadow text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-b">
              <td className="p-3">{user.name}</td>
              <td className="p-3">{user.email}</td>
              <td className="p-3">{user.role}</td>
              <td className="p-3">{user.isBlocked ? 'Blocked' : 'Active'}</td>
              <td className="p-3">
                {user.role !== 'admin' && (
                  <button
                    onClick={() => setModal({ userId: user._id, action: user.isBlocked ? 'unblock' : 'block' })}
                    className={`px-3 py-1 rounded text-white ${user.isBlocked ? 'bg-green-500' : 'bg-red-500'}`}
                  >
                    {user.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <Modal
          title={`${modal.action === 'block' ? 'Block' : 'Unblock'} User`}
          message={`Are you sure you want to ${modal.action} this user?`}
          onConfirm={confirmAction}
          onCancel={() => setModal(null)}
        />
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;

