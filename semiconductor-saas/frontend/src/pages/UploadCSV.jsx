import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle,
  Activity, Loader2, X, AlertTriangle
} from 'lucide-react';
import { uploadCSVForPrediction } from '../services/api';

export default function UploadCSVPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError("Only CSV files are accepted.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setPredictionResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const result = await uploadCSVForPrediction(file);
      setPredictionResult(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload and prediction failed.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPredictionResult(null);
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">CSV Upload Prediction</h1>
        <p className="text-dark-400 mt-1">
          Upload a CSV file containing sensor data for immediate defect prediction
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

      {/* Upload Zone */}
      {!predictionResult && (
        <div className="glass-card p-8 animate-slide-up">
            <div className="max-w-xl mx-auto space-y-6 text-center">
                <div className="mb-8 space-y-2">
                    <Upload className="w-12 h-12 text-primary-400 mx-auto" />
                    <h2 className="text-xl font-semibold text-white">Upload Sensor Data</h2>
                    <p className="text-sm text-dark-400">Select a CSV file to evaluate</p>
                </div>

                <div 
                    className="border-2 border-dashed border-dark-600 rounded-xl p-10 hover:border-primary-500 transition-colors cursor-pointer bg-dark-800/30 flex flex-col items-center justify-center gap-4"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        accept=".csv"
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    
                    {file ? (
                        <>
                            <FileText className="w-10 h-10 text-primary-400" />
                            <div className="text-white font-medium">{file.name}</div>
                            <div className="text-xs text-dark-400">
                                {(file.size / 1024).toFixed(1)} KB
                            </div>
                        </>
                    ) : (
                        <>
                            <FileText className="w-10 h-10 text-dark-500" />
                            <div className="text-dark-300 font-medium">Click to browse your files</div>
                            <div className="text-xs text-dark-500">Only .csv files supported</div>
                        </>
                    )}
                </div>

                <div className="pt-6">
                    <button 
                        onClick={handleUpload} 
                        disabled={!file || uploading} 
                        className="btn-primary flex items-center gap-2 w-full justify-center text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyzing Data...
                            </>
                        ) : (
                            <>
                                <Activity className="w-5 h-5" />
                                Run Prediction
                            </>
                        )}
                    </button>
                </div>
            </div>
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
                Upload Another File
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
