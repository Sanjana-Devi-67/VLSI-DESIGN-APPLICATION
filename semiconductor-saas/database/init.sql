-- Semiconductor AI SaaS Database Schema

CREATE TABLE IF NOT EXISTS sensor_uploads (
    id SERIAL PRIMARY KEY,
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filename VARCHAR(255),
    num_rows INTEGER,
    num_features INTEGER,
    raw_data JSONB
);

CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    upload_id INTEGER REFERENCES sensor_uploads(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    defect_probability FLOAT NOT NULL,
    prediction_label VARCHAR(50) NOT NULL,
    sensor_summary JSONB,
    feature_importances JSONB,
    num_samples INTEGER DEFAULT 1
);

-- Index for faster lookups
CREATE INDEX idx_predictions_timestamp ON predictions(timestamp DESC);
CREATE INDEX idx_predictions_label ON predictions(prediction_label);
CREATE INDEX idx_sensor_uploads_time ON sensor_uploads(upload_time DESC);
