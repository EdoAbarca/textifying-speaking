"""
Summarization service using HuggingFace mT5 multilingual model.
This Flask application receives text and returns summarized text.
Supports multiple languages through mT5_multilingual_XLSum.
"""
import os
from flask import Flask, request, jsonify
import torch
from transformers import pipeline

app = Flask(__name__)

'''
Implementation notes:
1. The mT5 model is loaded on-demand (lazy loading) to optimize GPU memory usage.
   This allows running multiple AI services on the same GPU without memory conflicts.
2. mT5_multilingual_XLSum supports 45+ languages for comprehensive international coverage.
'''

# Model configuration
device = 0 if torch.cuda.is_available() else -1
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
model_id = "csebuetnlp/mT5_multilingual_XLSum"

# Global variable to cache the summarizer after first load
_summarizer = None

print(f"Summarization service initialized. Model will be loaded on first request.")
print(f"Device: {'cuda' if device == 0 else 'cpu'}, Model: {model_id}")


def get_summarizer():
    """
    Lazy load the summarization pipeline on first request.
    Subsequent calls return the cached pipeline.
    """
    global _summarizer
    
    if _summarizer is None:
        print(f"Loading summarization model on device: {'cuda' if device == 0 else 'cpu'}")
        
        # Create summarization pipeline
        _summarizer = pipeline(
            "summarization",
            model=model_id,
            torch_dtype=torch_dtype,
            device=device,
        )
        
        print("Summarization model loaded successfully")
    
    return _summarizer


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "model": model_id,
        "device": "cuda" if device == 0 else "cpu",
        "model_loaded": _summarizer is not None
    }), 200


@app.route('/summarize', methods=['POST'])
def summarize():
    """
    Summarize text.
    
    Expects: JSON with 'text' field
    Returns: JSON with summarized text or error
    """
    try:
        # Validate request
        if not request.is_json:
            app.logger.error("Request is not JSON")
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        
        if 'text' not in data:
            app.logger.error("No text in request")
            return jsonify({"error": "No text provided"}), 400
        
        text = data['text']
        
        if not text or not text.strip():
            app.logger.error("Empty text")
            return jsonify({"error": "Empty text"}), 400
        
        app.logger.info(f"Received text for summarization: {len(text)} characters")
        
        # Get summarizer (lazy loads on first call)
        summarizer = get_summarizer()
        
        # Perform summarization
        # mT5 supports multilingual text and works with various input lengths
        # Max length controls output length
        # Min length ensures meaningful summaries
        app.logger.info("Starting summarization...")
        
        # Split long texts into chunks if necessary
        max_chunk_length = 512  # mT5's optimal input length
        text_length = len(text.split())
        
        if text_length > max_chunk_length:
            # For very long texts, chunk and summarize
            app.logger.info(f"Text too long ({text_length} words), chunking...")
            words = text.split()
            chunks = []
            for i in range(0, len(words), max_chunk_length):
                chunk = ' '.join(words[i:i + max_chunk_length])
                chunks.append(chunk)
            
            # Summarize each chunk
            chunk_summaries = []
            for idx, chunk in enumerate(chunks):
                app.logger.info(f"Summarizing chunk {idx + 1}/{len(chunks)}")
                result = summarizer(
                    chunk,
                    max_length=150,
                    min_length=30,
                    do_sample=False,
                    truncation=True
                )
                chunk_summaries.append(result[0]['summary_text'])
            
            # Combine chunk summaries
            combined_summary = ' '.join(chunk_summaries)
            
            # If combined summary is still too long, summarize it again
            if len(combined_summary.split()) > max_chunk_length:
                app.logger.info("Combined summary too long, summarizing again...")
                result = summarizer(
                    combined_summary,
                    max_length=200,
                    min_length=50,
                    do_sample=False,
                    truncation=True
                )
                summary_text = result[0]['summary_text']
            else:
                summary_text = combined_summary
        else:
            # Text is short enough, summarize directly
            result = summarizer(
                text,
                max_length=150,
                min_length=30,
                do_sample=False,
                truncation=True
            )
            summary_text = result[0]['summary_text']
        
        app.logger.info(f"Summarization complete: {len(summary_text)} characters")
        
        return jsonify({
            "success": True,
            "summary": summary_text,
            "model": model_id
        }), 200
    
    except Exception as e:
        app.logger.error(f"Summarization error: {str(e)}")
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": f"Summarization failed: {str(e)}"
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
