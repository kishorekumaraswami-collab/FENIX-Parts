import React, { useState, useMemo } from 'react';
import axios from 'axios';
import ResultsDisplay from './ResultsDisplay';
import AutocompleteInput from './AutocompleteInput';
import { ALL_MAKES, getModelsForMake } from '../data/vehicleData';
import './BatchPredictor.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function BatchPredictor() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New state for enhanced features
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortColumn, setSortColumn] = useState('predicted_roi');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterDecision, setFilterDecision] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualVehicles, setManualVehicles] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Manual vehicle form state
  const [manualForm, setManualForm] = useState({
    vin: '',
    make: '',
    model: '',
    year: '',
    mileage: '',
    sold_price: '',
    make_model_year_price_median: '',
    primary_damage: 'MINOR DENT/SCRATCHES',
    primary_damage_severity: '2',
    secondary_damage_severity: '0',
    engine_volume: '2.5',
    cylinders: '4',
    fuel_type: 'GAS',
    transmission: 'AUTOMATIC',
    drive_type: 'FWD',
    seller_type: 'Insurance',
    secondary_damage: 'NONE'
  });
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinError, setVinError] = useState(null);
  const [vinSuccess, setVinSuccess] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError(null);

      // Auto-analyze
      await handleUpload(selectedFile);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleUpload = async (uploadFile = null) => {
    const fileToUpload = uploadFile || file;

    if (!fileToUpload) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const response = await axios.post(`${API_URL}/predict/batch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Batch prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    if (!results || !results.predictions) return;

    // Convert to CSV
    const headers = Object.keys(results.predictions[0]);
    const csvContent = [
      headers.join(','),
      ...results.predictions.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      )
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'salvage_roi_predictions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatistics = () => {
    if (!results || !results.predictions) return null;

    const predictions = results.predictions;
    const rois = predictions
      .map(p => p.predicted_roi)
      .filter(roi => roi !== null && !isNaN(roi));

    if (rois.length === 0) return null;

    return {
      total: predictions.length,
      high: rois.filter(roi => roi > 50).length,
      medium: rois.filter(roi => roi > 20 && roi <= 50).length,
      low: rois.filter(roi => roi > 0 && roi <= 20).length,
      negative: rois.filter(roi => roi <= 0).length,
      avgRoi: (rois.reduce((a, b) => a + b, 0) / rois.length).toFixed(2)
    };
  };

  // Helper function to determine decision based on ROI
  const getDecision = (roi) => {
    if (roi > 50) return { label: 'STRONG BUY', color: 'success', icon: '' };
    if (roi > 20) return { label: 'CONSIDER', color: 'warning', icon: '' };
    return { label: 'SKIP', color: 'danger', icon: '' };
  };

  // Sorting and filtering logic
  const processedResults = useMemo(() => {
    if (!results || !results.predictions) return [];

    let processed = [...results.predictions];

    // Add decision to each prediction
    processed = processed.map(pred => ({
      ...pred,
      decision: getDecision(pred.predicted_roi)
    }));

    // Filter
    if (filterDecision !== 'all') {
      processed = processed.filter(pred => pred.decision.label === filterDecision);
    }

    // Sort
    processed.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle nested decision sorting
      if (sortColumn === 'decision') {
        aVal = a.predicted_roi;
        bVal = b.predicted_roi;
      }

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return processed;
  }, [results, sortColumn, sortDirection, filterDecision, refreshKey]);

  // Toggle sort
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Toggle expanded row - now opens modal
  const toggleExpanded = (index) => {
    const vehicle = processedResults[index];
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
  };

  // Handle manual form field changes
  const handleManualFormChange = (e) => {
    const { name, value } = e.target;
    setManualForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Update available models when make changes
    if (name === 'make' && value) {
      const models = getModelsForMake(value.toUpperCase());
      setAvailableModels(models);
    }
  };

  // Handle VIN decode
  const handleVinDecode = async () => {
    if (!manualForm.vin || manualForm.vin.length !== 17) {
      setVinError('VIN must be 17 characters');
      return;
    }

    setVinDecoding(true);
    setVinError(null);

    try {
      const response = await axios.get(`${API_URL}/decode-vin`, {
        params: { vin: manualForm.vin }
      });

      if (response.data.success) {
        const decodedMake = response.data.make;

        // Update available models if make was decoded
        if (decodedMake) {
          const models = getModelsForMake(decodedMake);
          setAvailableModels(models);
        }

        setManualForm(prev => ({
          ...prev,
          make: decodedMake || prev.make,
          model: response.data.model || prev.model,
          year: response.data.year || prev.year,
          engine_volume: response.data.engine_volume || prev.engine_volume,
          cylinders: response.data.cylinders || prev.cylinders,
          fuel_type: response.data.fuel_type || prev.fuel_type,
          transmission: response.data.transmission || prev.transmission,
          drive_type: response.data.drive_type || prev.drive_type
        }));

        setVinSuccess(true);
        setTimeout(() => setVinSuccess(false), 5000);
      } else {
        setVinError(response.data.error || 'VIN decode failed');
      }
    } catch (err) {
      // Handle error - ensure it's always a string
      let errorMessage = 'VIN decode failed';
      if (err.response?.data?.detail) {
        // Check if detail is a string or object
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          // FastAPI validation errors come as array
          errorMessage = err.response.data.detail.map(e => e.msg).join(', ');
        } else {
          errorMessage = 'VIN decode failed';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setVinError(errorMessage);
    } finally {
      setVinDecoding(false);
    }
  };

  // Handle manual vehicle submission
  const handleManualSubmit = async () => {
    // Validate required fields
    if (!manualForm.make || !manualForm.model || !manualForm.year ||
        !manualForm.mileage || !manualForm.sold_price || !manualForm.make_model_year_price_median) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const vehicleData = {
        make: manualForm.make.toUpperCase(),
        model: manualForm.model.toUpperCase(),
        year: parseInt(manualForm.year),
        mileage: parseFloat(manualForm.mileage),
        sold_price: parseFloat(manualForm.sold_price),
        make_model_year_price_median: parseFloat(manualForm.make_model_year_price_median),
        primary_damage: manualForm.primary_damage,
        primary_damage_severity: parseFloat(manualForm.primary_damage_severity),
        secondary_damage_severity: parseFloat(manualForm.secondary_damage_severity),
        engine_volume: parseFloat(manualForm.engine_volume),
        cylinders: parseFloat(manualForm.cylinders),
        fuel_type: manualForm.fuel_type,
        transmission: manualForm.transmission,
        drive_type: manualForm.drive_type,
        seller_type: manualForm.seller_type,
        secondary_damage: manualForm.secondary_damage
      };

      const response = await axios.post(`${API_URL}/predict`, vehicleData);

      if (response.data.success) {
        // Add to results
        const newPrediction = {
          ...vehicleData,
          predicted_roi: response.data.predicted_roi,
          confidence_min: response.data.confidence_range?.min,
          confidence_max: response.data.confidence_range?.max,
          interpretation: response.data.interpretation,
          recommendation: response.data.recommendation,
          risk_level: response.data.risk_level,
          actual_roi: response.data.actual_roi,
          mae: response.data.mae
        };

        // Update results - force new array and object to trigger re-render
        const updatedPredictions = results
          ? [...results.predictions, newPrediction]
          : [newPrediction];

        const newResultsState = {
          success: true,
          total_records: updatedPredictions.length,
          predictions: updatedPredictions
        };

        setResults(newResultsState);
        setRefreshKey(prev => prev + 1); // Force re-render

        // Close modal and reset form
        setShowAddForm(false);
        setManualForm({
          vin: '',
          make: '',
          model: '',
          year: '',
          mileage: '',
          sold_price: '',
          make_model_year_price_median: '',
          primary_damage: 'MINOR DENT/SCRATCHES',
          primary_damage_severity: '2',
          secondary_damage_severity: '0',
          engine_volume: '2.5',
          cylinders: '4',
          fuel_type: 'GAS',
          transmission: 'AUTOMATIC',
          drive_type: 'FWD',
          seller_type: 'Insurance',
          secondary_damage: 'NONE'
        });
      } else {
        alert('Prediction failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const stats = getStatistics();

  return (
    <div className="batch-predictor">
      <div className="section-header">
        <h2>Batch ROI Prediction</h2>
        <div className="header-actions">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="file-upload"
            className="file-input"
            ref={(input) => {
              if (input) {
                input.onclick = () => {
                  input.value = null;
                };
              }
            }}
          />
          <button
            className="btn btn-primary btn-medium"
            onClick={() => document.getElementById('file-upload').click()}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Upload CSV'}
          </button>
          <button
            className="btn btn-success btn-medium"
            onClick={() => {
              setShowAddForm(true);
              setVinError(null);
              setVinSuccess(false);
              setAvailableModels([]);
            }}
            disabled={loading}
          >
            Add Vehicle
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {String(error)}</p>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Vehicle Manually</h3>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {/* VIN Decode Section */}
              <div className="vin-section">
                <div className="form-group-inline">
                  <div className="form-group" style={{flex: 1}}>
                    <label>VIN (Optional) - Auto-decode vehicle specs</label>
                    <input
                      type="text"
                      placeholder="Enter 17-character VIN"
                      maxLength="17"
                      value={manualForm.vin}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setManualForm({...manualForm, vin: value});
                        setVinError(null);
                        setVinSuccess(false);
                      }}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '1rem',
                        letterSpacing: '0.05em'
                      }}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleVinDecode}
                    disabled={vinDecoding || manualForm.vin.length !== 17}
                    style={{alignSelf: 'flex-end', minWidth: '140px'}}
                  >
                    {vinDecoding ? 'Decoding...' : 'Decode VIN'}
                  </button>
                </div>
                {vinError && <div className="error-text">Error: {String(vinError)}</div>}
                {vinSuccess && <div className="vin-success" style={{marginTop: '0.5rem', color: '#10B981', fontSize: '0.875rem', fontWeight: '500'}}>Success! Vehicle specs auto-filled</div>}
              </div>

              <div className="form-divider">
                <span>Vehicle Details</span>
              </div>

              <div className="form-grid">
                <AutocompleteInput
                  name="make"
                  value={manualForm.make}
                  onChange={handleManualFormChange}
                  options={ALL_MAKES}
                  label="Make (Manufacturer)"
                  placeholder="Type to search..."
                  required={true}
                />

                <AutocompleteInput
                  name="model"
                  value={manualForm.model}
                  onChange={handleManualFormChange}
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
                    placeholder="2020"
                    min="2000"
                    max="2026"
                    value={manualForm.year}
                    onChange={handleManualFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mileage *</label>
                  <input
                    type="number"
                    name="mileage"
                    placeholder="45000"
                    min="0"
                    value={manualForm.mileage}
                    onChange={handleManualFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-divider">
                <span>Pricing</span>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Sold Price *</label>
                  <input
                    type="number"
                    name="sold_price"
                    placeholder="8500"
                    min="0"
                    value={manualForm.sold_price}
                    onChange={handleManualFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Market Value *</label>
                  <input
                    type="number"
                    name="make_model_year_price_median"
                    placeholder="18000"
                    min="0"
                    value={manualForm.make_model_year_price_median}
                    onChange={handleManualFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-divider">
                <span>Damage Information (Optional)</span>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Primary Damage</label>
                  <select
                    name="primary_damage"
                    value={manualForm.primary_damage}
                    onChange={handleManualFormChange}
                  >
                    <option>MINOR DENT/SCRATCHES</option>
                    <option>FRONT END</option>
                    <option>REAR END</option>
                    <option>SIDE</option>
                    <option>ALL OVER</option>
                    <option>UNDERCARRIAGE</option>
                    <option>MECHANICAL</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Damage Severity (1-5)</label>
                  <input
                    type="number"
                    name="primary_damage_severity"
                    min="1"
                    max="5"
                    step="0.5"
                    value={manualForm.primary_damage_severity}
                    onChange={handleManualFormChange}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleManualSubmit}
                disabled={loading}
              >
                {loading ? 'Predicting...' : 'Add & Predict'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Details Modal */}
      {showDetailsModal && selectedVehicle && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-details" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Vehicle Details - {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>&times;</button>
            </div>
            <div className="modal-body modal-body-scrollable">
              <ResultsDisplay result={{
                success: true,
                predicted_roi: selectedVehicle.predicted_roi,
                actual_roi: selectedVehicle.actual_roi,
                mae: selectedVehicle.mae,
                confidence_range: {
                  min: selectedVehicle.confidence_min,
                  max: selectedVehicle.confidence_max
                },
                interpretation: selectedVehicle.interpretation,
                recommendation: selectedVehicle.recommendation,
                risk_level: selectedVehicle.risk_level
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="results-card-fullwidth">
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Processing {file?.name}...</p>
          </div>
        )}

        {results && stats && (
            <>
              <div className="results-header-bar-compact">
                <div className="filter-buttons-inline">
                    <button
                      className={`filter-btn ${filterDecision === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterDecision('all')}
                    >
                      All ({results.predictions.length})
                    </button>
                    <button
                      className={`filter-btn filter-success ${filterDecision === 'STRONG BUY' ? 'active' : ''}`}
                      onClick={() => setFilterDecision('STRONG BUY')}
                    >
                      Strong Buy ({results.predictions.filter(p => getDecision(p.predicted_roi).label === 'STRONG BUY').length})
                    </button>
                    <button
                      className={`filter-btn filter-warning ${filterDecision === 'CONSIDER' ? 'active' : ''}`}
                      onClick={() => setFilterDecision('CONSIDER')}
                    >
                      Consider ({results.predictions.filter(p => getDecision(p.predicted_roi).label === 'CONSIDER').length})
                    </button>
                    <button
                      className={`filter-btn filter-danger ${filterDecision === 'SKIP' ? 'active' : ''}`}
                      onClick={() => setFilterDecision('SKIP')}
                    >
                      Skip ({results.predictions.filter(p => getDecision(p.predicted_roi).label === 'SKIP').length})
                    </button>
                    <span className="results-count-inline">Showing {processedResults.length} of {results.predictions.length} vehicles</span>
                    <button onClick={downloadResults} className="btn btn-success btn-small">
                      Download CSV
                    </button>
                  </div>
              </div>

              {/* Enhanced Results Table */}
              <div className="results-table-container">
                <div className="table-scroll">
                  <table className="results-table enhanced">
                    <thead>
                      <tr>
                        <th style={{width: '40px'}}></th>
                        <th onClick={() => handleSort('make')} className="sortable">
                          Make {sortColumn === 'make' && <span className="sort-arrow">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                        </th>
                        <th onClick={() => handleSort('model')} className="sortable">
                          Model {sortColumn === 'model' && <span className="sort-arrow">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                        </th>
                        <th onClick={() => handleSort('year')} className="sortable">
                          Year {sortColumn === 'year' && <span className="sort-arrow">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                        </th>
                        <th onClick={() => handleSort('predicted_roi')} className="sortable">
                          ROI {sortColumn === 'predicted_roi' && <span className="sort-arrow">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                        </th>
                        <th onClick={() => handleSort('decision')} className="sortable">
                          Decision {sortColumn === 'decision' && <span className="sort-arrow">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                        </th>
                        <th>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedResults.map((pred, idx) => (
                        <tr key={idx} onClick={() => toggleExpanded(idx)} style={{cursor: 'pointer'}}>
                          <td className="expand-cell">
                            <span className="expand-icon">+</span>
                          </td>
                          <td>{pred.make}</td>
                          <td>{pred.model}</td>
                          <td>{pred.year}</td>
                          <td className={`roi-cell roi-${pred.decision.color}`}>
                            <strong>{pred.predicted_roi ? `${pred.predicted_roi.toFixed(1)}%` : 'N/A'}</strong>
                          </td>
                          <td>
                            <span className={`decision-badge decision-${pred.decision.color}`}>
                              {pred.decision.label}
                            </span>
                          </td>
                          <td className="confidence-cell">
                            {pred.confidence_min && pred.confidence_max
                              ? `${pred.confidence_min.toFixed(1)}% - ${pred.confidence_max.toFixed(1)}%`
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        {!results && !loading && (
          <div className="placeholder-state">
            <div className="placeholder-icon">&rarr;</div>
            <h3>No Vehicles Yet</h3>
            <p>Upload a CSV file or add vehicles manually to begin analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BatchPredictor;
