import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createTicketBasicInfo, getGroups, getTicketById } from '../../services/ticketService';

const CreateTicket = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId, ticketId: urlTicketId } = useParams(); // Extract both groupId and ticketId from params
  const queryTicketId = new URLSearchParams(location.search).get('ticketId'); // Also check query params
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  
  const [formData, setFormData] = useState({
    event_name: '',
    event_category: '',
    event_subcategory: '',
    event_type: 'public',
    location: '',
    venue: '',
    exact_map_location: {
      latitude: '12.9716',
      longitude: '12.9716',
      address: 'tedrgtgtrgtrg'
    },
    event_date_type: 'one-day',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    event_description: '',
    guests: [],
    groupId: groupId || ''
  });
  
  const [guestInput, setGuestInput] = useState({
    guest_name: '',
    guest_profile: '',
    guest_link: ''
  });

  // Helper function to format date for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Helper function to format time for input fields
  const formatTimeForInput = (timeString) => {
    if (!timeString) return '';
    // If it's already in HH:MM format, return as is
    if (/^\d{2}:\d{2}$/.test(timeString)) return timeString;
    // If it's a full datetime string, extract time
    const date = new Date(timeString);
    return date.toTimeString().slice(0, 5);
  };

  // Function to save form data to localStorage
  const saveFormDataToStorage = (data) => {
    const storageKey = `createTicket_${groupId}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  // Function to load form data from localStorage
  const loadFormDataFromStorage = () => {
    const storageKey = `createTicket_${groupId}`;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
        return null;
      }
    }
    return null;
  };

  // Function to clear form data from localStorage
  const clearFormDataFromStorage = () => {
    const storageKey = `createTicket_${groupId}`;
    localStorage.removeItem(storageKey);
  };

  // Load existing ticket data if ticketId is provided
  const loadExistingTicketData = async (ticketIdParam) => {
    try {
      console.log('Loading existing ticket data for ID:', ticketIdParam);
      console.log('ticketIdParam type:', typeof ticketIdParam);
      console.log('ticketIdParam length:', ticketIdParam?.length);
      
      // Validate ticketId before making API call
      if (!ticketIdParam || ticketIdParam.trim() === '') {
        console.error('Invalid ticketId provided:', ticketIdParam);
        return null;
      }

      // Make API call with detailed logging
      const ticketResponse = await getTicketById(ticketIdParam);
      console.log('Response keys:', Object.keys(ticketResponse || {}));
      // Try multiple ways to extract the data
      let ticketData = null;
      
      if (ticketResponse) {
        // Try different response structures
        ticketData = ticketResponse.data || 
                    ticketResponse.ticket || 
                    ticketResponse.result || 
                    (Array.isArray(ticketResponse) ? ticketResponse[0] : ticketResponse);
      }
      
      console.log('Extracted ticket data:', ticketData);
      
      if (!ticketData) {
        console.error('No ticket data found in response');
        // Try to load from localStorage as fallback
        const savedFormData = loadFormDataFromStorage();
        if (savedFormData) {
          console.log('Loading from localStorage as fallback');
          setFormData(savedFormData);
          return savedFormData;
        }
        return null;
      }

      console.log('Processing ticket data fields:');
      console.log('- event_name:', ticketData.event_name);
      console.log('- event_category:', ticketData.event_category);
      console.log('- location:', ticketData.location);
      console.log('- exact_map_location:', ticketData.exact_map_location);
      
      // Populate form with existing data
      const loadedData = {
        event_name: ticketData.event_name || ticketData.title || '',
        event_category: ticketData.event_category || ticketData.category || '',
        event_subcategory: ticketData.event_subcategory || ticketData.subcategory || '',
        event_type: ticketData.event_type || ticketData.type || 'public',
        location: ticketData.location || ticketData.event_location || '',
        venue: ticketData.venue || ticketData.event_venue || '',
        exact_map_location: {
          latitude: (ticketData.exact_map_location?.latitude || ticketData.latitude)?.toString() || '12.9716',
          longitude: (ticketData.exact_map_location?.longitude || ticketData.longitude)?.toString() || '12.9716',
          address: ticketData.exact_map_location?.address || ticketData.address || 'tedrgtgtrgtrg'
        },
        event_date_type: ticketData.event_date_type || ticketData.date_type || 'one-day',
        start_date: formatDateForInput(ticketData.start_date || ticketData.event_start_date),
        end_date: formatDateForInput(ticketData.end_date || ticketData.event_end_date),
        start_time: formatTimeForInput(ticketData.start_time || ticketData.event_start_time),
        end_time: formatTimeForInput(ticketData.end_time || ticketData.event_end_time),
        event_description: ticketData.event_description || ticketData.description || '',
        guests: ticketData.guests || ticketData.speakers || [],
        groupId: ticketData.groupId || ticketData.group_id || groupId || ''
      };
      
      console.log('Final loaded data:', loadedData);
      
      setFormData(loadedData);
      // Save to localStorage for persistence
      saveFormDataToStorage(loadedData);
      setIsEditMode(true);
      return ticketData;
    } catch (error) {
      console.error('Error loading existing ticket:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Try to load from localStorage as fallback
      const savedFormData = loadFormDataFromStorage();
      if (savedFormData) {
        console.log('Using localStorage data as fallback');
        setFormData(savedFormData);
        return savedFormData;
      }
      
      // If ticket doesn't exist, continue with empty form
      return null;
    }
  };

  // Initialize component and fetch groups
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setPageLoading(true);
        
        // Determine the current ticketId from multiple sources
        const currentTicketId = urlTicketId || // From URL params first
                               queryTicketId || // From query params second
                               location.state?.ticketId || // From navigation state third
                               localStorage.getItem('currentTicketId'); // From localStorage last
        
        console.log('Initializing with:');
        console.log('- groupId from URL params:', groupId);
        console.log('- urlTicketId from URL params:', urlTicketId);
        console.log('- queryTicketId from query:', queryTicketId);
        console.log('- final ticketId:', currentTicketId);
        console.log('- location.search:', location.search);
        console.log('- location.state:', location.state);

        // Use groupId from URL params (always required)
        if (!groupId) {
          alert('No group selected. Redirecting to home page.');
          navigate('/home');
          return;
        }
        
        // Fetch groups to populate the dropdown and validate the selected group
        const groupsResponse = await getGroups();
        const groupsArray = Array.isArray(groupsResponse) ? groupsResponse : groupsResponse.data || [];
        setGroups(groupsArray);

        // Find the selected group
        const selectedGroupData = groupsArray.find(group => group._id === groupId);
        if (selectedGroupData) {
          setSelectedGroup(selectedGroupData);
        } else {
          alert('Selected group not found. Redirecting to home page.');
          navigate('/home');
          return;
        }

        // Load existing ticket data if ticketId exists
        let loadedTicketData = null;
        if (currentTicketId && currentTicketId !== groupId) { // Make sure ticketId is not the same as groupId
          console.log('=== LOADING TICKET DATA ===');
          console.log('Current ticketId:', currentTicketId);
          console.log('GroupId:', groupId);
          console.log('TicketId !== GroupId?', currentTicketId !== groupId);
          
          loadedTicketData = await loadExistingTicketData(currentTicketId);
          
          if (loadedTicketData) {
            console.log('✅ Successfully loaded ticket data');
            // Store ticketId in localStorage for persistence across navigation
            localStorage.setItem('currentTicketId', currentTicketId);
            
            // Update URL to reflect the ticketId in params if not already there
            if (!urlTicketId) {
              const newUrl = `/ticket/create-event/${groupId}/${currentTicketId}`;
              console.log('Updating URL to include ticketId:', newUrl);
              window.history.replaceState({}, '', newUrl);
            }
          } else {
            console.log('❌ Failed to load ticket data, trying fallback methods');
            
            // Try localStorage as fallback
            const savedFormData = loadFormDataFromStorage();
            if (savedFormData) {
              console.log('📦 Loading saved form data from localStorage:', savedFormData);
              setFormData(prevData => ({
                ...savedFormData,
                groupId: groupId // Always ensure groupId is from URL
              }));
            }
          }
        } else {
          console.log('=== NO VALID TICKET ID FOUND ===');
          console.log('currentTicketId:', currentTicketId);
          console.log('groupId:', groupId);
          console.log('Reason: ', !currentTicketId ? 'No ticketId' : 'ticketId same as groupId');
          
          // If no valid ticketId, try to load from localStorage (for back navigation)
          const savedFormData = loadFormDataFromStorage();
          const savedTicketId = localStorage.getItem('currentTicketId');
          
          if (savedTicketId && savedTicketId !== groupId) {
            // If we have a saved ticketId, try to load that data and update URL
            console.log('Found saved ticketId, attempting to load:', savedTicketId);
            try {
              loadedTicketData = await loadExistingTicketData(savedTicketId);
              if (loadedTicketData) {
                // Update URL to include the saved ticketId
                const newUrl = `/ticket/create-event/${groupId}/${savedTicketId}`;
                console.log('Updating URL with saved ticketId:', newUrl);
                window.history.replaceState({}, '', newUrl);
              }
            } catch (error) {
              console.log('Could not load saved ticket, using localStorage form data');
              // If can't load saved ticket, fall back to localStorage form data
              if (savedFormData) {
                console.log('Loading saved form data from localStorage:', savedFormData);
                setFormData(prevData => ({
                  ...savedFormData,
                  groupId: groupId // Always ensure groupId is from URL
                }));
              }
            }
          } else if (savedFormData) {
            console.log('Loading saved form data from localStorage:', savedFormData);
            setFormData(prevData => ({
              ...savedFormData,
              groupId: groupId // Always ensure groupId is from URL
            }));
          } else {
            // Initialize with groupId if no saved data
            console.log('Initializing with empty form, groupId:', groupId);
            setFormData(prev => ({
              ...prev,
              groupId: groupId
            }));
          }
        }

      } catch (error) {
        console.error('Error initializing component:', error);
        alert('Error loading information. Please try again.');
        navigate('/home');
      } finally {
        setPageLoading(false);
      }
    };
    
    initializeComponent();
  }, [groupId, urlTicketId, queryTicketId, navigate, location.search, location.state, location.pathname]);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB5MQdwuxFIG6Msf_At0bV2vPXuFwEkVkI&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Setup Google Maps Autocomplete
  useEffect(() => {
    if (mapLoaded && autocompleteRef.current && !autocompleteRef.current._autocompleteSetup) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        autocompleteRef.current,
        {
          types: ['establishment', 'geocode'],
          fields: ['place_id', 'geometry', 'name', 'formatted_address']
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry) {
          console.log("No details available for input: '" + place.name + "'");
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address;

        const newFormData = {
          ...formData,
          location: place.name || address,
          exact_map_location: {
            latitude: lat.toString(),
            longitude: lng.toString(),
            address: address
          }
        };

        setFormData(newFormData);
        // Save updated data to localStorage
        saveFormDataToStorage(newFormData);

        // Update map if it exists
        if (mapRef.current) {
          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat, lng },
            zoom: 15
          });

          if (markerRef.current) {
            markerRef.current.setMap(null);
          }

          markerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: place.name || 'Selected Location'
          });
        }
      });
      
      // Mark as setup to prevent duplicate setup
      autocompleteRef.current._autocompleteSetup = true;
    }
  }, [mapLoaded, formData]);

  // Initialize map
  useEffect(() => {
    if (mapLoaded && mapRef.current && formData.exact_map_location.latitude && formData.exact_map_location.longitude) {
      const lat = parseFloat(formData.exact_map_location.latitude);
      const lng = parseFloat(formData.exact_map_location.longitude);

      // Only create map if coordinates are valid
      if (!isNaN(lat) && !isNaN(lng)) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 15
        });

        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        markerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: formData.location || 'Event Location'
        });
      }
    }
  }, [mapLoaded, formData.exact_map_location.latitude, formData.exact_map_location.longitude, formData.location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let newFormData;
    
    // Handle nested object for exact_map_location
    if (name.startsWith('map_')) {
      const field = name.replace('map_', '');
      newFormData = {
        ...formData,
        exact_map_location: {
          ...formData.exact_map_location,
          [field]: value
        }
      };
    } else {
      newFormData = {
        ...formData,
        [name]: value
      };
    }
    
    setFormData(newFormData);
    // Save to localStorage on every change
    saveFormDataToStorage(newFormData);
  };

  const handleGuestInputChange = (e) => {
    const { name, value } = e.target;
    setGuestInput(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addGuest = () => {
    if (guestInput.guest_name.trim()) {
      const newFormData = {
        ...formData,
        guests: [...formData.guests, { ...guestInput }]
      };
      
      setFormData(newFormData);
      // Save to localStorage
      saveFormDataToStorage(newFormData);
      
      setGuestInput({
        guest_name: '',
        guest_profile: '',
        guest_link: ''
      });
    }
  };

  const removeGuest = (index) => {
    const newFormData = {
      ...formData,
      guests: formData.guests.filter((_, i) => i !== index)
    };
    
    setFormData(newFormData);
    // Save to localStorage
    saveFormDataToStorage(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if groupId is present
    if (!formData.groupId) {
      alert('Group ID is missing. Please select a group first.');
      navigate('/select-group');
      return;
    }

    setLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        // Convert exact_map_location to proper format if coordinates are provided
        exact_map_location: (formData.exact_map_location.latitude && formData.exact_map_location.longitude) 
          ? {
              latitude: parseFloat(formData.exact_map_location.latitude),
              longitude: parseFloat(formData.exact_map_location.longitude),
              address: formData.exact_map_location.address
            }
          : formData.exact_map_location.address || '',
        // Ensure dates are in proper format
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : new Date(formData.start_date).toISOString()
      };

      console.log('Submitting data:', submitData);
      
      let response;
      if (isEditMode) {
        // If we're in edit mode, we might need an update API call
        // For now, we'll still use createTicketBasicInfo as it might handle updates
        response = await createTicketBasicInfo(submitData);
      } else {
        response = await createTicketBasicInfo(submitData);
      }
      
      console.log('Event created/updated:', response);
      
      // Store the ticketId for future navigation
      const newTicketId = response.ticketId || response.data?.ticketId || response.data?._id;
      if (newTicketId) {
        localStorage.setItem('currentTicketId', newTicketId);
      }
      // Don't clear form data yet - keep it for potential back navigation
      // Navigate to next step with both groupId and ticketId in URL path
      navigate(`/ticket/update-ticket-media/${response.ticketId}`, { 
        state: { 
          message: isEditMode ? 'Event updated successfully!' : 'Event created successfully!',
          newEvent: response.data,
          ticketId: response.ticketId
        }
      });
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cleanup when component unmounts or when user explicitly navigates away
  useEffect(() => {
    return () => {
      // Only clear storage if we're navigating to home or away from the flow
      const currentPath = window.location.pathname;
      if (currentPath === '/home' || currentPath === '/' || !currentPath.includes('/ticket/')) {
        clearFormDataFromStorage();
        localStorage.removeItem('currentTicketId');
      }
    };
  }, []);

  const eventCategories = [
    'Technology',
    'Conference',
    'Workshop',
    'Seminar',
    'Concert',
    'Festival',
    'Sports',
    'Exhibition',
    'Networking',
    'Other'
  ];

  const eventTypes = [
    'public',
    'private',
    'Exhibition',
    'Conference',
    'Workshop',
    'Seminar',
    'Concert',
    'Festival',
    'Sports Event',
    'Networking Event'
  ];

  // Show loading while initializing the page
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event information...</p>
        </div>
      </div>
    );
  }

  // Show error if no group is selected or found
  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Group Not Found</h3>
          <p className="text-gray-600 mb-6">The selected group could not be found or you don't have access to it.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  const handleBack = () => {
    // Clear the stored ticketId and form data when going back to home
    clearFormDataFromStorage();
    localStorage.removeItem('currentTicketId');
    navigate('/home');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="mb-6">
            <div className="header-actions">
              <button className="btn-back" onClick={handleBack}>
                  <span className="back-icon">←</span>
                  Back
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Event' : 'Create New Event'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEditMode ? 'Update the' : 'Fill in the basic'} information for your event under <span className="font-semibold text-blue-600">{selectedGroup.name || selectedGroup.group_name}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Group Display */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {(selectedGroup.name || selectedGroup.group_name || 'G').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {isEditMode ? 'Editing event under:' : 'Creating event under:'} {selectedGroup.name || selectedGroup.group_name}
                  </h3>
                  {selectedGroup.category && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mt-1">
                      {selectedGroup.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                name="event_name"
                value={formData.event_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter event name"
              />
            </div>

            {/* Event Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Category *
              </label>
              <select
                name="event_category"
                value={formData.event_category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {eventCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Subcategory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Subcategory
              </label>
              <input
                type="text"
                name="event_subcategory"
                value={formData.event_subcategory}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter subcategory (e.g., AI and Robotics)"
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type *
              </label>
              <select
                name="event_type"
                value={formData.event_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Location with Google Maps Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location * (Start typing to search)
              </label>
              <input
                ref={autocompleteRef}
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search for a location..."
              />
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue *
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter venue name (e.g., Hall B1)"
              />
            </div>

            {/* Map Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Map Location</h3>
              
              {/* Map Display */}
              {mapLoaded && (
                <div>
                  <div 
                    ref={mapRef}
                    className="w-full h-64 border border-gray-300 rounded-md"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="map_latitude"
                    value={formData.exact_map_location.latitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto-filled from location search"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="map_longitude"
                    value={formData.exact_map_location.longitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto-filled from location search"
                    readOnly
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address
                </label>
                <input
                  type="text"
                  name="map_address"
                  value={formData.exact_map_location.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-filled from location search"
                  readOnly
                />
              </div>
            </div>

            {/* Date Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Duration *
              </label>
              <select
                name="event_date_type"
                value={formData.event_date_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="one-day">One Day</option>
                <option value="multi-day">Multiple Days</option>
                <option value="specific-dates">Specific Dates</option>
              </select>
            </div>

            {/* Date and Time Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* End Date (only if multiple days) */}
              {formData.event_date_type === 'multi-day' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required={formData.event_date_type === 'multi-day'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Event Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Description *
              </label>
              <textarea
                name="event_description"
                value={formData.event_description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your event..."
              />
            </div>

            {/* Guests Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Add Guests (Optional)</h3>
              
              {/* Guest Input Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    name="guest_name"
                    value={guestInput.guest_name}
                    onChange={handleGuestInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Image URL
                  </label>
                  <input
                    type="url"
                    name="guest_profile"
                    value={guestInput.guest_profile}
                    onChange={handleGuestInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Social Link
                  </label>
                  <input
                    type="url"
                    name="guest_link"
                    value={guestInput.guest_link}
                    onChange={handleGuestInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>
                
                <div className="md:col-span-3">
                  <button
                    type="button"
                    onClick={addGuest}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Add Guest
                  </button>
                </div>
              </div>

              {/* Display Added Guests */}
              {formData.guests.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Added Guests:</h4>
                  {formData.guests.map((guest, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <span className="font-medium">{guest.guest_name}</span>
                        {guest.guest_link && <span className="text-sm text-gray-600 ml-2">({guest.guest_link})</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGuest(index)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default CreateTicket;
