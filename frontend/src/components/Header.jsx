import React from 'react';
import { RefreshCw, DownloadCloud } from 'lucide-react';

export const Header = ({ lastUpdated, onRefresh, isUsingMock, isLive }) => {
  return (
    <header className="header-container">
      <div className="header-branding">
        <div>
          <div className="header-title-group">
            <h1 className="header-title">National Weather Intelligence</h1>
          </div>
          <p className="header-subtitle">
            Real-Time Weather & Disaster Situational Awareness Platform
          </p>
        </div>
      </div>

      <div className="header-controls">

        {/* Last Updated Timestamp */}
        <div className="timestamp-badge">
          <span className="text-muted text-xs">Updated:</span>
          <span className="timestamp-text">{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Just now'}</span>
        </div>

        {/* Refresh Button */}
        <button 
          onClick={onRefresh} 
          className="btn-icon" 
          title="Refresh Weather Data"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
