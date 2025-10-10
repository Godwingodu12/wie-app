import { useEffect, useState } from "react";

const CreateTicketModal = ({
  isOpen,
  onClose,
  onSave,
  onResetAll,
  editingTicket,
  existingTickets,
}) => {
  const [localTickets, setLocalTickets] = useState([]);
  const [ticketType, setTicketType] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [totalTickets, setTotalTickets] = useState("");
  const [ticketPhoto, setTicketPhoto] = useState(null);
  const [ticketPhotoPreview, setTicketPhotoPreview] = useState("");
  const [currentEditId, setCurrentEditId] = useState(null);
  useEffect(() => {
    if (isOpen) {
      setLocalTickets(existingTickets || []);
      if (editingTicket) {
        setTicketType(editingTicket.name);
        setTicketPrice(editingTicket.price);
        setTotalTickets(editingTicket.capacity);
        setTicketPhotoPreview(editingTicket.image);
        setTicketPhoto(editingTicket.photoFile || null);
        setCurrentEditId(editingTicket.id);
      } else {
        setCurrentEditId(null);
        setTicketType("");
        setTicketPrice("");
        setTotalTickets("");
        setTicketPhoto(null);
        setTicketPhotoPreview("");
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

    const ticketData = {
      name: ticketType,
      price: ticketPrice,
      capacity: totalTickets,
      image: ticketPhotoPreview || `https://i.pravatar.cc/150?u=${Date.now()}`,
      photoFile: ticketPhoto,
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
      <div className="bg-white dark:bg-[#2B2B2B] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentEditId ? "Edit Ticket" : "Create Ticket"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 text-3xl hover:text-gray-800 dark:hover:text-white transition"
          >
            &times;
          </button>
        </div>
        <hr className="border-gray-200 dark:border-gray-700" />

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
                className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-black dark:border-gray-700 rounded-md p-3"
              />

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Ticket price
                </label>
                <div className="flex items-center bg-gray-100 dark:bg-[#1c1c1f] border border-black dark:border-gray-700 rounded-md">
                  <span className="text-black dark:text-gray-400 pl-3">
                    INR
                  </span>
                  <input
                    type="number"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="Ticket price"
                    className="w-full bg-transparent p-3 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Total tickets
                </label>
                <input
                  type="number"
                  value={totalTickets}
                  onChange={(e) => setTotalTickets(e.target.value)}
                  placeholder="Total tickets available"
                  className="w-full bg-gray-100 dark:bg-[#1c1c1f] text-gray-900 dark:text-white border border-black dark:border-gray-700 rounded-md p-3"
                />
              </div>

              <div className="flex-grow flex flex-col">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Upload ticket photo
                </label>
                <div className="flex-grow mt-2 flex justify-center items-center rounded-lg border border-dashed border-black dark:border-gray-700 px-6 py-10 text-center">
                  <label
                    htmlFor="ticket-photo-upload"
                    className="cursor-pointer"
                  >
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 dark:text-black"
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
                    <p className="text-sm text-black dark:text-gray-400 mt-2">
                      browse your files
                    </p>
                    <p className="text-xs text-gray-400 dark:text-black mt-1">
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
            <div className="w-px bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>

            {/* Right Side */}
            <div className="w-1/2 space-y-3">
              {localTickets.length === 0 ? (
                <div className="text-center text-black pt-16">
                  No tickets added yet.
                </div>
              ) : (
                localTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-gray-100 dark:bg-[#363A3F] p-3 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={ticket.image}
                        alt={ticket.name}
                        className="w-16 h-16 rounded-md object-cover"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {`${ticket.name} - ₹${Number(
                            ticket.price
                          ).toLocaleString()}`}
                        </p>
                        <p className="text-xs text-black dark:text-gray-400">
                          Capacity: {ticket.capacity}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditing(ticket)}
                        className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Footer */}
        <div className="p-6 flex justify-end gap-4 flex-shrink-0">
          <button
            onClick={handleResetAll}
            className="px-6 py-2 bg-gray-200 dark:bg-[#363A3F] text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
          >
            Reset all
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-[#363A3F] text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
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