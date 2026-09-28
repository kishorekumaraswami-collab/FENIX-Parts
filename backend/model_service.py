"""
Model Service - Handles model loading and predictions
"""
import pickle
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Any


class CopartROIModel:
    """Copart ROI Prediction Model Service"""

    def __init__(self, model_path: str):
        """Initialize and load the model"""
        print(f"Loading model from: {model_path}")
        with open(model_path, 'rb') as f:
            self.model_package = pickle.load(f)

        self.model = self.model_package['model']
        self.features = self.model_package['features']
        self.label_encoders = self.model_package['label_encoders']
        self.numerical_features = self.model_package['numerical_features']
        self.categorical_features = self.model_package['categorical_features']
        self.metrics = self.model_package['metrics']

        self.current_year = datetime.now().year

        print(f"[OK] Model loaded successfully!")
        print(f"   Version: {self.model_package.get('version', '1.0')}")
        print(f"   Test MAE: {self.metrics['test_mae']:.2f}%")
        print(f"   Test R2: {self.metrics['test_r2']:.4f}")

    def predict_single(self, vehicle_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict ROI for a single vehicle

        Args:
            vehicle_data: Dictionary with vehicle specifications

        Returns:
            Dictionary with prediction results
        """
        try:
            # Create a copy to avoid modifying original
            data = vehicle_data.copy()

            # Calculate vehicle age
            data['vehicle_age'] = self.current_year - data['year']

            # Calculate total damage score
            if 'primary_damage_severity' in data:
                secondary_severity = data.get('secondary_damage_severity', 0.0)
                data['total_damage_score'] = (
                    data['primary_damage_severity'] * 0.7 +
                    secondary_severity * 0.3
                )

            # Encode categorical features
            for col in self.categorical_features:
                if col in data:
                    le = self.label_encoders[col]
                    value = str(data[col])

                    # Handle unseen categories
                    if value not in le.classes_:
                        data[f'{col}_encoded'] = 0
                    else:
                        data[f'{col}_encoded'] = le.transform([value])[0]

            # Create feature vector
            X_pred = pd.DataFrame([data])[self.features]

            # Make prediction
            roi_prediction = float(self.model.predict(X_pred)[0])

            # Calculate confidence based on error distribution
            mae = self.metrics['test_mae']

            # Calculate actual ROI for reference
            actual_roi = None
            if 'sold_price' in data and 'make_model_year_price_median' in data:
                actual_roi = (
                    (data['make_model_year_price_median'] - data['sold_price']) /
                    data['sold_price'] * 100
                )

            return {
                'success': True,
                'predicted_roi': round(roi_prediction, 2),
                'actual_roi': round(actual_roi, 2) if actual_roi else None,
                'mae': round(mae, 2),
                'confidence_range': {
                    'min': round(roi_prediction - mae, 2),
                    'max': round(roi_prediction + mae, 2)
                },
                'interpretation': self._get_interpretation(roi_prediction),
                'recommendation': self._get_recommendation(roi_prediction),
                'risk_level': self._get_risk_level(roi_prediction)
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Predict ROI for multiple vehicles from CSV

        Args:
            df: DataFrame with vehicle data

        Returns:
            DataFrame with predictions added
        """
        results = []

        for idx, row in df.iterrows():
            vehicle_data = row.to_dict()
            result = self.predict_single(vehicle_data)

            if result['success']:
                results.append({
                    'predicted_roi': result['predicted_roi'],
                    'confidence_min': result['confidence_range']['min'],
                    'confidence_max': result['confidence_range']['max'],
                    'interpretation': result['interpretation'],
                    'recommendation': result['recommendation'],
                    'risk_level': result['risk_level']
                })
            else:
                results.append({
                    'predicted_roi': None,
                    'confidence_min': None,
                    'confidence_max': None,
                    'interpretation': 'ERROR',
                    'recommendation': 'N/A',
                    'risk_level': 'N/A',
                    'error': result.get('error', 'Unknown error')
                })

        results_df = pd.DataFrame(results)
        output_df = pd.concat([df.reset_index(drop=True), results_df], axis=1)

        return output_df

    def get_model_info(self) -> Dict[str, Any]:
        """Get model metadata and performance metrics"""
        return {
            'version': self.model_package.get('version', '1.0'),
            'training_date': self.model_package.get('training_date', 'Unknown'),
            'training_samples': self.model_package.get('training_samples', 0),
            'test_samples': self.model_package.get('test_samples', 0),
            'metrics': {
                'test_mae': round(self.metrics['test_mae'], 2),
                'test_rmse': round(self.metrics['test_rmse'], 2),
                'test_r2': round(self.metrics['test_r2'], 4),
                'train_mae': round(self.metrics.get('train_mae', 0), 2),
                'train_r2': round(self.metrics.get('train_r2', 0), 4)
            },
            'features': {
                'total': len(self.features),
                'numerical': len(self.numerical_features),
                'categorical': len(self.categorical_features),
                'list': self.features
            },
            'notes': self.model_package.get('notes', '')
        }

    def get_feature_importance(self, top_n: int = 15) -> List[Dict[str, Any]]:
        """Get top N most important features"""
        feature_importance = self.model_package.get('feature_importance', {})

        if not feature_importance:
            # Fallback to model's feature_importances_ if available
            importances = []
            for idx, feature in enumerate(self.features):
                importance = float(self.model.feature_importances_[idx])
                importances.append({
                    'feature': feature,
                    'importance': round(importance, 4)
                })
            importances.sort(key=lambda x: x['importance'], reverse=True)
            return importances[:top_n]

        # Use stored feature importance
        features = feature_importance.get('feature', [])
        importances = feature_importance.get('importance', [])

        result = []
        for feat, imp in zip(features, importances):
            result.append({
                'feature': feat,
                'importance': round(float(imp), 4)
            })

        result.sort(key=lambda x: x['importance'], reverse=True)
        return result[:top_n]

    @staticmethod
    def _get_interpretation(roi: float) -> str:
        """Get ROI interpretation"""
        if roi > 50:
            return 'HIGH ROI - Strong investment opportunity'
        elif roi > 20:
            return 'MEDIUM ROI - Moderate profit potential'
        else:
            return 'LOW/NEGATIVE ROI - Avoid this bid'

    @staticmethod
    def _get_recommendation(roi: float) -> str:
        """Get bid recommendation"""
        if roi > 50:
            return 'BID AGGRESSIVELY'
        elif roi > 20:
            return 'BID CAUTIOUSLY'
        else:
            return 'PASS ON THIS VEHICLE'

    @staticmethod
    def _get_risk_level(roi: float) -> str:
        """Get risk level"""
        if roi > 50:
            return 'LOW'
        elif roi > 20:
            return 'MEDIUM'
        elif roi > 0:
            return 'HIGH'
        else:
            return 'VERY HIGH'
