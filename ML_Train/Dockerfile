FROM python:3.10-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML source code, dataset, and models
COPY . ./

# Train the model during build so model.pkl is always ready
RUN python train.py

EXPOSE 5000

# Start FastAPI server on dynamic $PORT provided by Railway
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-5000}"]
