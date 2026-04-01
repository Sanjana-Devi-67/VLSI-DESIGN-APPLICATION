import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, CheckCircle, AlertCircle,
  ArrowRight, Loader2, X, AlertTriangle
} from 'lucide-react';
import { getRequiredFeatures, predictManual } from '../services/api';

export default function ManualPredictPage() {
  const navigate = useNavigate();
  const [requiredFeatures, setRequiredFeatures] = useState([]);
  const [featureValues, setFeatureValues] = useState({});
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoadingFeatures(true);
      const data = await getRequiredFeatures();
      setRequiredFeatures(data.features || []);
      
      // Initialize state with default values (0.0)
      const initialValues = {};
      (data.features || []).forEach(f => {
        // Handle both old string format and new object format
        const fid = typeof f === 'string' ? f : f.id;
        initialValues[fid] = '';
      });
      setFeatureValues(initialValues);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch required features. Is the backend running?');
    } finally {
      setLoadingFeatures(false);
    }
  };

  const handleInputChange = (featureId, value) => {
    setFeatureValues(prev => ({
      ...prev,
      [featureId]: value
    }));
  };

  const handlePredict = async () => {
    // Validate all inputs are present and numeric
    for (const feat of requiredFeatures) {
      const fid = typeof feat === 'string' ? feat : feat.id;
      if (featureValues[fid] === '' || isNaN(Number(featureValues[fid]))) {
        const name = typeof feat === 'string' ? feat : feat.description;
        setError(`Please provide a valid numeric value for ${name}`);
        return;
      }
    }

    setPredicting(true);
    setError(null);
    try {
        // Convert string inputs to floats
        const numericFeatures = {};
        Object.keys(featureValues).forEach(k => {
            numericFeatures[k] = parseFloat(featureValues[k]);
        });

      const result = await predictManual(numericFeatures);
      setPredictionResult(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed.');
    } finally {
      setPredicting(false);
    }
  };

  const resetForm = () => {
    setPredictionResult(null);
    setError(null);
    const initialValues = {};
    requiredFeatures.forEach(f => {
      initialValues[f] = '';
    });
    setFeatureValues(initialValues);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Manual Prediction</h1>
        <p className="text-dark-400 mt-1">
          Enter the top 5 most important sensor values manually
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="glass-card p-4 border-red-500/30 bg-red-500/5 flex items-start gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-dark-400 hover:text-dark-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Inputs Zone */}
      {!predictionResult && (
        <div className="glass-card p-8 animate-slide-up">
            {loadingFeatures ? (
                <div className="flex flex-col items-center justify-center p-12 text-dark-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p>Loading required features from model...</p>
                </div>
            ) : requiredFeatures.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-amber-500">
                    <AlertTriangle className="w-8 h-8 mb-4" />
                    <p>No features returned. Ensure the ML model is fully trained.</p>
                </div>
            ) : (
                <div className="max-w-xl mx-auto space-y-6">
                    <div className="text-center mb-8 space-y-2">
                        <Activity className="w-12 h-12 text-primary-400 mx-auto" />
                        <h2 className="text-xl font-semibold text-white">Input Sensor Data</h2>
                        <p className="text-sm text-dark-400">The model requires these specific sensor readings.</p>
                    </div>

                    <div className="space-y-4">
                        {requiredFeatures.map((feature) => {
                            const isObj = typeof feature === 'object';
                            const fid = isObj ? feature.id : feature;
                            const fdesc = isObj ? feature.description : feature;
                            
                            let labelStr = fdesc;
                            if (isObj && feature.min !== undefined && feature.max !== undefined) {
                                labelStr = `${fdesc} (Ideal: ${feature.ideal !== undefined ? feature.ideal : 'N/A'}, Range: ${feature.min.toFixed(2)} to ${feature.max.toFixed(2)})`;
                            }

                            return (
                            <div key={fid} className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-dark-200 uppercase tracking-wider">
                                    {labelStr}
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={featureValues[fid]}
                                    onChange={(e) => handleInputChange(fid, e.target.value)}
                                    placeholder={`Enter value for ${fdesc}`}
                                    className="block w-full rounded-md border-0 bg-dark-800/50 py-2.5 px-4 text-white shadow-sm ring-1 ring-inset ring-dark-700 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6 transition-all"
                                />
                            </div>
                            );
                        })}
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button onClick={handlePredict} disabled={predicting} className="btn-primary flex items-center gap-2 w-full justify-center text-lg py-3">
                            {predicting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Running Model...
                                </>
                            ) : (
                                <>
                                    <Activity className="w-5 h-5" />
                                    Predict Defect
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Prediction Result */}
      {predictionResult && (
        <div className="glass-card p-8 animate-slide-up">
          <div className="text-center space-y-6">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              predictionResult.prediction.prediction_label === 'DEFECT'
                ? 'bg-red-500/20'
                : 'bg-emerald-500/20'
            }`}>
              <span className="text-4xl">
                {predictionResult.prediction.prediction_label === 'DEFECT' ? '⚠️' : '✅'}
              </span>
            </div>
            <div>
              <span className={
                predictionResult.prediction.prediction_label === 'DEFECT'
                  ? 'badge-defect text-base px-5 py-2'
                  : 'badge-ok text-base px-5 py-2'
              }>
                {predictionResult.prediction.prediction_label === 'DEFECT'
                  ? '⚠ DEFECT DETECTED'
                  : '✓ NO DEFECT'}
              </span>
              <p className="text-5xl font-bold mt-4 tracking-tight text-white">
                {(predictionResult.prediction.defect_probability * 100).toFixed(1)}%
              </p>
              <p className="text-dark-400 mt-1">Defect Probability</p>
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <button onClick={resetForm} className="btn-secondary">
                New Prediction
              </button>
              <button onClick={() => navigate('/results')} className="btn-primary">
                View History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
