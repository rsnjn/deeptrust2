import requests

def generate_ai_explanation_free(score, artifacts):
    """Generate explanation using Hugging Face's free inference API"""
    
    # No API key needed for public models!
    API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-base"
    
    prompt = f"Explain why an image might be a deepfake with {score}% probability. Mention these issues: {artifacts}. Keep it simple and under 50 words."
    
    try:
        response = requests.post(
            API_URL,
            json={"inputs": prompt},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                return result[0].get('generated_text', '')
    except:
        pass
    
    # Fallback to template
    return None
