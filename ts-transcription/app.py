"""
Transcription service using HuggingFace Whisper (medium) model.
This is a serverless-style Flask application that receives audio/video files
and returns transcribed text.
"""
import os
import tempfile
import subprocess
from pathlib import Path
from flask import Flask, request, jsonify
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

app = Flask(__name__)

'''
Implementation notes:
1. The Whisper model is loaded on-demand (lazy loading) to optimize GPU memory usage.
   This allows running multiple AI services on the same GPU without memory conflicts.
2. Given that the medium model performed the best in speed and accuracy terms, it was selected as the default model. 
   For better GPUs (3060 Ti and above, >4 GiB), "openai/whisper-large-v2" should be preferred.
3. Whisper was the only model tested here. For other models, the pipeline and processing logic might need adjustments.
'''

# Model configuration
device = "cuda:0" if torch.cuda.is_available() else "cpu"
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
model_id = "openai/whisper-medium"

# Global variable to cache the pipeline after first load
_pipe = None

print(f"Transcription service initialized. Model will be loaded on first request.")
print(f"Device: {device}, Model: {model_id}")


def get_pipeline():
    """
    Lazy load the Whisper pipeline on first request.
    Subsequent calls return the cached pipeline.
    """
    global _pipe
    
    if _pipe is None:
        print(f"Loading Whisper model on device: {device}")
        
        model = AutoModelForSpeechSeq2Seq.from_pretrained(
            model_id, 
            torch_dtype=torch_dtype, 
            low_cpu_mem_usage=True, 
            use_safetensors=True,
            device_map="auto"
        )
        
        processor = AutoProcessor.from_pretrained(model_id)
        
        # Create pipeline without batch_size to avoid batching issues
        _pipe = pipeline(
            "automatic-speech-recognition",
            model=model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            max_new_tokens=128,
            chunk_length_s=30,
            return_timestamps=False,
            torch_dtype=torch_dtype,
            # Note: device parameter removed because model uses device_map="auto"
            generate_kwargs={"task": "transcribe", "language": "english"},
        )
        
        print("Whisper model loaded successfully")
    
    return _pipe


def extract_audio_from_video(video_path, output_path):
    """
    Extract audio from video file using FFmpeg.
    
    Args:
        video_path: Path to input video file
        output_path: Path for output audio file (WAV format)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Use FFmpeg to extract audio as WAV (16kHz mono for better Whisper compatibility)
        command = [
            'ffmpeg',
            '-i', video_path,
            '-vn',  # No video
            '-acodec', 'pcm_s16le',  # PCM 16-bit little-endian
            '-ar', '16000',  # 16kHz sample rate (Whisper's native rate)
            '-ac', '1',  # Mono
            '-y',  # Overwrite output file
            output_path
        ]
        
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=300  # 5 minute timeout for large files
        )
        
        return result.returncode == 0
    
    except Exception as e:
        app.logger.error(f"Audio extraction error: {str(e)}")
        return False


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy", 
        "model": model_id, 
        "device": device,
        "model_loaded": _pipe is not None
    }), 200


@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Transcribe audio/video file to text.
    
    Expects: multipart/form-data with 'file' field
    Returns: JSON with transcribed text or error
    """
    tmp_input_path = None
    tmp_audio_path = None
    
    try:
        # Validate file is present
        if 'file' not in request.files:
            app.logger.error("No file in request")
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            app.logger.error("Empty filename")
            return jsonify({"error": "Empty filename"}), 400
        
        # Get file extension
        file_ext = Path(file.filename).suffix.lower()
        is_video = file_ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm']
        
        app.logger.info(f"Received file: {file.filename}, extension: {file_ext}, is_video: {is_video}")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            file.save(tmp_file.name)
            tmp_input_path = tmp_file.name
        
        app.logger.info(f"Saved to temporary file: {tmp_input_path}")
        
        # If video file, extract audio first
        if is_video:
            app.logger.info(f"Video file detected ({file_ext}), extracting audio...")
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_audio:
                tmp_audio_path = tmp_audio.name
            
            app.logger.info(f"Extracting audio to: {tmp_audio_path}")
            
            success = extract_audio_from_video(tmp_input_path, tmp_audio_path)
            
            if not success or not os.path.exists(tmp_audio_path) or os.path.getsize(tmp_audio_path) == 0:
                app.logger.error(f"Failed to extract audio. Success: {success}, Exists: {os.path.exists(tmp_audio_path) if tmp_audio_path else False}, Size: {os.path.getsize(tmp_audio_path) if tmp_audio_path and os.path.exists(tmp_audio_path) else 0}")
                return jsonify({
                    "success": False,
                    "error": "Failed to extract audio from video file"
                }), 500
            
            # Use extracted audio for transcription
            transcription_path = tmp_audio_path
            app.logger.info(f"Audio extracted successfully ({os.path.getsize(tmp_audio_path)} bytes), will transcribe: {transcription_path}")
        else:
            # Use uploaded audio file directly
            transcription_path = tmp_input_path
            app.logger.info(f"Audio file, will transcribe: {transcription_path}")
        
        # Perform transcription
        app.logger.info("Starting transcription...")
        
        # Get pipeline (lazy loads on first call)
        pipe = get_pipeline()
        
        # Use the pipeline directly - it handles batching internally
        result = pipe(
            transcription_path,
            return_timestamps=False
        )
        
        transcribed_text = result["text"].strip()
        app.logger.info(f"Transcription complete: {len(transcribed_text)} characters")
        
        return jsonify({
            "success": True,
            "text": transcribed_text,
            "model": model_id
        }), 200
    
    except Exception as e:
        app.logger.error(f"Transcription error: {str(e)}")
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": f"Transcription failed: {str(e)}"
        }), 500
    
    finally:
        # Clean up temporary files
        for path in [tmp_input_path, tmp_audio_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except Exception as e:
                    app.logger.warning(f"Failed to delete temp file {path}: {str(e)}")


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
