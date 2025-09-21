import React from 'react';
import './common/Navigation.css';

const Navigation = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="navigation">
      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'shortener' ? 'active' : ''}`}
          onClick={() => setActiveTab('shortener')}
        >
          <i className="fas fa-link"></i> URL Shortener
        </button>
        <button 
          className={`nav-tab ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          <i className="fas fa-chart-bar"></i> Statistics
        </button>
      </div>
    </nav>
  );
};

export default Navigation;