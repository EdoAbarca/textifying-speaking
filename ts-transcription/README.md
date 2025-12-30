# Transcription Service

Python-based transcription service using HuggingFace Whisper (small) model.

## Features
- Automatic speech recognition using OpenAI Whisper (small)
- RESTful API with Flask
- Docker containerized with CUDA 11.8.0 support
- GPU acceleration support (when nvidia-container-toolkit is installed)
- Video file support with FFmpeg audio extraction
- Numpy 1.24.3 for compatibility with PyTorch 2.1.2

## Endpoints

### Health Check
```
GET /health
```
Returns service status and model information.

### Transcribe Audio
```
POST /transcribe
Content-Type: multipart/form-data
```
Upload an audio file for transcription.

**Request:**
- `file`: Audio file (mp3, wav, m4a, mp4)

**Response:**
```json
{
  "success": true,
  "text": "Transcribed text content...",
  "model": "openai/whisper-small"
}
```

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python app.py
```

## Docker

```bash
# Build image
docker build -t ts-transcription .

# Run container
docker run -p 5000:5000 ts-transcription
```
