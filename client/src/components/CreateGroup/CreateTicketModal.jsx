import { useEffect, useState } from "react";
const CreateTicketModal = ({
  isOpen,
  onClose,
  onSave,
  onResetAll,
  editingTicket,
  existingTickets,
  darkMode, // ADD THIS PROP
}) => {
  const [localTickets, setLocalTickets] = useState([]);
  const [ticketType, setTicketType] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [totalTickets, setTotalTickets] = useState("");
  const [ticketPhoto, setTicketPhoto] = useState(null);
  const [ticketPhotoPreview, setTicketPhotoPreview] = useState("");
  const [currentEditId, setCurrentEditId] = useState(null);
  const [existingPhotoPath, setExistingPhotoPath] = useState("");

useEffect(() => {
  if (isOpen) {
    setLocalTickets(existingTickets || []);
    if (editingTicket) {
      setTicketType(editingTicket.name);
      setTicketPrice(editingTicket.price);
      setTotalTickets(editingTicket.capacity);
      setTicketPhotoPreview(editingTicket.image);
      setTicketPhoto(editingTicket.photoFile || null);
      setExistingPhotoPath(editingTicket.existingPhotoPath || ""); // ADD THIS
      setCurrentEditId(editingTicket.id);
    } else {
      setCurrentEditId(null);
      setTicketType("");
      setTicketPrice("");
      setTotalTickets("");
      setTicketPhoto(null);
      setTicketPhotoPreview("");
      setExistingPhotoPath(""); // ADD THIS
    }
  }
}, [editingTicket, existingTickets, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setTicketPhoto(file);
      setTicketPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddOrUpdateTicket = () => {
  if (!ticketType || !ticketPrice || !totalTickets) {
    alert(
      "Please fill in all ticket details: Type, Price, and Total Tickets."
    );
    return;
  }

  // Generate a default image if none provided
  const defaultImage = ticketPhotoPreview || `https://via.placeholder.com/150?text=${encodeURIComponent(ticketType)}`;

  const ticketData = {
    name: ticketType,
    price: ticketPrice,
    capacity: totalTickets,
    image: defaultImage,
    photoFile: ticketPhoto, // New file (if uploaded)
    existingPhotoPath: ticketPhoto ? '' : existingPhotoPath, // Keep existing if no new file
  };

  if (currentEditId) {
    const updatedList = localTickets.map((t) =>
      t.id === currentEditId ? { ...ticketData, id: currentEditId } : t
    );
    setLocalTickets(updatedList);
  } else {
    setLocalTickets([...localTickets, { ...ticketData, id: Date.now() }]);
  }

  setCurrentEditId(null);
  setTicketType("");
  setTicketPrice("");
  setTotalTickets("");
  setTicketPhoto(null);
  setTicketPhotoPreview("");
  setExistingPhotoPath("");
};

  const handleDeleteTicket = (ticketIdToDelete) =>
    setLocalTickets(localTickets.filter((t) => t.id !== ticketIdToDelete));

  const startEditing = (ticket) => {
    setCurrentEditId(ticket.id);
    setTicketType(ticket.name);
    setTicketPrice(ticket.price);
    setTotalTickets(ticket.capacity);
    setTicketPhotoPreview(ticket.image);
    setTicketPhoto(ticket.photoFile || null);
    setExistingPhotoPath(ticket.existingPhotoPath || "");
  };

  const handleSave = () => {
    onSave(localTickets);
    onClose();
  };

  const handleResetAll = () => {
    setLocalTickets([]);
    setCurrentEditId(null);
    setTicketType("");
    setTicketPrice("");
    setTotalTickets("");
    setTicketPhoto(null);
    setTicketPhotoPreview("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col ${
        darkMode ? 'bg-[#2B2B2B]' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="p-6 flex justify-between items-center flex-shrink-0">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {currentEditId ? "Edit Ticket" : "Create Ticket"}
          </h2>
          <button
            onClick={onClose}
            className={`text-3xl transition ${
              darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-800'
            }`}
          >
            &times;
          </button>
        </div>
        <hr className={darkMode ? 'border-gray-700' : 'border-gray-200'} />

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6">
          <div className="flex gap-6">
            {/* Left Side */}
            <div className="w-1/2 space-y-5 flex flex-col">
              <input
                type="text"
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value)}
                placeholder="e.g. VIP, General Admission"
                className={`w-full rounded-md p-3 border ${
                  darkMode 
                    ? 'bg-[#1c1c1f] text-white border-gray-700' 
                    : 'bg-gray-100 text-gray-900 border-black'
                }`}
              />

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Ticket price
                </label>
                <div className={`flex items-center rounded-md border ${
                  darkMode 
                    ? 'bg-[#1c1c1f] border-gray-700' 
                    : 'bg-gray-100 border-black'
                }`}>
                  <input
                    type="number"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="Ticket price"
                    className={`w-full bg-transparent p-3 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total tickets
                </label>
                <input
                  type="number"
                  value={totalTickets}
                  onChange={(e) => setTotalTickets(e.target.value)}
                  placeholder="Total tickets available"
                  className={`w-full rounded-md p-3 border ${
                    darkMode 
                      ? 'bg-[#1c1c1f] text-white border-gray-700' 
                      : 'bg-gray-100 text-gray-900 border-black'
                  }`}
                />
              </div>

              <div className="flex-grow flex flex-col">
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Upload ticket photo
                </label>
                <div className={`flex-grow mt-2 flex justify-center items-center rounded-lg border border-dashed px-6 py-10 text-center ${
                  darkMode ? 'border-gray-700' : 'border-black'
                }`}>
                  <label htmlFor="ticket-photo-upload" className="cursor-pointer">
                    <svg
                      className={`mx-auto h-12 w-12 ${
                        darkMode ? 'text-gray-400' : 'text-gray-400'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <p className={`text-sm mt-2 ${
                      darkMode ? 'text-gray-400' : 'text-black'
                    }`}>
                      browse your files
                    </p>
                    <p className={`text-xs mt-1 ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      Max 10 MB files are allowed
                    </p>
                    <span className="mt-4 inline-block rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm">
                      Browse file
                    </span>
                    <input
                      id="ticket-photo-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex-shrink-0">
                <button
                  onClick={handleAddOrUpdateTicket}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition w-full"
                >
                  {currentEditId ? "Update Ticket" : "+ Add Ticket"}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className={`w-px flex-shrink-0 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>

            {/* Right Side */}
            <div className="w-1/2 space-y-3">
              {localTickets.length === 0 ? (
                <div className={`text-center pt-16 ${
                  darkMode ? 'text-gray-400' : 'text-black'
                }`}>
                  No tickets added yet.
                </div>
              ) : (
                localTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      darkMode ? 'bg-[#363A3F]' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={ticket.image}
                        alt={ticket.name}
                        className="w-16 h-16 rounded-md object-cover"
                      />
                      <div>
                        <p className={`font-semibold ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {`${ticket.name} - ₹${Number(ticket.price).toLocaleString()}`}
                        </p>
                        <p className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-black'
                        }`}>
                          Capacity: {ticket.capacity}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditing(ticket)}
                        className={`transition ${
                          darkMode 
                            ? 'text-gray-400 hover:text-white' 
                            : 'text-gray-400 hover:text-gray-800'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <hr className={darkMode ? 'border-gray-700' : 'border-gray-200'} />

        {/* Footer */}
        <div className="p-6 flex justify-end gap-4 flex-shrink-0">
          <button
            onClick={handleResetAll}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              darkMode 
                ? 'bg-[#363A3F] text-white hover:bg-gray-700' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Reset all
          </button>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              darkMode 
                ? 'bg-[#363A3F] text-white hover:bg-gray-700' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;
