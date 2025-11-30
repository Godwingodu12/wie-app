// In a NEW file: src/pages/SelectGroupPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroups } from '../../services/ticketService';
import GroupSelectionModal from './GroupSelectionModal';

const SelectGroupPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. This page fetches the groups
    getGroups()
      .then(userGroups => {
        setGroups(userGroups || []); // Store the fetched groups
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch groups:", err);
        setLoading(false);
        navigate('/dashboard'); // Go somewhere safe if it fails
      });
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator
  }

  // 2. Once data is fetched, it renders YOUR modal with that data
  return (
    <GroupSelectionModal
      isOpen={true}
      groups={groups}
      onClose={() => navigate('/dashboard')}
      onSelectGroup={() => { /* Navigation is in the modal */ }}
    />
  );
};

export default SelectGroupPage;