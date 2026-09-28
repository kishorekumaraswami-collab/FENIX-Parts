import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function ModelDashboard() {
  const [modelInfo, setModelInfo] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModelData();
  }, []);

  const fetchModelData = async () => {
    setLoading(true);
    try {
      const [infoResponse, featuresResponse] = await Promise.all([
        axios.get(`${API_URL}/model/info`),
        axios.get(`${API_URL}/model/features?top_n=15`)
      ]);

      setModelInfo(infoResponse.data);
      setFeatures(featuresResponse.data.features);
      setError(null);
    } catch (err) {
      setError('Failed to load model information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading model dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={fetchModelData} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="model-dashboard">
      <div className="section-header">
        <h2>Model Performance Dashboard</h2>
        <p>Overview of model metrics and feature importance</p>
      </div>

      {/* Model Info Cards */}
      <div className="info-grid">
        <div className="info-card">
          <div className="info-label">Model Version</div>
          <div className="info-value">{modelInfo?.version}</div>
        </div>
        <div className="info-card">
          <div className="info-label">Training Date</div>
          <div className="info-value">{modelInfo?.training_date}</div>
        </div>
        <div className="info-card">
          <div className="info-label">Training Samples</div>
          <div className="info-value">{modelInfo?.training_samples?.toLocaleString()}</div>
        </div>
        <div className="info-card">
          <div className="info-label">Test Samples</div>
          <div className="info-value">{modelInfo?.test_samples?.toLocaleString()}</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="metrics-section">
        <h3>Performance Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-card metric-excellent">
            <div className="metric-label">Test R² Score</div>
            <div className="metric-value">{modelInfo?.metrics.test_r2}</div>
            <div className="metric-description">
              Model explains {(modelInfo?.metrics.test_r2 * 100).toFixed(1)}% of ROI variance
            </div>
          </div>

          <div className="metric-card metric-good">
            <div className="metric-label">Test MAE</div>
            <div className="metric-value">±{modelInfo?.metrics.test_mae}%</div>
            <div className="metric-description">
              Average prediction error
            </div>
          </div>

          <div className="metric-card metric-info">
            <div className="metric-label">Test RMSE</div>
            <div className="metric-value">±{modelInfo?.metrics.test_rmse}%</div>
            <div className="metric-description">
              Root mean squared error
            </div>
          </div>

          <div className="metric-card metric-info">
            <div className="metric-label">Total Features</div>
            <div className="metric-value">{modelInfo?.features.total}</div>
            <div className="metric-description">
              {modelInfo?.features.numerical} numerical, {modelInfo?.features.categorical} categorical
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance Chart */}
      <div className="chart-section">
        <h3>Top 15 Feature Importances</h3>
        <p className="chart-description">
          These features have the most influence on ROI predictions
        </p>

        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={features}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="feature" type="category" />
            <Tooltip />
            <Legend />
            <Bar dataKey="importance" fill="#3b82f6" name="Importance Score" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Feature List */}
      <div className="features-list-section">
        <h3>Feature Details</h3>
        <div className="features-table-container">
          <table className="features-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Feature</th>
                <th>Importance</th>
                <th>Impact</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td className="feature-name">{feature.feature}</td>
                  <td>{feature.importance.toFixed(4)}</td>
                  <td>
                    <div className="importance-bar-container">
                      <div
                        className="importance-bar"
                        style={{
                          width: `${(feature.importance / features[0].importance) * 100}%`,
                          backgroundColor: idx < 5 ? '#10b981' : idx < 10 ? '#3b82f6' : '#6b7280'
                        }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Notes */}
      {modelInfo?.notes && (
        <div className="notes-section">
          <h3>Model Notes</h3>
          <p>{modelInfo.notes}</p>
        </div>
      )}

      {/* Model Quality Badge */}
      <div className="quality-badge-section">
        <div className="quality-badge">
          <div className="badge-icon">✓</div>
          <div className="badge-content">
            <h3>Production-Ready Model</h3>
            <p>
              This model has achieved {(modelInfo?.metrics.test_r2 * 100).toFixed(1)}% R² score with
              an average error of only ±{modelInfo?.metrics.test_mae}%, making it suitable for
              real-world deployment in Phoenix Auto Parts' bid screening process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModelDashboard;
