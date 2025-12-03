import React, { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import WieLogo from "../../assets/Event/WieLogo.svg";
import BankIcon from "../../assets/Event/BankIcon.svg";
import InfoIcon from "../../assets/Event/InfoIcon.svg";
import MediaIcon from "../../assets/Event/MediaIcon.svg";
import NoteIcon from "../../assets/Event/NoteIcon.svg";
import OrgIcon from "../../assets/Event/OrgIcon.svg";
import PreviewIcon from "../../assets/Event/PreviewIcon.svg";
import TcIcon from "../../assets/Event/T&cIcon.svg";
import BackIcon from "../../assets/Event/BackIcon.svg";

// BackButton component (no change)
const BackButton = ({ onClick, isDarkMode }) => (
  <button onClick={onClick} className="rounded-full transition-colors">
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{
        backgroundColor: isDarkMode ? "#363A3F" : "#F3F4F6",
        boxShadow: isDarkMode
          ? "inset 1px 1px 2px #1e2022, inset -1px -1px 2px #4e545c"
          : "inset 1px 1px 2px #d1d5db, inset -1px -1px 2px #ffffff",
      }}
    >
      <img
        src={BackIcon}
        alt="Back"
        className={`w-3 h-3 ${!isDarkMode ? "filter invert" : ""}`}
      />
    </div>
  </button>
);

const EventSidebar = ({
  darkMode = false,
  formProgress = null,
  ticketId,
  groupId,
  onBackClick,
  check,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { navigationSteps } = useMemo(() => {
    // Logic to determine if the Add Shows flow should be included
    const hasCompletedAddOnStep = formProgress?.add_on_events === true;
    // Check if the user is currently editing a step equal to or past the Media step (Step 3)
    const isOnAddOnRoute = location.pathname.includes("/update-ticket-addons/");

    const isAddOnFlowActive = hasCompletedAddOnStep || isOnAddOnRoute;
    const useAddOnFlow = isAddOnFlowActive;
    let steps = [
      {
        id: 1,
        name: "Group creation",
        icon: OrgIcon,
        route: groupId
          ? `/ticket/create-group/${groupId}`
          : "/ticket/create-group",
      },
      {
        id: 2,
        name: "Basic information",
        icon: InfoIcon,
        route:
          ticketId && groupId
            ? `/ticket/create-event/${groupId}/${ticketId}`
            : groupId
            ? `/ticket/create-event/${groupId}`
            : "#",
      },
      {
        id: 3,
        name: "Media",
        icon: MediaIcon,
        route: ticketId ? `/ticket/update-ticket-media/${ticketId}` : "#",
      },
      {
        id: 4,
        name: "Banking & tickets",
        icon: BankIcon,
        route: ticketId ? `/ticket/update-ticket-details/${ticketId}` : "#",
      },
    ];

    if (useAddOnFlow) {
      steps.push({
        id: 5,
        name: "Add shows",
        icon: NoteIcon,
        route: ticketId ? `/ticket/update-ticket-addons/${ticketId}` : "#",
      });
    }

    const termsId = steps.length + 1;

    steps.push({
      id: termsId,
      name: "Terms & conditions",
      icon: TcIcon,
      route: ticketId ? `/ticket/ticket-terms/${ticketId}` : "#",
    });

    return { isAddShowFlow: useAddOnFlow, navigationSteps: steps };
  }, [formProgress, ticketId, groupId, check, location.pathname]);

  const { currentStep, completedSteps } = useMemo(() => {
    let activeStep = 1;

    [...navigationSteps].reverse().forEach((step) => {
      const baseRoute = step.route.split("/:")[0];
      if (location.pathname.startsWith(baseRoute) && baseRoute !== "#") {
        if (
          activeStep === 1 ||
          baseRoute.length >
            navigationSteps[activeStep - 1]?.route.split("/:")[0].length
        ) {
          activeStep = step.id;
        }
      }
    });

    const addShowsStep = navigationSteps.find(
      (step) => step.name === "Add shows"
    );
    const termsStep = navigationSteps.find(
      (step) => step.name === "Terms & conditions"
    );

    const completed = {
      1: !!groupId,
      2: formProgress?.basic_info || false,
      3: formProgress?.media || false,
      4: formProgress?.banking_tickets || false,
    };

    // Dynamically map completion status for Add Shows and Terms
    if (addShowsStep) {
      completed[addShowsStep.id] = formProgress?.add_on_events || false;
    }
    if (termsStep) {
      completed[termsStep.id] = formProgress?.terms_conditions || false;
    }

    return { currentStep: activeStep, completedSteps: completed };
  }, [location.pathname, formProgress, navigationSteps, groupId]);

  const handleBack = onBackClick || (() => navigate(-1));

  const totalSteps = navigationSteps.length;
  let progress = 0;

  const finalStepId = navigationSteps[totalSteps - 1]?.id;

  if (completedSteps[finalStepId]) {
    progress = 100;
  } else {
    const activeStepIndex = navigationSteps.findIndex(
      (step) => step.id === currentStep
    );
    // Ensure index is valid before calculating progress
    if (activeStepIndex !== -1) {
      progress = Math.round((activeStepIndex / totalSteps) * 100);
    }
  }

  const circumference = 2 * Math.PI * 50;
  const progressOffset = circumference * (1 - progress / 100);

  return (
    <div
      className={`hidden lg:flex w-[300px] p-6 flex-col transition-colors duration-300 sticky top-0 h-screen overflow-y-auto main-scrollbar ${
        darkMode ? "bg-[#010101]" : "bg-[#F5F5F5]"
      }`}
    >
      {/* --- Header & Back Button --- */}
      <div className="flex items-center space-x-2 mb-8">
        <img src={WieLogo} alt="Wie Logo" className="w-10 h-10" />
      </div>
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <BackButton onClick={handleBack} isDarkMode={darkMode} />
          <span
            className={`font-bold text-lg ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Create a new event
          </span>
        </div>
      </div>

      {/* --- Progress Circle --- */}
      <div className="mb-8 flex justify-center">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="50"
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
              className={darkMode ? "text-gray-700" : "text-gray-200"}
            />
            <circle
              cx="56"
              cy="56"
              r="50"
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              className={`${
                darkMode ? "text-[#3EB489]" : "text-[#3EB489]"
              } transition-all duration-500`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-lg font-bold ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              {progress}%
            </span>
            <span
              className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              completed
            </span>
          </div>
        </div>
      </div>

      {/* --- Navigation Steps --- */}
      <nav className="space-y-2">
        {navigationSteps.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps[step.id];
          const stepIndex = navigationSteps.findIndex((s) => s.id === step.id);
          const isPreviousCompleted =
            step.id === 1
              ? true
              : completedSteps[navigationSteps[stepIndex - 1].id];

          const isAllowed = step.id === 1 || isCompleted || isPreviousCompleted;
          const hasRoute = step.route !== "#";
          const isStepOne = step.id === 1;
          const isInteractive =
            !isStepOne && isAllowed && hasRoute && currentStep !== step.id;
          return (
            <div
              key={step.id}
              className={`flex items-center justify-between -mx-6 px-6 py-3 rounded-lg transition-colors ${
                isInteractive
                  ? darkMode
                    ? "hover:bg-gray-800 cursor-pointer"
                    : "hover:bg-gray-100 cursor-pointer"
                  : "cursor-not-allowed opacity-60"
              } ${
                isActive ? (darkMode ? "bg-gray-800" : "bg-[#00000033]") : ""
              }`}
              onClick={() => {
                if (isInteractive) navigate(step.route);
              }}
            >
              <div className="flex items-center space-x-4">
                <img
                  src={step.icon}
                  alt="Step Icon"
                  className={`w-5 h-5 ${
                    isActive || isCompleted
                      ? "filter-green"
                      : darkMode
                      ? "opacity-30"
                      : "filter-gray-900"
                  }`}
                />
                <span
                  className={`font-medium text-sm ${
                    isActive || isCompleted
                      ? darkMode
                        ? "text-[#3EB489]"
                        : "text-[#3EB489]"
                      : darkMode
                      ? "text-gray-500"
                      : "text-gray-400"
                  }`}
                >
                  {step.name}
                </span>
              </div>
              <div
                className={`flex items-center rounded-full w-8 h-8 justify-center ${
                  isActive
                    ? darkMode
                      ? "bg-[#3EB489]"
                      : "bg-[#3EB489]"
                    : isCompleted
                    ? darkMode
                      ? "bg-gray-700"
                      : "bg-green-100"
                    : darkMode
                    ? "bg-gray-800"
                    : "bg-gray-200"
                }`}
              >
                <img
                  src={step.icon}
                  alt={step.name}
                  className={`w-4 h-4 ${
                    isActive
                      ? "filter brightness-0 invert"
                      : isCompleted
                      ? darkMode
                        ? "filter-green"
                        : "filter-green-dark"
                      : darkMode
                      ? "opacity-100"
                      : "filter-gray-900"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </nav>
      <style>{`
            .filter-green { filter: invert(58%) sepia(56%) saturate(543%) hue-rotate(88deg) brightness(99%) contrast(92%); }
            .filter-green-dark { filter: invert(34%) sepia(27%) saturate(1637%) hue-rotate(89deg) brightness(97%) contrast(91%); }
            .filter-gray-900 { filter: invert(10%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%); }
         `}</style>
    </div>
  );
};
export default EventSidebar;
