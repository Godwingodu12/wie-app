// components/ViewSingleEvent/ActionCircleButton.jsx
import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ActionCircleButton = ({
  theme,
  type,

  ticketId,
  groupId,
  subEventId,

  onClick,
  setAppAlert,
}) => {
  const navigate = useNavigate();

  const Icon = type === "edit" ? Pencil : Trash2;
  const bgColor = "#5E5CE6";
  const iconColor = "white";

  const handleAction = () => {
    if (type === "edit") {
      if (subEventId) {
        console.log("Navigating to Add-Ons with ticketId:", ticketId);
        navigate(`/ticket/update-ticket-addons/${ticketId}`);
      } else if (groupId) {
        navigate(`/ticket/create-event/${groupId}/${ticketId}`);
      } else {
        setAppAlert({
          message: "Cannot edit",
          description: "Group ID  is missing..",
          type: "error",
          show: true,
        });
      }
    } else if (type == "delete") {
      onClick();
    } else if (type == "save") {
      onClick();
    }
  };

  return (
    <div
      className="flex flex-col items-center cursor-pointer space-y-2 transition-transform duration-200 hover:scale-[1.02]"
      onClick={handleAction}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: bgColor,
          boxShadow: theme.shadowOutset, // Outer shadow for floating effect
        }}
      >
        <Icon size={20} color={iconColor} />
      </div>
    </div>
  );
};
export default ActionCircleButton;