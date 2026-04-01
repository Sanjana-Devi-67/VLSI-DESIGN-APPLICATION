# Refitting SECOM Dataset and Enabling Manual Entry

The goal is to move from the generated dummy data to the real SECOM dataset, and add the ability to make predictions on a single row of manual data.

## Proposed Changes

---

### Machine Learning Service

#### [MODIFY] ml_service/train_sample_model.py
- Load the `secom.data` and `secom_labels.data` files
- Train the LightGBM model on this real dataset instead of `make_classification()` data
- Ensure the model expects 590 features (the size of the SECOM dataset) instead of the previous 10 features
- Save the newly trained model to [lightgbm_model.pkl](file:///c:/Users/rindh/Downloads/Effii-Energy-main/Effii-Energy-main/lightgbm_model.pkl)

---

### Backend API

#### [MODIFY] backend/schemas.py
- Add a new `ManualPredictionRequest` schema containing a `List[float]` of length 590 to represent a single wafer's sensor readings.

#### [MODIFY] backend/main.py
- Add a new endpoint `POST /predict_manual` that accepts `ManualPredictionRequest`
- This endpoint will format the list into a pandas DataFrame, run the preprocessing pipeline, run inference via LightGBM, and return the [PredictionResponse](file:///c:/Users/rindh/Downloads/Effii-Energy-main/Effii-Energy-main/backend/schemas.py#39-42) without needing an `upload_id`.
- Update the preprocessing pipeline initialization to expect 590 input features if needed.

## Verification Plan

### Automated Tests
- Run `python ml_service/train_sample_model.py` to ensure the real SECOM dataset parses correctly and the model trains successfully.
- Rebuild the Python backend Docker container using the new model and `docker-compose up --build -d backend`.
- Test the new `/predict_manual` endpoint directly using `curl`, passing a JSON payload with 590 dummy floats to verify it returns a valid defect probability.

### Manual Verification
- The user can verify that the new endpoint exists and accepts manual input by navigating to the API docs (`http://localhost:8000/docs`).
