import React, { useState, useEffect } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { createCitizenReport } from '../api';

const INITIAL_FORM_STATE = {
  rawText: '',
  city: '',
  state: '',
  latitude: '',
  longitude: '',
  imageUrl: '',
  hashtags: '',
  sourceHandle: 'citizen_web',
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
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

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
          longitude: lng,
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

  const normalizeHashtags = (input) => {
    if (!input || !input.trim()) return [];
    return input
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
  };

  const isValidUrl = (string) => {
    if (!string || !string.trim()) return true;
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

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
      sourceType: 'CITIZEN',
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

  const fieldClass = (hasError) => `field-input ${hasError ? 'input-error' : ''}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 p-4 dark:bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="citizen-report-title"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden border border-hair bg-page"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hair px-5 py-4">
          <h2 id="citizen-report-title" className="text-sm font-normal text-ink">
            Report a Weather Incident
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-mute hover:text-ink"
            title="Close form"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {rejectionReason ? (
            <div className="flex flex-col items-start gap-4">
              <h3 className="text-lg text-ink">Report Rejected</h3>
              <p className="text-sm text-mute">{rejectionReason}</p>
              <div className="flex gap-2">
                <button type="button" onClick={handleReset} className="btn-secondary">
                  Try Again
                </button>
                <button type="button" onClick={onClose} className="btn-primary">
                  Close
                </button>
              </div>
            </div>
          ) : submittedReport ? (
            <div className="flex flex-col items-start gap-4">
              <h3 className="text-lg text-ink">
                Verified
                {formatPercent(submittedReport.aiConfidenceScore)
                  ? ` (${formatPercent(submittedReport.aiConfidenceScore)})`
                  : ''}
              </h3>
              <p className="text-sm text-mute">
                This report was accepted as a genuine weather incident for {submittedReport.city},{' '}
                {submittedReport.state}.
              </p>
              <div className="w-full border-t border-hair pt-4 font-mono text-xs">
                <div className="flex gap-3 py-1">
                  <span className="w-28 shrink-0 text-mute">Location:</span>
                  <span className="text-ink">
                    {submittedReport.city}, {submittedReport.state}
                  </span>
                </div>
                <div className="flex gap-3 py-1">
                  <span className="w-28 shrink-0 text-mute">Description:</span>
                  <span className="text-ink">{submittedReport.rawText}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleReset} className="btn-secondary">
                  Submit Another
                </button>
                <button type="button" onClick={onClose} className="btn-primary">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <p className="text-sm text-mute">
                Submit observed severe weather, waterlogging, or storm damage in your area to help update
                situational awareness maps.
              </p>

              {submitError && (
                <div className="border border-hair px-3 py-2 text-sm text-ink" role="alert">
                  <span className="font-mono text-[11px] text-critical">[error]</span> {submitError}
                </div>
              )}

              <label className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-mute">Incident Description *</span>
                <textarea
                  id="rawText"
                  rows={3}
                  className={fieldClass(errors.rawText)}
                  placeholder="e.g. Heavy rainfall and severe waterlogging reported near Sector 29."
                  value={formData.rawText}
                  onChange={(e) => handleInputChange('rawText', e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.rawText)}
                />
                {errors.rawText && <span className="font-mono text-[11px] text-critical">{errors.rawText}</span>}
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] text-mute">City / Town *</span>
                  <input
                    type="text"
                    id="city"
                    className={fieldClass(errors.city)}
                    placeholder="e.g. Gurugram"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.city && <span className="font-mono text-[11px] text-critical">{errors.city}</span>}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] text-mute">State / UT *</span>
                  <input
                    type="text"
                    id="state"
                    className={fieldClass(errors.state)}
                    placeholder="e.g. Haryana"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.state && <span className="font-mono text-[11px] text-critical">{errors.state}</span>}
                </label>
              </div>

              <div className="border border-hair p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-mute">Coordinates (optional)</span>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isSubmitting || isLocating}
                    className="btn-secondary"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 size={13} className="spin-icon" />
                        Acquiring…
                      </>
                    ) : (
                      'Use My Location →'
                    )}
                  </button>
                </div>
                {locationError && (
                  <p className="mb-2 font-mono text-[11px] text-mute">{locationError}</p>
                )}
                {locationSuccess && (
                  <p className="mb-2 font-mono text-[11px] text-ink">GPS coordinates captured</p>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[11px] text-mute">Latitude</span>
                    <input
                      type="number"
                      step="any"
                      id="latitude"
                      className={fieldClass(errors.latitude)}
                      placeholder="28.4595"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.latitude && (
                      <span className="font-mono text-[11px] text-critical">{errors.latitude}</span>
                    )}
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[11px] text-mute">Longitude</span>
                    <input
                      type="number"
                      step="any"
                      id="longitude"
                      className={fieldClass(errors.longitude)}
                      placeholder="77.0266"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.longitude && (
                      <span className="font-mono text-[11px] text-critical">{errors.longitude}</span>
                    )}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] text-mute">Image URL</span>
                  <input
                    type="url"
                    id="imageUrl"
                    className={fieldClass(errors.imageUrl)}
                    placeholder="https://example.com/photo.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.imageUrl && (
                    <span className="font-mono text-[11px] text-critical">{errors.imageUrl}</span>
                  )}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] text-mute">Hashtags</span>
                  <input
                    type="text"
                    id="hashtags"
                    className="field-input"
                    placeholder="#GurugramRains"
                    value={formData.hashtags}
                    onChange={(e) => handleInputChange('hashtags', e.target.value)}
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] text-mute">Reporter Handle</span>
                  <input
                    type="text"
                    id="sourceHandle"
                    className="field-input"
                    placeholder="citizen_web"
                    value={formData.sourceHandle}
                    onChange={(e) => handleInputChange('sourceHandle', e.target.value)}
                    disabled={isSubmitting}
                  />
                </label>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] text-mute">Source Type</span>
                  <div className="flex h-[34px] items-center font-mono text-xs text-mute">[citizen]</div>
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-2 border-t border-hair pt-4">
                <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="spin-icon" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Submit Report →
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
