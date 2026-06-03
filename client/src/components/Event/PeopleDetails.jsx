import React, { useState, useEffect } from "react";
import { UserCheck, CheckSquare, Square, Settings, X, Plus, Trash2, Edit2, Check, FileText } from "lucide-react";
import ToggleSwitch from "../CreateGroup/ToggleSwitch.jsx";

const PeopleDetails = ({
  formData,
  setFormData,
  questionData,
  setQuestionData,
  questionDetails,
  setQuestionDetails,
  darkMode
}) => {
  const isObjectMode = !!formData;

  const currentQuestionData = isObjectMode ? (formData.question_data || false) : (questionData || false);
  const currentQuestionDetails = isObjectMode 
    ? (formData.question_details || { name: false, email: false, phone_number: false, position: false, custom_questions: [] })
    : (questionDetails || { name: false, email: false, phone_number: false, position: false, custom_questions: [] });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempDetails, setTempDetails] = useState({
    name: false,
    email: false,
    phone_number: false,
    position: false,
    custom_questions: []
  });

  const [showFieldForm, setShowFieldForm] = useState(false);
  const [isEditingFieldId, setIsEditingFieldId] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    label: "",
    type: "text",
    choices: "",
    required: false
  });

  // Keep draft in sync with parent when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setTempDetails({
        name: currentQuestionDetails.name || false,
        email: currentQuestionDetails.email || false,
        phone_number: currentQuestionDetails.phone_number || false,
        position: currentQuestionDetails.position || false,
        custom_questions: currentQuestionDetails.custom_questions
          ? [...currentQuestionDetails.custom_questions]
          : []
      });
      // Reset inline form
      setShowFieldForm(false);
      setIsEditingFieldId(null);
      setFieldForm({ label: "", type: "text", choices: "", required: false });
    }
  }, [isModalOpen]);

  const updateQuestionData = (val) => {
    if (isObjectMode) {
      setFormData((prev) => ({ ...prev, question_data: val }));
    } else {
      setQuestionData(val);
    }
  };

  const updateQuestionDetails = (updater) => {
    if (isObjectMode) {
      setFormData((prev) => {
        const prevDetails = prev.question_details || { name: false, email: false, phone_number: false, position: false, custom_questions: [] };
        const nextDetails = typeof updater === "function" ? updater(prevDetails) : updater;
        return {
          ...prev,
          question_details: nextDetails
        };
      });
    } else {
      setQuestionDetails(updater);
    }
  };

  const toggleTempStandardField = (field) => {
    setTempDetails((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveCustomField = () => {
    if (!fieldForm.label.trim()) return;

    const resolvedChoices = fieldForm.type === "select"
      ? fieldForm.choices.split(",").map(c => c.trim()).filter(Boolean)
      : [];

    const newField = {
      id: isEditingFieldId || Date.now().toString(),
      label: fieldForm.label.trim(),
      type: fieldForm.type,
      choices: resolvedChoices,
      required: !!fieldForm.required
    };

    setTempDetails((prev) => {
      const updatedQuestions = [...prev.custom_questions];
      if (isEditingFieldId) {
        const index = updatedQuestions.findIndex(q => q.id === isEditingFieldId);
        if (index > -1) {
          updatedQuestions[index] = newField;
        }
      } else {
        updatedQuestions.push(newField);
      }
      return {
        ...prev,
        custom_questions: updatedQuestions
      };
    });

    // Reset inline form
    setShowFieldForm(false);
    setIsEditingFieldId(null);
    setFieldForm({ label: "", type: "text", choices: "", required: false });
  };

  const handleEditCustomField = (field) => {
    setIsEditingFieldId(field.id);
    setFieldForm({
      label: field.label,
      type: field.type,
      choices: field.choices ? field.choices.join(", ") : "",
      required: field.required
    });
    setShowFieldForm(true);
  };

  const handleDeleteCustomField = (fieldId) => {
    setTempDetails((prev) => ({
      ...prev,
      custom_questions: prev.custom_questions.filter(q => q.id !== fieldId)
    }));
  };

  const handleApplyChanges = () => {
    updateQuestionDetails(tempDetails);
    setIsModalOpen(false);
  };

  const hasAnyFieldSelected = 
    currentQuestionDetails.name || 
    currentQuestionDetails.email || 
    currentQuestionDetails.phone_number || 
    currentQuestionDetails.position ||
    (currentQuestionDetails.custom_questions && currentQuestionDetails.custom_questions.length > 0);

  return (
    <div className="bg-white dark:bg-[#1E2124] p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-300">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.25s ease-out forwards;
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <label className="font-semibold text-gray-900 dark:text-white text-md">
              Collect customized attendee details?
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Enable this to prompt ticket buyers for specific personal details before they complete order checks.
            </p>
          </div>
        </div>
        <ToggleSwitch
          checked={currentQuestionData}
          onChange={() => updateQuestionData(!currentQuestionData)}
          darkMode={darkMode}
        />
      </div>

      {currentQuestionData && (
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/60 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Selected attendee details to collect
            </span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure Form</span>
            </button>
          </div>

          {hasAnyFieldSelected ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Standard suggestions summary */}
              {[
                { field: "name", label: "Full Name" },
                { field: "email", label: "Email Address" },
                { field: "phone_number", label: "Phone Number" },
                { field: "position", label: "Designation / Position" }
              ].map((item) => {
                if (!currentQuestionDetails[item.field]) return null;
                return (
                  <div key={item.field} className="flex items-center gap-2.5 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-indigo-950/10">
                    <CheckSquare className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{item.label}</span>
                      <span className="block text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">Standard</span>
                    </div>
                  </div>
                );
              })}

              {/* Custom fields summary */}
              {currentQuestionDetails.custom_questions && currentQuestionDetails.custom_questions.map((field) => (
                <div key={field.id} className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10">
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate block">{field.label}</span>
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate uppercase">
                      {field.type} • {field.required ? "Required" : "Optional"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No fields selected yet. Click "Configure Form" to add standard or custom questions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in transition-all duration-300">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#1E2124] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[85vh] animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  Configure Attendee Form
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1 max-h-[60vh]">
              
              {/* Section 1: Standard Suggestions */}
              <div>
                <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                  Suggested Fields (Standard)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { field: "name", label: "Full Name", description: "Collect attendee name" },
                    { field: "email", label: "Email Address", description: "Collect contact email" },
                    { field: "phone_number", label: "Phone Number", description: "Collect mobile number" },
                    { field: "position", label: "Designation / Position", description: "Collect job title or status" }
                  ].map((item) => {
                    const isChecked = tempDetails[item.field];
                    return (
                      <button
                        key={item.field}
                        type="button"
                        onClick={() => toggleTempStandardField(item.field)}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                          isChecked
                            ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm"
                            : "bg-gray-50 dark:bg-[#181A1C] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700"
                        }`}
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-500 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-sm block">{item.label}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-normal">
                            {item.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Custom Questions */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Custom Questions
                  </span>
                  {!showFieldForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingFieldId(null);
                        setFieldForm({ label: "", type: "text", choices: "", required: false });
                        setShowFieldForm(true);
                      }}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Field</span>
                    </button>
                  )}
                </div>

                {/* Inline custom field form */}
                {showFieldForm && (
                  <div className="mb-4 p-4 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10 dark:bg-emerald-950/5 rounded-xl space-y-4 animate-fade-in">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                      {isEditingFieldId ? "Edit Custom Question" : "Add Custom Question"}
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                          Question Label / Title
                        </label>
                        <input
                          type="text"
                          value={fieldForm.label}
                          onChange={(e) => setFieldForm(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="e.g. Food preference, T-shirt size"
                          className="w-full bg-white dark:bg-[#181A1C] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                          Input Type
                        </label>
                        <select
                          value={fieldForm.type}
                          onChange={(e) => setFieldForm(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full bg-white dark:bg-[#181A1C] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        >
                          <option value="text">Text Input</option>
                          <option value="textarea">Long Text / Paragraph</option>
                          <option value="number">Number</option>
                          <option value="select">Dropdown Select</option>
                          <option value="checkbox">Single Checkbox</option>
                        </select>
                      </div>
                    </div>

                    {fieldForm.type === "select" && (
                      <div className="animate-fade-in">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                          Choices (comma-separated list)
                        </label>
                        <input
                          type="text"
                          value={fieldForm.choices}
                          onChange={(e) => setFieldForm(prev => ({ ...prev, choices: e.target.value }))}
                          placeholder="e.g. Veg, Non-Veg, Vegan"
                          className="w-full bg-white dark:bg-[#181A1C] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                          Separate choices with commas. Attendees will choose one of these options from a dropdown.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800/80 pt-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldForm.required}
                          onChange={(e) => setFieldForm(prev => ({ ...prev, required: e.target.checked }))}
                          className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Mark as required question
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowFieldForm(false)}
                          className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-850"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCustomField}
                          disabled={!fieldForm.label.trim()}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Save Field
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* List of custom questions added */}
                {tempDetails.custom_questions && tempDetails.custom_questions.length > 0 ? (
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                    {tempDetails.custom_questions.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-3 border border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1A1C1E] rounded-xl hover:border-gray-200 dark:hover:border-gray-750 transition"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg mt-0.5 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-sm text-gray-900 dark:text-white truncate block">
                              {field.label}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase mt-0.5">
                              <span>{field.type}</span>
                              <span>•</span>
                              <span>{field.required ? "Required" : "Optional"}</span>
                              {field.choices && field.choices.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[150px] lowercase text-[9px] italic">
                                    {field.choices.length} options
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditCustomField(field)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-450 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomField(field.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !showFieldForm && (
                    <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-850 rounded-xl">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        No custom fields configured yet. Click "Add Custom Field" to get started.
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-end gap-3 bg-gray-50 dark:bg-[#1A1C1E] shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyChanges}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-md hover:shadow-indigo-500/20"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleDetails;
