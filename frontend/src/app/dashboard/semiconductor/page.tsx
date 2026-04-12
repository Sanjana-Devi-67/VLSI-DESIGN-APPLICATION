"use client"

import { useState } from "react"

const API_URL = "http://127.0.0.1:8002"

export default function SemiconductorPage() {

  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleUpload = async () => {

    if (!file) {
      alert("Please select a CSV file")
      return
    }

    setLoading(true)
    setError("")

    try {

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${API_URL}/upload_predict`, {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      setResult(data)

    } catch (err) {

      console.error(err)
      setError("Upload failed")

    }

    setLoading(false)
  }

  return (

    <div className="space-y-6">

      {/* Title */}

      <div>
        <h1 className="text-2xl font-bold text-white">
          Semiconductor SaaS
        </h1>
        <p className="text-slate-400">
          Upload manufacturing sensor CSV and predict wafer defects
        </p>
      </div>


      {/* Upload Card */}

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl p-6 space-y-4">

        <h2 className="text-lg font-semibold text-white">
          Upload Sensor Data
        </h2>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            if (e.target.files) {
              setFile(e.target.files[0])
            }
          }}
          className="
            block w-full text-sm text-slate-300
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-cyan-500 file:text-black
            hover:file:bg-cyan-600
          "
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className="
            bg-cyan-500
            hover:bg-cyan-600
            text-black
            px-6 py-2
            rounded-lg
            font-semibold
            transition
            disabled:opacity-50
          "
        >
          {loading ? "Uploading..." : "Upload & Predict"}
        </button>

      </div>


      {/* Error */}

      {error && (

        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg">
          {error}
        </div>

      )}


      {/* Results */}

      {result && (

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl p-6 space-y-4">

          <h2 className="text-lg font-semibold text-white">
            Prediction Results
          </h2>

          {/* Probability */}

          {result?.prediction && (

            <div className="grid grid-cols-2 gap-6">

              <div className="bg-slate-800 p-4 rounded-lg">
                <div className="text-slate-400 text-sm">
                  Defect Probability
                </div>

                <div className="text-2xl font-bold text-cyan-400">
                  {(
                    result.prediction.defect_probability * 100
                  ).toFixed(2)} %
                </div>
              </div>


              <div className="bg-slate-800 p-4 rounded-lg">
                <div className="text-slate-400 text-sm">
                  Prediction
                </div>

                <div className="text-2xl font-bold text-white">
                  {result.prediction.prediction_label}
                </div>
              </div>

            </div>

          )}


          {/* Feature Importance */}

          {result?.prediction?.feature_importances && (

            <div>

              <h3 className="text-md font-semibold text-white mb-3">
                Feature Importance
              </h3>

              <div className="bg-slate-800 p-4 rounded-lg overflow-auto text-sm">

                <pre>
                  {JSON.stringify(
                    result.prediction.feature_importances,
                    null,
                    2
                  )}
                </pre>

              </div>

            </div>

          )}

        </div>

      )}

    </div>

  )
}