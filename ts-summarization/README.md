# Summarization Service

Flask-based text summarization service using HuggingFace transformers.

## Model

Uses `csebuetnlp/mT5_multilingual_XLSum` for multilingual abstractive text summarization.

This model supports multiple languages and provides high-quality summaries across different text domains.

## Endpoints

### Health Check

```bash
GET /health
```

Returns service status and model information.

### Summarize Text

```bash
POST /summarize
Content-Type: application/json

{
  "text": "Your text to summarize here..."
}
```

Returns:
```json
{
  "success": true,
  "summary": "Summarized text...",
  "model": "csebuetnlp/mT5_multilingual_XLSum"
}
```

## Features

- Multilingual support (45+ languages)
- Automatic chunking for long texts (>512 words)
- GPU acceleration when available
- Configurable summary length (30-150 tokens)
- Error handling and logging

## Environment Variables

- `PORT`: Service port (default: 5001)

## Running Locally

```bash
pip install -r requirements.txt
python app.py
```

## Docker

```bash
docker build -t ts-summarization .
docker run -p 5001:5001 ts-summarization
```
