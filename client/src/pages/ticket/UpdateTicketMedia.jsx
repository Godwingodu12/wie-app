import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { updateTicketMedia, getTicketById } from '../../services/ticketService';
import './UpdateTicketMedia.css';

const UpdateTicketMedia = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    event_logo: null,
    event_banner: null,
    event_images: []
  });
  
  const [previews, setPreviews] = useState({
    event_logo: null,
    event_banner: null,
    event_images: []
  });
  
  // Add state for existing media data
  const [existingMedia, setExistingMedia] = useState({
    event_logo: null,
    event_banner: null,
    event_images: []
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const logoRef = useRef(null);
  const bannerRef = useRef(null);
  const imagesRef = useRef(null);

  // Validate ticketId format
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Load existing ticket data
  const loadExistingTicketData = async () => {
    try {
      setInitialLoading(true);
      console.log('Loading ticket data for ID:', ticketId);

      // Make API call with detailed logging
      const ticketResponse = await getTicketById(ticketId);
      console.log('Full API Response:', ticketResponse);
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
        return;
      }

      // Extract media information from the ticket data
      const mediaData = {
        event_logo: ticketData.event_logo || null,
        event_banner: ticketData.event_banner || null,
        event_images: ticketData.event_images || []
      };

      console.log('Extracted media data:', mediaData);

      // Set existing media data
      setExistingMedia(mediaData);

      // Set previews for existing media (assuming these are URLs)
      const existingPreviews = {
        event_logo: mediaData.event_logo || null,
        event_banner: mediaData.event_banner || null,
        event_images: (mediaData.event_images || []).map((imageUrl, index) => ({
          file: { name: `Existing Image ${index + 1}`, type: 'image/jpeg' }, // Mock file object
          preview: imageUrl,
          isExisting: true
        }))
      };

      setPreviews(existingPreviews);

    } catch (error) {
      console.error('Error loading ticket data:', error);
      setErrors(prev => ({
        ...prev,
        general: 'Failed to load existing ticket data. Please refresh the page.'
      }));
    } finally {
      setInitialLoading(false);
    }
  };

  // Initial validation and data loading
  useEffect(() => {
    if (!ticketId || !isValidObjectId(ticketId)) {
      console.error('Invalid ticket ID format:', ticketId);
      navigate('/home'); // Redirect to tickets list or appropriate page
      return;
    }

    // Load existing ticket data
    loadExistingTicketData();
  }, [ticketId, navigate]);

  const validateFile = (file, type) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
    
    // Size validation (50MB for videos, 10MB for images)
    const maxSize = videoTypes.includes(file.type) ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size too large. Maximum ${videoTypes.includes(file.type) ? '50MB' : '10MB'} allowed.`;
    }
    
    // Type validation
    if (type === 'event_images') {
      if (!imageTypes.includes(file.type) && !videoTypes.includes(file.type)) {
        return 'Only images (JPG, PNG, GIF, WebP) and videos (MP4, AVI, MOV, etc.) are allowed for event images.';
      }
    } else if (type === 'event_logo' || type === 'event_banner') {
      if (!imageTypes.includes(file.type)) {
        return 'Only image files (JPG, PNG, GIF, WebP) are allowed for logo and banner.';
      }
    }
    
    return null;
  };

  const handleSingleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const error = validateFile(file, type);
    if (error) {
      setErrors(prev => ({ ...prev, [type]: error }));
      return;
    }
    
    setErrors(prev => ({ ...prev, [type]: null }));
    setFormData(prev => ({ ...prev, [type]: file }));
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews(prev => ({ ...prev, [type]: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleMultipleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Validate total count (max 10)
    if (files.length > 10) {
      setErrors(prev => ({ ...prev, event_images: 'Maximum 10 files allowed for event images.' }));
      return;
    }
    
    // Validate video count (max 1)
    const videoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
    const videoCount = files.filter(file => videoTypes.includes(file.type)).length;
    if (videoCount > 1) {
      setErrors(prev => ({ ...prev, event_images: 'Maximum 1 video allowed in event images.' }));
      return;
    }
    
    // Validate each file
    let hasError = false;
    for (const file of files) {
      const error = validateFile(file, 'event_images');
      if (error) {
        setErrors(prev => ({ ...prev, event_images: error }));
        hasError = true;
        break;
      }
    }
    
    if (hasError) return;
    
    setErrors(prev => ({ ...prev, event_images: null }));
    setFormData(prev => ({ ...prev, event_images: files }));
    
    // Create previews
    const previewPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ file, preview: e.target.result });
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(previewPromises).then(results => {
      setPreviews(prev => ({ ...prev, event_images: results }));
    });
  };

  const removeFile = (type, index = null) => {
    if (type === 'event_images' && index !== null) {
      const newFiles = [...formData.event_images];
      newFiles.splice(index, 1);
      setFormData(prev => ({ ...prev, event_images: newFiles }));
      
      const newPreviews = [...previews.event_images];
      newPreviews.splice(index, 1);
      setPreviews(prev => ({ ...prev, event_images: newPreviews }));
    } else {
      setFormData(prev => ({ ...prev, [type]: null }));
      setPreviews(prev => ({ ...prev, [type]: null }));
      
      // Reset file input
      if (type === 'event_logo') logoRef.current.value = '';
      if (type === 'event_banner') bannerRef.current.value = '';
    }
    
    setErrors(prev => ({ ...prev, [type]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate ticketId again before submission
    if (!ticketId || !isValidObjectId(ticketId)) {
      setErrors(prev => ({ 
        ...prev, 
        general: 'Invalid ticket ID. Please check the URL and try again.' 
      }));
      return;
    }
    
    // Check if at least one file is selected or if existing media exists
    const hasNewFiles = formData.event_logo || formData.event_banner || formData.event_images.length > 0;
    const hasExistingMedia = existingMedia.event_logo || existingMedia.event_banner || existingMedia.event_images.length > 0;
    
    if (!hasNewFiles && !hasExistingMedia) {
      setErrors(prev => ({ ...prev, general: 'Please select at least one file to upload.' }));
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const submitData = new FormData();
      if (formData.event_logo) {
        submitData.append('event_logo', formData.event_logo);
      }
      
      if (formData.event_banner) {
        submitData.append('event_banner', formData.event_banner);
      }
      formData.event_images.forEach(file => {
        submitData.append('event_images', file);
      });
      
      console.log('Submitting to ticketId:', ticketId);
      console.log('FormData entries:', Array.from(submitData.entries()));
      
      const response = await updateTicketMedia(ticketId, submitData);
      console.log('Upload response:', response);
      
      // Use the returned ticketId from response if available, otherwise use params
      const validTicketId = response?.ticketId || ticketId;
      navigate(`/ticket/update-ticket-details/${validTicketId}`);
    } catch (error) {
      console.error("Error updating ticket media:", error);
      let errorMessage = 'Failed to upload files. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors(prev => ({ 
        ...prev, 
        general: errorMessage
      }));
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while fetching initial data
  if (initialLoading) {
    return (
      <div className="update-ticket-media">
        <div className="container">
          <div className="loading-container">
            <p>Loading ticket data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="update-ticket-media">
      <div className="container">
        <h2>Update Ticket Media</h2>
        <p className="subtitle">Upload images and videos for your event</p>
        
        <form onSubmit={handleSubmit} className="media-form">
          {errors.general && (
            <div className="error-message general-error">{errors.general}</div>
          )}
          
          {/* Event Logo */}
          <div className="form-group">
            <label htmlFor="event_logo">Event Logo</label>
            <div className="file-info">
              <span className="limit">Maximum: 1 image • Max size: 10MB</span>
              <span className="formats">Formats: JPG, PNG, GIF, WebP</span>
            </div>
            <input
              ref={logoRef}
              type="file"
              id="event_logo"
              accept="image/*"
              onChange={(e) => handleSingleFileChange(e, 'event_logo')}
              className="file-input"
            />
            {errors.event_logo && (
              <div className="error-message">{errors.event_logo}</div>
            )}
            {previews.event_logo && (
              <div className="preview-container">
                <div className="preview-item">
                  <img src={previews.event_logo} alt="Event Logo Preview" />
                  <button
                    type="button"
                    onClick={() => removeFile('event_logo')}
                    className="remove-btn"
                  >
                    ×
                  </button>
                  {existingMedia.event_logo && !formData.event_logo && (
                    <div className="existing-label">Current Logo</div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Event Banner */}
          <div className="form-group">
            <label htmlFor="event_banner">Event Banner</label>
            <div className="file-info">
              <span className="limit">Maximum: 1 image • Max size: 10MB</span>
              <span className="formats">Formats: JPG, PNG, GIF, WebP</span>
            </div>
            <input
              ref={bannerRef}
              type="file"
              id="event_banner"
              accept="image/*"
              onChange={(e) => handleSingleFileChange(e, 'event_banner')}
              className="file-input"
            />
            {errors.event_banner && (
              <div className="error-message">{errors.event_banner}</div>
            )}
            {previews.event_banner && (
              <div className="preview-container">
                <div className="preview-item banner">
                  <img src={previews.event_banner} alt="Event Banner Preview" />
                  <button
                    type="button"
                    onClick={() => removeFile('event_banner')}
                    className="remove-btn"
                  >
                    ×
                  </button>
                  {existingMedia.event_banner && !formData.event_banner && (
                    <div className="existing-label">Current Banner</div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Event Images */}
          <div className="form-group">
            <label htmlFor="event_images">Event Images & Video</label>
            <div className="file-info">
              <span className="limit">Maximum: 10 files (9 images + 1 video) • Max size: 10MB per image, 50MB for video</span>
              <span className="formats">Images: JPG, PNG, GIF, WebP • Videos: MP4, AVI, MOV, WMV, FLV, WebM</span>
            </div>
            <input
              ref={imagesRef}
              type="file"
              id="event_images"
              multiple
              accept="image/*,video/*"
              onChange={handleMultipleFileChange}
              className="file-input"
            />
            {errors.event_images && (
              <div className="error-message">{errors.event_images}</div>
            )}
            {previews.event_images.length > 0 && (
              <div className="preview-container grid">
                {previews.event_images.map((item, index) => (
                  <div key={index} className="preview-item">
                    {item.file.type.startsWith('image/') || item.isExisting ? (
                      <img src={item.preview} alt={`Event Image ${index + 1}`} />
                    ) : (
                      <video src={item.preview} controls />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile('event_images', index)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                    <div className="file-name">{item.file.name}</div>
                    {item.isExisting && (
                      <div className="existing-label">Current Image</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={() => {
                if (ticketId && isValidObjectId(ticketId)) {
                  navigate(`/ticket/update-ticket-details/${ticketId}`);
                } else {
                  navigate('/home');
                }
              }}
              className="btn-secondary"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Uploading...' : 'Upload & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default UpdateTicketMedia;
