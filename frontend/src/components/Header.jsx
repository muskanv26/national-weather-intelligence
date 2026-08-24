import React from 'react';
import { ShieldAlert, Activity, RefreshCw, Database, PlusCircle } from 'lucide-react';

export const Header = ({ lastUpdated, onRefresh, isUsingMock, isLive, onOpenReportModal }) => {
  return (
    <>
      <header className="header-container">
        <div className="header-branding">
          <div className="header-logo">
            <ShieldAlert className="logo-icon text-cyan" size={32} />
          </div>
          <div>
            <div className="header-title-group">
              <h1 className="header-title">National Weather Intelligence</h1>
              <span className="sih-badge">SIH 2026 Prototype</span>
            </div>
            <p className="header-subtitle">
              Weather & Disaster Situational Awareness
            </p>
          </div>
        </div>

        <div className="header-controls">
          {/* Report Incident CTA */}
          <button
            onClick={onOpenReportModal}
            className="btn-report-incident"
            title="Report a weather incident or disaster in your area"
          >
            <PlusCircle size={16} />
            <span>Report Incident</span>
          </button>

          {/* Connection Status Badge */}
          <div className={`status-pill ${isLive ? 'status-live' : 'status-offline'}`}>
            <span className="pulse-dot"></span>
            <Activity size={14} className="mr-1" />
            <span>{isLive ? 'SYSTEM LIVE' : 'OFFLINE MODE'}</span>
          </div>

          {/* Data Source Indicator */}
          <div className="datasource-badge" title={isUsingMock ? "Using Local Fallback Data" : "Connected to Live PostgreSQL Database"}>
            <Database size={14} className={isUsingMock ? 'text-amber' : 'text-emerald'} />
            <span>{isUsingMock ? 'Demo Data' : 'Live DB'}</span>
          </div>

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
      <div className="gov-rule" />
    </>
  );
};


export default Header;
