import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Hash,
  User,
  ShieldAlert,
  Send,
  Navigation,
  XCircle
} from 'lucide-react';
import { createCitizenReport } from '../api';

const INITIAL_FORM_STATE = {
  rawText: '',
  city: '',
  state: '',
  latitude: '',
  longitude: '',
  imageUrl: '',
  hashtags: '',
  sourceHandle: 'citizen_web'
};

const formatPercent = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  const pct = value <= 1 ? Math.round(value * 100) : Math.round(value);
  return `${pct}%`;
};

const extractGeminiReason = (err) => {
  const data = err?.response?.data;
  if (data?.reason && String(data.reason).trim()) {
    return String(data.reason).trim();
  }
  if (data?.message && String(data.message).trim()) {
    return String(data.message).trim();
  }
  return 'This report was rejected as not a genuine weather incident.';
};

export const CitizenReportModal = ({ isOpen, onClose, onAccepted, onRejected }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear inline error when user edits field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Browser Geolocation integration
  const handleGetLocation = () => {
    setLocationError(null);
    setLocationSuccess(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
        setErrors((prev) => ({ ...prev, latitude: null, longitude: null }));
        setIsLocating(false);
        setLocationSuccess(true);
        setTimeout(() => setLocationSuccess(false), 4000);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Unable to retrieve location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You can manually enter city/state.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        setLocationError(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Parse hashtags into array format expected by backend DTO: ["#Tag1", "#Tag2"]
  const normalizeHashtags = (input) => {
    if (!input || !input.trim()) return [];
    return input
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
  };

  // Basic URL validation helper
  const isValidUrl = (string) => {
    if (!string || !string.trim()) return true;
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Form validation before submitting
  const validateForm = () => {
    const newErrors = {};

    if (!formData.rawText.trim()) {
      newErrors.rawText = 'Incident description is required.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City name is required.';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State name is required.';
    }

    if (formData.latitude !== '' && formData.latitude !== null && formData.latitude !== undefined) {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be a valid number between -90 and 90.';
      }
    }

    if (formData.longitude !== '' && formData.longitude !== null && formData.longitude !== undefined) {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitude must be a valid number between -180 and 180.';
      }
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid HTTP or HTTPS image URL.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const payload = {
      rawText: formData.rawText.trim(),
      imageUrl: formData.imageUrl.trim() || null,
      city: formData.city.trim(),
      state: formData.state.trim(),
      latitude: formData.latitude !== '' ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude !== '' ? parseFloat(formData.longitude) : null,
      hashtags: normalizeHashtags(formData.hashtags),
      sourceHandle: formData.sourceHandle.trim() || 'citizen_web',
      sourceType: 'CITIZEN'
    };

    try {
      const response = await createCitizenReport(payload);
      if (response?.isValid === false || response?.verificationStatus === 'REJECTED') {
        const reason = response?.reason || 'This report was rejected as not a genuine weather incident.';
        setRejectionReason(reason);
        onRejected?.(reason);
        return;
      }
      setSubmittedReport(response || payload);
      onAccepted?.(response);
    } catch (err) {
      console.error('Failed to submit citizen report:', err);
      const status = err.response && err.response.status;
      if (status === 422) {
        const reason = extractGeminiReason(err);
        setRejectionReason(reason);
        onRejected?.(reason);
        return;
      }
      const serverMsg =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : 'Failed to submit report. Please check your network connection and try again.';
      setSubmitError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setSubmitError(null);
    setSubmittedReport(null);
    setRejectionReason(null);
    setLocationError(null);
    setLocationSuccess(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="citizen-report-title">
      <div className="modal-card citizen-report-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <ShieldAlert size={22} className="text-amber" />
            <h2 id="citizen-report-title">Report a Weather Incident</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" title="Close Form" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {rejectionReason ? (
            <div className="report-success-panel">
              <div className="success-icon-wrapper">
                <XCircle size={48} className="text-amber" />
              </div>
              <h3 className="success-title">Report rejected</h3>
              <p className="success-description">{rejectionReason}</p>
              <div className="success-actions">
                <button type="button" onClick={handleReset} className="btn-secondary">
                  Try Again
                </button>
                <button type="button" onClick={onClose} className="btn-primary">
                  Close
                </button>
              </div>
            </div>
          ) : submittedReport ? (
            /* SUCCESS CONFIRMATION STATE */
            <div className="report-success-panel">
              <div className="success-icon-wrapper">
                <CheckCircle2 size={48} className="text-emerald" />
              </div>
              <h3 className="success-title">
                Verified ✓{formatPercent(submittedReport.aiConfidenceScore)
                  ? ` (${formatPercent(submittedReport.aiConfidenceScore)})`
                  : ''}
              </h3>

              <p className="success-description">
                This report was accepted as a genuine weather incident for {submittedReport.city}, {submittedReport.state}.
              </p>

              <div className="submitted-summary-box">
                <div className="summary-row">
                  <span className="summary-label">Location:</span>
                  <span className="summary-value">{submittedReport.city}, {submittedReport.state}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Description:</span>
                  <span className="summary-value">{submittedReport.rawText}</span>
                </div>
              </div>

              <div className="success-actions">
                <button type="button" onClick={handleReset} className="btn-secondary">
                  Submit Another Report
                </button>
                <button type="button" onClick={onClose} className="btn-primary">
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* REPORT ENTRY FORM */
            <form onSubmit={handleSubmit} className="citizen-form" noValidate>
              <p className="form-subheading">
                Submit observed severe weather, waterlogging, or storm damage in your area to help update situational awareness maps.
              </p>

              {submitError && (
                <div className="form-alert form-alert-error" role="alert">
                  <AlertCircle size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Raw Text (Required) */}
              <div className="form-group">
                <label htmlFor="rawText" className="form-label required">
                  Incident Description
                </label>
                <textarea
                  id="rawText"
                  rows={3}
                  className={`form-textarea ${errors.rawText ? 'input-error' : ''}`}
                  placeholder="e.g. Heavy rainfall and severe waterlogging reported near Sector 29, traffic at a standstill."
                  value={formData.rawText}
                  onChange={(e) => handleInputChange('rawText', e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.rawText)}
                  aria-describedby={errors.rawText ? 'rawText-error' : undefined}
                />
                {errors.rawText && (
                  <span id="rawText-error" className="field-error-text">
                    {errors.rawText}
                  </span>
                )}
              </div>

              {/* City and State (Required) */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="city" className="form-label required">
                    City / Town
                  </label>
                  <input
                    type="text"
                    id="city"
                    className={`form-input ${errors.city ? 'input-error' : ''}`}
                    placeholder="e.g. Gurugram"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.city)}
                  />
                  {errors.city && <span className="field-error-text">{errors.city}</span>}
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="state" className="form-label required">
                    State / Union Territory
                  </label>
                  <input
                    type="text"
                    id="state"
                    className={`form-input ${errors.state ? 'input-error' : ''}`}
                    placeholder="e.g. Haryana"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.state)}
                  />
                  {errors.state && <span className="field-error-text">{errors.state}</span>}
                </div>
              </div>

              {/* Optional Geolocation / Coordinates */}
              <div className="form-group form-section-box">
                <div className="location-header-row">
                  <div className="flex-align-center gap-2">
                    <MapPin size={16} className="text-cyan" />
                    <span className="section-box-title">Coordinates (Optional)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isSubmitting || isLocating}
                    className="btn-location-trigger"
                    title="Populate latitude & longitude using browser Geolocation"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 size={14} className="spin-icon" />
                        <span>Acquiring...</span>
                      </>
                    ) : (
                      <>
                        <Navigation size={14} />
                        <span>Use My Location</span>
                      </>
                    )}
                  </button>
                </div>

                {locationError && (
                  <div className="location-alert location-alert-warn">
                    <AlertCircle size={14} />
                    <span>{locationError}</span>
                  </div>
                )}

                {locationSuccess && (
                  <div className="location-alert location-alert-success">
                    <CheckCircle2 size={14} />
                    <span>GPS coordinates captured successfully.</span>
                  </div>
                )}

                <div className="form-row mt-2">
                  <div className="form-group flex-1">
                    <label htmlFor="latitude" className="form-label-sub">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="latitude"
                      className={`form-input form-input-sm ${errors.latitude ? 'input-error' : ''}`}
                      placeholder="e.g. 28.4595"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.latitude && <span className="field-error-text">{errors.latitude}</span>}
                  </div>

                  <div className="form-group flex-1">
                    <label htmlFor="longitude" className="form-label-sub">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      id="longitude"
                      className={`form-input form-input-sm ${errors.longitude ? 'input-error' : ''}`}
                      placeholder="e.g. 77.0266"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.longitude && <span className="field-error-text">{errors.longitude}</span>}
                  </div>
                </div>
              </div>

              {/* Image URL & Hashtags */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="imageUrl" className="form-label flex-align-center gap-1">
                    <ImageIcon size={14} className="text-muted" />
                    <span>Image URL (Optional)</span>
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    className={`form-input ${errors.imageUrl ? 'input-error' : ''}`}
                    placeholder="https://example.com/photo.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.imageUrl && <span className="field-error-text">{errors.imageUrl}</span>}
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="hashtags" className="form-label flex-align-center gap-1">
                    <Hash size={14} className="text-muted" />
                    <span>Hashtags (Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="hashtags"
                    className="form-input"
                    placeholder="#GurugramRains, #Waterlogging"
                    value={formData.hashtags}
                    onChange={(e) => handleInputChange('hashtags', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Source Handle (Optional) & Locked Source Type */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="sourceHandle" className="form-label flex-align-center gap-1">
                    <User size={14} className="text-muted" />
                    <span>Reporter Handle / Tag</span>
                  </label>
                  <input
                    type="text"
                    id="sourceHandle"
                    className="form-input"
                    placeholder="citizen_web"
                    value={formData.sourceHandle}
                    onChange={(e) => handleInputChange('sourceHandle', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Source Type</label>
                  <div className="source-type-readonly-badge">
                    <span>CITIZEN</span>
                  </div>
                </div>
              </div>

              {/* Form Footer */}
              <div className="modal-footer citizen-form-footer">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-submit-report"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spin-icon mr-1" />
                      <span>Submitting Report...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-1" />
                      <span>Submit Incident Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenReportModal;
