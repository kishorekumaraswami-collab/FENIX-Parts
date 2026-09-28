import React, { useState } from 'react';
import axios from 'axios';
import ResultsDisplay from './ResultsDisplay';
import AutocompleteInput from './AutocompleteInput';
import { ALL_MAKES, getModelsForMake } from '../data/vehicleData';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function SinglePredictor() {
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
  const [autoFilledFields, setAutoFilledFields] = useState([]);
  const [showProgress, setShowProgress] = useState(false);

  // Helper function to get field status
  const getFieldClass = (fieldName) => {
    // No special styling for auto-filled fields
    return '';
  };

  const isFieldRequired = (fieldName) => {
    const requiredFields = ['mileage', 'sold_price', 'make_model_year_price_median',
                            'primary_damage', 'primary_damage_severity'];
    return requiredFields.includes(fieldName);
  };

  const getFieldIcon = (fieldName) => {
    // Only show indicators AFTER VIN decode
    if (showProgress && isFieldRequired(fieldName) && !formData[fieldName]) {
      return <span className="field-icon field-icon-required">*</span>;
    }
    return null;
  };

  const shouldHighlightRequired = (fieldName) => {
    // Only highlight AFTER VIN decode
    return showProgress && isFieldRequired(fieldName) && !formData[fieldName];
  };

  // Calculate progress
  const calculateProgress = () => {
    const allFields = [
      'make', 'model', 'year', 'mileage', 'sold_price', 'make_model_year_price_median',
      'primary_damage', 'primary_damage_severity', 'secondary_damage_severity',
      'engine_volume', 'cylinders', 'fuel_type', 'transmission', 'drive_type', 'seller_type'
    ];

    const filledCount = allFields.filter(field => {
      const value = formData[field];
      return value !== '' && value !== null && value !== undefined;
    }).length;

    return {
      filled: filledCount,
      total: allFields.length,
      percentage: Math.round((filledCount / allFields.length) * 100)
    };
  };

  const getRemainingRequiredFields = () => {
    const required = [
      { name: 'mileage', label: 'Mileage' },
      { name: 'sold_price', label: 'Sold Price' },
      { name: 'make_model_year_price_median', label: 'Market Value' },
      { name: 'primary_damage', label: 'Primary Damage' },
      { name: 'primary_damage_severity', label: 'Primary Damage Severity' }
    ];

    return required.filter(field => !formData[field.name] || formData[field.name] === '');
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Special handling for make change
    if (name === 'make') {
      const models = getModelsForMake(value);
      setAvailableModels(models);

      // Reset model if current model is not available for new make
      const currentModel = formData.model;
      const newModel = models.includes(currentModel) ? currentModel : (models[0] || '');

      setFormData(prev => ({
        ...prev,
        make: value,
        model: newModel
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      }));
    }
  };

  const decodeVIN = async () => {
    if (vin.length !== 17) {
      setVinError('VIN must be exactly 17 characters');
      setVinSuccess(false);
      return;
    }

    setVinLoading(true);
    setVinError(null);
    setVinSuccess(false);

    try {
      const response = await axios.get(`${API_URL}/decode-vin?vin=${vin}`);

      if (response.data.success) {
        const decoded = response.data;

        // Update models list for the decoded make
        if (decoded.make) {
          const models = getModelsForMake(decoded.make);
          setAvailableModels(models);
        }

        // Track which fields were auto-filled
        const filledFields = [];
        if (decoded.make) filledFields.push('make');
        if (decoded.model) filledFields.push('model');
        if (decoded.year) filledFields.push('year');
        if (decoded.engine_volume) filledFields.push('engine_volume');
        if (decoded.cylinders) filledFields.push('cylinders');
        if (decoded.fuel_type) filledFields.push('fuel_type');
        if (decoded.transmission) filledFields.push('transmission');
        if (decoded.drive_type) filledFields.push('drive_type');

        setAutoFilledFields(filledFields);
        setShowProgress(true);

        // Auto-fill form fields with decoded data
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

        // Auto-clear success message after 5 seconds
        setTimeout(() => setVinSuccess(false), 5000);
      } else {
        setVinError(response.data.error || 'Failed to decode VIN');
      }
    } catch (err) {
      setVinError(err.response?.data?.detail || 'VIN decode failed. Please try again.');
    } finally {
      setVinLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/predict`, formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="single-predictor">
      <div className="section-header">
        <h2>Single Vehicle ROI Prediction</h2>
        <p>Enter vehicle details to predict potential ROI</p>
      </div>

      {/* VIN Quick Entry Section */}
      <div className="vin-section">
        <h4>Quick Entry (Optional)</h4>
        <p className="vin-description">Enter VIN to auto-fill vehicle specifications</p>
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
            onClick={decodeVIN}
            disabled={vin.length !== 17 || vinLoading}
            className="btn btn-primary vin-decode-btn"
          >
            {vinLoading ? 'Decoding...' : 'Decode VIN'}
          </button>
        </div>
        {vinError && <div className="vin-error">Error: {vinError}</div>}
        {vinSuccess && (
          <div className="vin-success">
            Success! Vehicle specs auto-filled from VIN
          </div>
        )}
        <small className="vin-note">
          Note: VIN will auto-fill Make, Model, Year, Engine, Transmission, Drive Type
        </small>
      </div>

      <div className="manual-entry-divider">
        <span>Or enter details manually below</span>
      </div>

      <div className="predictor-grid">
        {/* Form */}
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Vehicle Information</h3>
              <div className="form-grid">
                <AutocompleteInput
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  options={ALL_MAKES}
                  label="Make (Manufacturer)"
                  placeholder="Type to search or select..."
                  required={true}
                />

                <AutocompleteInput
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  options={availableModels}
                  label="Model"
                  placeholder="Type to search or select..."
                  required={true}
                  disabled={!formData.make}
                />

                <div className={`form-group ${getFieldClass('year')}`}>
                  <label>
                    Year
                    {getFieldIcon('year')}
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    min="2000"
                    max="2026"
                    required
                    placeholder="Enter year (e.g., 2020)"
                    className={getFieldClass('year')}
                  />
                </div>

                <div className={`form-group ${shouldHighlightRequired('mileage') ? 'field-required-empty' : ''}`}>
                  <label>
                    Mileage
                    {getFieldIcon('mileage')}
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleChange}
                    min="0"
                    required
                    placeholder="Enter mileage (e.g., 45000)"
                    className={shouldHighlightRequired('mileage') ? 'field-required-empty' : ''}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Pricing</h3>
              <div className="form-grid">
                <div className={`form-group ${shouldHighlightRequired('sold_price') ? 'field-required-empty' : ''}`}>
                  <label>
                    Sold Price ($)
                    {getFieldIcon('sold_price')}
                  </label>
                  <input
                    type="number"
                    name="sold_price"
                    value={formData.sold_price}
                    onChange={handleChange}
                    min="1"
                    required
                    placeholder="Enter sold price (e.g., 8500)"
                    className={shouldHighlightRequired('sold_price') ? 'field-required-empty' : ''}
                  />
                </div>

                <div className={`form-group ${shouldHighlightRequired('make_model_year_price_median') ? 'field-required-empty' : ''}`}>
                  <label>
                    Market Value ($)
                    {getFieldIcon('make_model_year_price_median')}
                  </label>
                  <input
                    type="number"
                    name="make_model_year_price_median"
                    value={formData.make_model_year_price_median}
                    onChange={handleChange}
                    placeholder="Enter market value (e.g., 18000)"
                    min="1"
                    required
                    className={shouldHighlightRequired('make_model_year_price_median') ? 'field-required-empty' : ''}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Damage Assessment</h3>
              <div className="form-grid">
                <div className={`form-group ${shouldHighlightRequired('primary_damage') ? 'field-required-empty' : ''}`}>
                  <label>
                    Primary Damage
                    {getFieldIcon('primary_damage')}
                  </label>
                  <select
                    name="primary_damage"
                    value={formData.primary_damage}
                    onChange={handleChange}
                    required
                    className={shouldHighlightRequired('primary_damage') ? 'field-required-empty' : ''}
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
                  <label>
                    Primary Severity (1-5)
                    {getFieldIcon('primary_damage_severity')}
                  </label>
                  <input
                    type="number"
                    name="primary_damage_severity"
                    value={formData.primary_damage_severity}
                    onChange={handleChange}
                    min="0"
                    max="5"
                    step="0.5"
                    required
                    placeholder="Enter severity (0-5)"
                    className={shouldHighlightRequired('primary_damage_severity') ? 'field-required-empty' : ''}
                  />
                </div>

                <div className="form-group">
                  <label>Secondary Severity (1-5)</label>
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
            </div>

            <div className="form-section">
              <h3>Engine Specs</h3>
              <div className="form-grid">
                <div className={`form-group ${getFieldClass('engine_volume')}`}>
                  <label>
                    Engine Volume (L)
                    {getFieldIcon('engine_volume')}
                  </label>
                  <input
                    type="number"
                    className={getFieldClass('engine_volume')}
                    name="engine_volume"
                    value={formData.engine_volume}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    placeholder="Enter volume (e.g., 2.5)"
                  />
                </div>

                <div className={`form-group ${getFieldClass('cylinders')}`}>
                  <label>
                    Cylinders
                    {getFieldIcon('cylinders')}
                  </label>
                  <input
                    type="number"
                    name="cylinders"
                    value={formData.cylinders}
                    onChange={handleChange}
                    min="1"
                    max="16"
                    placeholder="Enter cylinders (e.g., 4)"
                    className={getFieldClass('cylinders')}
                  />
                </div>

                <div className={`form-group ${getFieldClass('fuel_type')}`}>
                  <label>
                    Fuel Type
                    {getFieldIcon('fuel_type')}
                  </label>
                  <select
                    name="fuel_type"
                    value={formData.fuel_type}
                    onChange={handleChange}
                    className={getFieldClass('fuel_type')}
                  >
                    <option value="">Select fuel type...</option>
                    <option value="GAS">GAS</option>
                    <option value="DIESEL">DIESEL</option>
                    <option value="HYBRID">HYBRID</option>
                    <option value="ELECTRIC">ELECTRIC</option>
                  </select>
                </div>

                <div className={`form-group ${getFieldClass('transmission')}`}>
                  <label>
                    Transmission
                    {getFieldIcon('transmission')}
                  </label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
                    className={getFieldClass('transmission')}
                  >
                    <option value="">Select transmission...</option>
                    <option value="AUTOMATIC">AUTOMATIC</option>
                    <option value="MANUAL">MANUAL</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>

                <div className={`form-group ${getFieldClass('drive_type')}`}>
                  <label>
                    Drive Type
                    {getFieldIcon('drive_type')}
                  </label>
                  <select
                    name="drive_type"
                    value={formData.drive_type}
                    onChange={handleChange}
                    className={getFieldClass('drive_type')}
                  >
                    <option value="">Select drive type...</option>
                    <option value="FWD">FWD</option>
                    <option value="RWD">RWD</option>
                    <option value="4WD">4WD</option>
                    <option value="AWD">AWD</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? 'Predicting...' : 'Predict ROI'}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="results-section">
          {error && (
            <div className="error-card">
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          )}

          {result && <ResultsDisplay result={result} />}

          {!result && !error && !loading && (
            <div className="placeholder-card">
              <h3>Fill in vehicle details</h3>
              <p>Enter the vehicle information and click "Predict ROI" to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SinglePredictor;
