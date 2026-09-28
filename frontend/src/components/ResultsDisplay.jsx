import React from 'react';

function ResultsDisplay({ result }) {
  if (!result || !result.success) {
    return null;
  }

  const { predicted_roi, actual_roi, confidence_range, interpretation, recommendation, risk_level, mae } = result;

  // Determine color based on ROI
  const getRoiColor = (roi) => {
    if (roi > 50) return '#10b981'; // Green
    if (roi > 20) return '#f59e0b'; // Yellow
    if (roi > 0) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getRiskColor = (risk) => {
    const colors = {
      'LOW': '#10b981',
      'MEDIUM': '#f59e0b',
      'HIGH': '#f97316',
      'VERY HIGH': '#ef4444'
    };
    return colors[risk] || '#6b7280';
  };

  return (
    <div className="results-display">
      {/* ROI Card */}
      <div className="result-card roi-card" style={{ borderColor: getRoiColor(predicted_roi) }}>
        <div className="card-header">
          <h3>Predicted ROI</h3>
        </div>
        <div className="card-body">
          <div className="roi-value" style={{ color: getRoiColor(predicted_roi) }}>
            {predicted_roi}%
          </div>
          {actual_roi !== null && (
            <div className="actual-roi">
              <span>Actual ROI: {actual_roi}%</span>
            </div>
          )}
          <div className="confidence-range">
            <span>Expected ROI Range (±{mae}%):</span>
            <div className="range-bar">
              <div className="range-fill" style={{
                width: '100%',
                background: `linear-gradient(to right, ${getRoiColor(confidence_range.min)}, ${getRoiColor(confidence_range.max)})`
              }}></div>
            </div>
            <div className="range-labels">
              <span>{confidence_range.min}%</span>
              <span>{confidence_range.max}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interpretation Card */}
      <div className="result-card">
        <div className="card-header">
          <h3>Assessment</h3>
        </div>
        <div className="card-body">
          <div className="assessment-item">
            <span className="label">Interpretation:</span>
            <span className="value">{interpretation}</span>
          </div>
          <div className="assessment-item">
            <span className="label">Recommendation:</span>
            <span className="value recommendation">{recommendation}</span>
          </div>
          <div className="assessment-item">
            <span className="label">Risk Level:</span>
            <span className="value risk-badge" style={{
              backgroundColor: getRiskColor(risk_level),
              color: 'white'
            }}>
              {risk_level}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Indicator */}
      <div className="result-card">
        <div className="card-header">
          <h3>Decision Guide</h3>
        </div>
        <div className="card-body">
          {predicted_roi > 50 && (
            <div className="decision-box decision-high">
              <div className="decision-text">
                <strong>Strong Investment</strong>
                <p>This vehicle shows excellent profit potential. Consider bidding aggressively within your budget constraints.</p>
              </div>
            </div>
          )}
          {predicted_roi > 20 && predicted_roi <= 50 && (
            <div className="decision-box decision-medium">
              <div className="decision-text">
                <strong>Moderate Opportunity</strong>
                <p>This vehicle offers decent profit margins. Bid cautiously and factor in repair costs carefully.</p>
              </div>
            </div>
          )}
          {predicted_roi > 0 && predicted_roi <= 20 && (
            <div className="decision-box decision-low">
              <div className="decision-text">
                <strong>Marginal Profit</strong>
                <p>Low profit margin. Consider passing unless you have special expertise with this vehicle type.</p>
              </div>
            </div>
          )}
          {predicted_roi <= 0 && (
            <div className="decision-box decision-negative">
              <div className="decision-text">
                <strong>Avoid This Vehicle</strong>
                <p>Negative ROI predicted. This vehicle is likely to result in a loss. Pass on this bid.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsDisplay;
