/**
 * VERSION 2 - HORIZONTAL TAB STEPPER
 *
 * Features:
 * - 4 horizontal tabs (free navigation)
 * - Left panel: Active step form
 * - Right panel: Results
 * - Can enter data in any order
 */

import React, { useState } from 'react';
import axios from 'axios';
import ResultsDisplay from './ResultsDisplay';
import AutocompleteInput from './AutocompleteInput';
import { ALL_MAKES, getModelsForMake } from '../data/vehicleData';
import './Stepper.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function SinglePredictor() {
  const [activeTab, setActiveTab] = useState(1);

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    sold_price: '',
    make_model_year_price_median: '',
    primary_damage: '',
    primary_damage_severity: '',
    secondary_damage_severity: '',
    engine_volume: '',
    cylinders: '',
    fuel_type: '',
    transmission: '',
    drive_type: '',
    seller_type: '',
    secondary_damage: ''
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);

  // VIN decoder state
  const [vin, setVin] = useState('');
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState(null);
  const [vinSuccess, setVinSuccess] = useState(false);
  const [vinDecoded, setVinDecoded] = useState(false);

  // Market value fetch state
  const [marketValueLoading, setMarketValueLoading] = useState(false);
  const [marketValueError, setMarketValueError] = useState(null);
  const [marketValueSuccess, setMarketValueSuccess] = useState(false);

  // Check if a required field should be highlighted (after VIN decode)
  const shouldHighlightRequired = (fieldName) => {
    const requiredFields = ['mileage', 'sold_price', 'make_model_year_price_median',
                            'primary_damage', 'primary_damage_severity'];
    return vinDecoded && requiredFields.includes(fieldName) && !formData[fieldName];
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (name === 'make') {
      const models = getModelsForMake(value);
      setAvailableModels(models);
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value
    }));
  };

  const decodeVIN = async () => {
    if (vin.length !== 17) {
      setVinError('VIN must be exactly 17 characters');
      return;
    }

    setVinLoading(true);
    setVinError(null);

    try {
      const response = await axios.get(`${API_URL}/decode-vin?vin=${vin}`);

      if (response.data.success) {
        const decoded = response.data;

        if (decoded.make) {
          const models = getModelsForMake(decoded.make);
          setAvailableModels(models);
        }

        setFormData(prev => ({
          ...prev,
          make: decoded.make || prev.make,
          model: decoded.model || prev.model,
          year: decoded.year || prev.year,
          engine_volume: decoded.engine_volume || prev.engine_volume,
          cylinders: decoded.cylinders || prev.cylinders,
          fuel_type: decoded.fuel_type || prev.fuel_type,
          transmission: decoded.transmission || prev.transmission,
          drive_type: decoded.drive_type || prev.drive_type,
        }));

        setVinSuccess(true);
        setVinDecoded(true);
        setTimeout(() => setVinSuccess(false), 5000);
      } else {
        setVinError(response.data.error || 'Failed to decode VIN');
      }
    } catch (err) {
      // Handle error - ensure it's always a string
      let errorMessage = 'VIN decode failed. Please try again.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg).join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setVinError(errorMessage);
    } finally {
      setVinLoading(false);
    }
  };

  const fetchMarketValue = async () => {
    // Validate required fields
    if (!vin || vin.length !== 17) {
      setMarketValueError('Please enter a valid 17-character VIN first');
      return;
    }

    if (!formData.mileage) {
      setMarketValueError('Please enter mileage for accurate market value');
      return;
    }

    setMarketValueLoading(true);
    setMarketValueError(null);
    setMarketValueSuccess(false);

    try {
      const response = await axios.get(`${API_URL}/market-value`, {
        params: {
          vin: vin,
          mileage: formData.mileage
        }
      });

      if (response.data.success) {
        // Auto-populate market value
        setFormData(prev => ({
          ...prev,
          make_model_year_price_median: response.data.market_value
        }));

        setMarketValueSuccess(true);
        setTimeout(() => setMarketValueSuccess(false), 5000);
      } else {
        setMarketValueError(response.data.error || 'Failed to fetch market value');
      }
    } catch (err) {
      // Handle error - ensure it's always a string
      let errorMessage = 'Unable to fetch current market value. Please enter manually.';

      if (err.response?.status === 503 && err.response?.data?.detail?.includes('API key')) {
        errorMessage = 'Market value service not configured. Please contact administrator.';
      } else if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg).join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setMarketValueError(errorMessage);
    } finally {
      setMarketValueLoading(false);
    }
  };

  const isTabComplete = (tab) => {
    switch (tab) {
      case 1:
        return formData.make && formData.model && formData.year && formData.mileage;
      case 2:
        return formData.sold_price && formData.make_model_year_price_median;
      case 3:
        return formData.primary_damage && formData.primary_damage_severity;
      case 4:
        return true; // Review tab is always accessible
      default:
        return false;
    }
  };

  const canPredict = () => {
    return isTabComplete(1) && isTabComplete(2) && isTabComplete(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Clean formData: convert empty strings to default values
      const cleanedData = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value === '' || value === null || value === undefined) {
          // Skip empty values - backend will use defaults
        } else {
          cleanedData[key] = value;
        }
      });

      const response = await axios.post(`${API_URL}/predict`, cleanedData);
      setResult(response.data);
    } catch (err) {
      let errorMessage = 'Prediction failed. Please try again.';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          // Format validation errors nicely
          const errors = detail.map(e => {
            const field = e.loc ? e.loc[e.loc.length - 1] : 'unknown';
            return `${field}: ${e.msg || 'Invalid value'}`;
          });
          errorMessage = errors.join('; ');
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (tab) => {
    if (isTabComplete(tab)) return '✓';
    return tab;
  };

  return (
    <div className="single-predictor">
      {/* Main Layout: Form Section + Results Panel */}
      <div className="main-layout">
        {/* Form Section with Tabs */}
        <div className="form-section">
          {/* Horizontal Tabs */}
          <div className="horizontal-tabs">
            <button
              className={`tab-btn ${activeTab === 1 ? 'active' : ''} ${isTabComplete(1) ? 'complete' : ''}`}
              onClick={() => setActiveTab(1)}
            >
              <span className="tab-icon">{getTabIcon(1)}</span>
              <span className="tab-label">Vehicle Details</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 2 ? 'active' : ''} ${isTabComplete(2) ? 'complete' : ''}`}
              onClick={() => setActiveTab(2)}
            >
              <span className="tab-icon">{getTabIcon(2)}</span>
              <span className="tab-label">Pricing</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 3 ? 'active' : ''} ${isTabComplete(3) ? 'complete' : ''}`}
              onClick={() => setActiveTab(3)}
            >
              <span className="tab-icon">{getTabIcon(3)}</span>
              <span className="tab-label">Damage & Specs</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 4 ? 'active' : ''}`}
              onClick={() => setActiveTab(4)}
            >
              <span className="tab-icon">{getTabIcon(4)}</span>
              <span className="tab-label">Review & Predict</span>
            </button>
          </div>

          {/* Left Panel: Active Tab Content */}
          <div className="left-panel">
          {/* Tab 1: Vehicle Details */}
          {activeTab === 1 && (
            <div className="tab-panel">
              <h3>Step 1: Vehicle Details</h3>

              {/* VIN Section */}
              <div className="vin-section-inline">
                <h4>Quick Entry (Optional)</h4>
                <div className="vin-input-group">
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    placeholder="Enter 17-character VIN"
                    maxLength={17}
                    className="vin-input"
                    disabled={vinLoading}
                  />
                  <button
                    type="button"
                    onClick={decodeVIN}
                    disabled={vin.length !== 17 || vinLoading}
                    className="btn btn-primary vin-decode-btn"
                  >
                    {vinLoading ? 'Decoding...' : 'Decode VIN'}
                  </button>
                </div>
                {vinError && <div className="vin-error">Error: {String(vinError)}</div>}
                {vinSuccess && <div className="vin-success">Success! Vehicle specs auto-filled</div>}
              </div>

              <div className="form-divider"><span>Or enter manually</span></div>

              <div className="form-grid">
                <AutocompleteInput
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  options={ALL_MAKES}
                  label="Make (Manufacturer)"
                  placeholder="Type to search..."
                  required={true}
                />

                <AutocompleteInput
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  options={availableModels}
                  label="Model"
                  placeholder="Type model name..."
                  required={true}
                />

                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    min="2000"
                    max="2026"
                    placeholder="Enter year (e.g., 2020)"
                    required
                  />
                </div>

                <div className={`form-group ${shouldHighlightRequired('mileage') ? 'field-required-empty' : ''}`}>
                  <label>Mileage *</label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleChange}
                    min="0"
                    placeholder="Enter mileage (e.g., 45000)"
                    required
                  />
                </div>
              </div>

              <div className="tab-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab(2)}
                >
                  Next: Pricing →
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Pricing */}
          {activeTab === 2 && (
            <div className="tab-panel">
              <h3>Step 2: Pricing Information</h3>

              <div className={`form-group ${shouldHighlightRequired('sold_price') ? 'field-required-empty' : ''}`}>
                <label>Sold Price ($) *</label>
                <input
                  type="number"
                  name="sold_price"
                  value={formData.sold_price}
                  onChange={handleChange}
                  min="1"
                  placeholder="Enter sold price (e.g., 8500)"
                  required
                />
              </div>

              <div className={`form-group ${shouldHighlightRequired('make_model_year_price_median') ? 'field-required-empty' : ''}`}>
                <label>Market Value ($) *</label>
                <div className="market-value-input-group">
                  <input
                    type="number"
                    name="make_model_year_price_median"
                    value={formData.make_model_year_price_median}
                    onChange={handleChange}
                    min="1"
                    placeholder="Enter market value (e.g., 18000)"
                    required
                  />
                  <button
                    type="button"
                    onClick={fetchMarketValue}
                    disabled={marketValueLoading || !vin || !formData.mileage}
                    className="btn btn-primary"
                  >
                    {marketValueLoading ? 'Fetching...' : 'Fetch Current Market Value'}
                  </button>
                </div>
                {marketValueSuccess && (
                  <div className="vin-success" style={{marginTop: '0.5rem'}}>
                    Current market value fetched successfully
                  </div>
                )}
                {marketValueError && (
                  <div className="vin-error" style={{marginTop: '0.5rem'}}>
                    {String(marketValueError)}
                  </div>
                )}
              </div>

              <div className="tab-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab(1)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab(3)}
                >
                  Next: Damage & Specs →
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Damage & Engine */}
          {activeTab === 3 && (
            <div className="tab-panel">
              <h3>Step 3: Damage & Engine Specs</h3>

              <h4>Damage Assessment</h4>
              <div className="form-grid">
                <div className={`form-group ${shouldHighlightRequired('primary_damage') ? 'field-required-empty' : ''}`}>
                  <label>Primary Damage *</label>
                  <select
                    name="primary_damage"
                    value={formData.primary_damage}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select damage type...</option>
                    <option value="FRONT END">FRONT END</option>
                    <option value="REAR END">REAR END</option>
                    <option value="SIDE">SIDE</option>
                    <option value="MINOR DENT/SCRATCHES">MINOR DENT/SCRATCHES</option>
                    <option value="HAIL">HAIL</option>
                    <option value="MECHANICAL">MECHANICAL</option>
                    <option value="UNDERCARRIAGE">UNDERCARRIAGE</option>
                    <option value="VANDALISM">VANDALISM</option>
                  </select>
                </div>

                <div className={`form-group ${shouldHighlightRequired('primary_damage_severity') ? 'field-required-empty' : ''}`}>
                  <label>Primary Severity (0-5) *</label>
                  <input
                    type="number"
                    name="primary_damage_severity"
                    value={formData.primary_damage_severity}
                    onChange={handleChange}
                    min="0"
                    max="5"
                    step="0.5"
                    placeholder="Enter severity (0-5)"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Secondary Severity (0-5)</label>
                  <input
                    type="number"
                    name="secondary_damage_severity"
                    value={formData.secondary_damage_severity}
                    onChange={handleChange}
                    min="0"
                    max="5"
                    step="0.5"
                    placeholder="Enter severity (0-5)"
                  />
                </div>
              </div>

              <h4>Engine Specs</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Engine Volume (L)</label>
                  <input
                    type="number"
                    name="engine_volume"
                    value={formData.engine_volume}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    placeholder="Enter volume (e.g., 2.5)"
                  />
                </div>

                <div className="form-group">
                  <label>Cylinders</label>
                  <input
                    type="number"
                    name="cylinders"
                    value={formData.cylinders}
                    onChange={handleChange}
                    min="1"
                    max="16"
                    placeholder="Enter cylinders (e.g., 4)"
                  />
                </div>

                <div className="form-group">
                  <label>Fuel Type</label>
                  <select name="fuel_type" value={formData.fuel_type} onChange={handleChange}>
                    <option value="">Select fuel type...</option>
                    <option value="GAS">GAS</option>
                    <option value="DIESEL">DIESEL</option>
                    <option value="HYBRID">HYBRID</option>
                    <option value="ELECTRIC">ELECTRIC</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Transmission</label>
                  <select name="transmission" value={formData.transmission} onChange={handleChange}>
                    <option value="">Select transmission...</option>
                    <option value="AUTOMATIC">AUTOMATIC</option>
                    <option value="MANUAL">MANUAL</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Drive Type</label>
                  <select name="drive_type" value={formData.drive_type} onChange={handleChange}>
                    <option value="">Select drive type...</option>
                    <option value="FWD">FWD</option>
                    <option value="RWD">RWD</option>
                    <option value="4WD">4WD</option>
                    <option value="AWD">AWD</option>
                  </select>
                </div>
              </div>

              <div className="tab-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab(2)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab(4)}
                >
                  Next: Review →
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Review & Predict */}
          {activeTab === 4 && (
            <div className="tab-panel">
              <h3>Step 4: Review & Predict</h3>

              {!canPredict() && (
                <div className="warning-card">
                  <strong>Missing Required Information</strong>
                  <p>Please complete all required fields before predicting:</p>
                  <ul>
                    {!isTabComplete(1) && <li>Vehicle Details (Tab 1)</li>}
                    {!isTabComplete(2) && <li>Pricing (Tab 2)</li>}
                    {!isTabComplete(3) && <li>Damage Assessment (Tab 3)</li>}
                  </ul>
                </div>
              )}

              <div className="review-section">
                <h4>Review Your Entry</h4>

                <div className="review-item">
                  <strong>Vehicle:</strong>
                  <span>
                    {formData.year && formData.make && formData.model
                      ? `${formData.year} ${formData.make} ${formData.model}`
                      : 'Not completed'}
                  </span>
                  <button type="button" className="edit-link" onClick={() => setActiveTab(1)}>
                    Edit
                  </button>
                </div>

                <div className="review-item">
                  <strong>Mileage:</strong>
                  <span>{formData.mileage ? `${formData.mileage.toLocaleString()} miles` : 'Not entered'}</span>
                  <button type="button" className="edit-link" onClick={() => setActiveTab(1)}>
                    Edit
                  </button>
                </div>

                <div className="review-item">
                  <strong>Sold Price:</strong>
                  <span>{formData.sold_price ? `$${formData.sold_price.toLocaleString()}` : 'Not entered'}</span>
                  <button type="button" className="edit-link" onClick={() => setActiveTab(2)}>
                    Edit
                  </button>
                </div>

                <div className="review-item">
                  <strong>Market Value:</strong>
                  <span>
                    {formData.make_model_year_price_median
                      ? `$${formData.make_model_year_price_median.toLocaleString()}`
                      : 'Not entered'}
                  </span>
                  <button type="button" className="edit-link" onClick={() => setActiveTab(2)}>
                    Edit
                  </button>
                </div>

                <div className="review-item">
                  <strong>Damage:</strong>
                  <span>
                    {formData.primary_damage && formData.primary_damage_severity
                      ? `${formData.primary_damage} (${formData.primary_damage_severity})`
                      : 'Not completed'}
                  </span>
                  <button type="button" className="edit-link" onClick={() => setActiveTab(3)}>
                    Edit
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-card">
                  <p>{String(error)}</p>
                </div>
              )}

              <div className="tab-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab(3)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={handleSubmit}
                  disabled={loading || !canPredict()}
                >
                  {loading ? 'Predicting...' : 'Predict ROI'}
                </button>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Right Panel: Results */}
        <div className="right-panel">
          <div className="results-header">
            <h2>Prediction Results</h2>
          </div>
          {result ? (
            <div className="results-content">
              <ResultsDisplay result={result} />
              <div className="results-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-large"
                  onClick={() => {
                    setResult(null);
                    setActiveTab(1);
                    setVinDecoded(false);
                    setFormData({
                      make: '',
                      model: '',
                      year: '',
                      mileage: '',
                      sold_price: '',
                      make_model_year_price_median: '',
                      primary_damage: '',
                      primary_damage_severity: '',
                      secondary_damage_severity: '',
                      engine_volume: '',
                      cylinders: '',
                      fuel_type: '',
                      transmission: '',
                      drive_type: '',
                      seller_type: '',
                      secondary_damage: ''
                    });
                  }}
                >
                  Predict Another Vehicle
                </button>
              </div>
            </div>
          ) : (
            <div className="results-placeholder">
              <h3>Awaiting Prediction</h3>
              <p>Complete all required fields and click "Predict ROI" to see the prediction results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SinglePredictor;
