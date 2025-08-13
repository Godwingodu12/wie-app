// D:\DEVELOP\wie\client\src\pages\ticket\UpdateTicketDetails.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';

const UpdateTicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Form states
  const [ticketTypes, setTicketTypes] = useState([]);
  const [guides, setGuides] = useState([]);

  const [ticketTypeInput, setTicketTypeInput] = useState('');
  const [guideInput, setGuideInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Add ticket type
  const addTicketType = () => {
    if (ticketTypeInput.trim()) {
      setTicketTypes([...ticketTypes, ticketTypeInput.trim()]);
      setTicketTypeInput('');
    }
  };

  // Remove ticket type
  const removeTicketType = (index) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  // Add guide
  const addGuide = () => {
    if (guideInput.trim()) {
      setGuides([...guides, guideInput.trim()]);
      setGuideInput('');
    }
  };

  // Remove guide
  const removeGuide = (index) => {
    setGuides(guides.filter((_, i) => i !== index));
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ticketId) {
      toast.error('Ticket ID is missing');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:5003/api/ticket/update-ticket-details',
        {
          ticketId,
          ticket_types: ticketTypes,
          guides,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      toast.success(res.data.message || 'Ticket details updated successfully');
      navigate(`/ticket/${ticketId}`); // Redirect to ticket page
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update ticket details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <h2>Update Ticket Details</h2>
      <form onSubmit={handleSubmit}>
        {/* Ticket Types */}
        <div>
          <label>Ticket Types</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              value={ticketTypeInput}
              onChange={(e) => setTicketTypeInput(e.target.value)}
              placeholder="Enter ticket type"
            />
            <button type="button" onClick={addTicketType}>
              Add
            </button>
          </div>
          <ul>
            {ticketTypes.map((type, index) => (
              <li key={index}>
                {type}{' '}
                <button type="button" onClick={() => removeTicketType(index)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Guides */}
        <div>
          <label>Guides</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              value={guideInput}
              onChange={(e) => setGuideInput(e.target.value)}
              placeholder="Enter guide"
            />
            <button type="button" onClick={addGuide}>
              Add
            </button>
          </div>
          <ul>
            {guides.map((guide, index) => (
              <li key={index}>
                {guide}{' '}
                <button type="button" onClick={() => removeGuide(index)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Ticket'}
        </button>
      </form>
    </div>
  );
};
export default UpdateTicketDetails;
