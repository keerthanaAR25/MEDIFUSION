import os
import tempfile
from typing import Optional

def transcribe_audio(audio_data: bytes, filename: str = "audio.wav") -> str:
    """
    Transcribe audio using Whisper (if available) or return descriptive note.
    Install whisper with: pip install openai-whisper
    """
    try:
        import whisper
        
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            f.write(audio_data)
            temp_path = f.name
        
        try:
            model = whisper.load_model("base.en")
            result = model.transcribe(temp_path)
            return result["text"].strip()
        finally:
            os.unlink(temp_path)
            
    except ImportError:
        # Whisper not installed - return informative message
        size_kb = len(audio_data) / 1024
        return f"[Audio file received: {filename}, {size_kb:.0f}KB. Whisper ASR module not installed. Install with: pip install openai-whisper. Add consultation summary in Clinical Notes for AI analysis.]"
    except Exception as e:
        return f"[Audio transcription error: {str(e)[:100]}. Please add consultation notes manually.]"


def get_audio_summary(filename: str, size_bytes: int) -> dict:
    """Return audio file metadata"""
    return {
        "filename": filename,
        "size_kb": size_bytes / 1024,
        "format": filename.split('.')[-1].upper() if '.' in filename else 'Unknown',
        "status": "uploaded"
    }