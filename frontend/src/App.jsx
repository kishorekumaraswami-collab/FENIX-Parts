import React, { useState } from 'react';
import SinglePredictor from './components/SinglePredictor';
import BatchPredictor from './components/BatchPredictor';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('single');

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <h1 className="app-title">Salvage Vehicle ROI Predictor</h1>
              <p className="app-subtitle">AI-Powered Bid Screening System for Fenix Parts</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <div className="container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => setActiveTab('single')}
            >
              Single Prediction
            </button>
            <button
              className={`tab ${activeTab === 'batch' ? 'active' : ''}`}
              onClick={() => setActiveTab('batch')}
            >
              Batch Upload
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {activeTab === 'single' && <SinglePredictor />}
          {activeTab === 'batch' && <BatchPredictor />}
        </div>
      </main>
    </div>
  );
}

export default App;
