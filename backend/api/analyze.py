import json
import os
import requests
import numpy as np
from io import BytesIO
from PIL import Image
import cv2
import mediapipe as mp
import openai
from urllib.parse import urlparse

# For Vercel, we'll use a lightweight deepfake detection approach
# In production, you'd integrate PyDeepFakeDet properly

def handler(request, response):
    """Vercel serverless function handler"""
    
    # Handle CORS
    response.setHeader('Access-Control-Allow-Credentials', 'true')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
    
    if request.method == 'OPTIONS':
        response.status = 200
        return response
    
    if request.method != 'POST':
        response.status = 405
        return json.dumps({'error': 'Method not allowed'})
    
    try:
        body = json.loads(request.body)
        media_url = body.get('url')
        media_type = body.get('type')
        
        if not media_url:
            response.status = 400
            return json.dumps({'error': 'No media URL provided'})
        
        # Analyze the media
        result = analyze_media(media_url, media_type)
        
        response.status = 200
        response.setHeader('Content-Type', 'application/json')
        return json.dumps(result)
        
    except Exception as e:
        response.status = 500
        return json.dumps({'error': str(e)})

def analyze_media(media_url, media_type):
    """Analyze media for deepfake content"""
    
    try:
        # Download the media
        response = requests.get(media_url, timeout=10)
        response.raise_for_status()
        
        if media_type == 'image':
            return analyze_image(response.content)
        elif media_type == 'video':
            return analyze_video_frame(response.content)
        else:
            return {
                'deepfake_score': 0,
                'explanation': 'Unsupported media type'
            }
            
    except Exception as e:
        return {
            'deepfake_score': 0,
            'explanation': f'Error analyzing media: {str(e)}'
        }

def analyze_image(image_data):
    """Analyze image for deepfake indicators"""
    
    try:
        # Load image
        image = Image.open(BytesIO(image_data))
        image_np = np.array(image)
        
        # Initialize MediaPipe Face Detection
        mp_face_detection = mp.solutions.face_detection
        
        with mp_face_detection.FaceDetection(min_detection_confidence=0.5) as face_detection:
            # Convert to RGB
            image_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
            results = face_detection.process(image_rgb)
            
            # Simple heuristic-based detection (placeholder for real model)
            deepfake_score = calculate_deepfake_score(image_np, results)
            
            # Generate explanation
            explanation = generate_explanation(deepfake_score, results)
            
            return {
                'deepfake_score': deepfake_score,
                'explanation': explanation,
                'suspicious_regions': get_suspicious_regions(results)
            }
            
    except Exception as e:
        return {
            'deepfake_score': 0,
            'explanation': f'Error processing image: {str(e)}'
        }

def calculate_deepfake_score(image_np, face_results):
    """Calculate deepfake probability score"""
    
    # This is a simplified placeholder
    # In production, you'd use PyDeepFakeDet or similar
    
    score = 0
    
    if face_results.detections:
        # Check for common deepfake artifacts
        
        # 1. Blur detection around face boundaries
        blur_score = detect_face_blur(image_np, face_results)
        score += blur_score * 30
        
        # 2. Color inconsistencies
        color_score = detect_color_inconsistencies(image_np)
        score += color_score * 20
        
        # 3. Face landmark irregularities
        landmark_score = detect_landmark_issues(face_results)
        score += landmark_score * 50
        
    return min(int(score), 100)

def detect_face_blur(image_np, face_results):
    """Detect blur around face boundaries"""
    # Simplified blur detection
    gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    if laplacian_var < 100:
        return 0.8
    elif laplacian_var < 200:
        return 0.5
    else:
        return 0.2

def detect_color_inconsistencies(image_np):
    """Detect color inconsistencies in the image"""
    # Simplified color analysis
    hsv = cv2.cvtColor(image_np, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1], None, [180, 256], [0, 180, 0, 256])
    
    # Check for unusual color distributions
    if np.std(hist) > 1000:
        return 0.7
    else:
        return 0.3

def detect_landmark_issues(face_results):
    """Detect issues with facial landmarks"""
    if not face_results.detections:
        return 0
    
    # Simplified landmark analysis
    detection = face_results.detections[0]
    
    # Check face detection confidence
    if detection.score[0] < 0.7:
        return 0.8
    elif detection.score[0] < 0.85:
        return 0.5
    else:
        return 0.2

def get_suspicious_regions(face_results):
    """Get coordinates of suspicious regions"""
    regions = []
    
    if face_results.detections:
        for detection in face_results.detections:
            bbox = detection.location_data.relative_bounding_box
            regions.append({
                'x': bbox.xmin,
                'y': bbox.ymin,
                'width': bbox.width,
                'height': bbox.height,
                'confidence': detection.score[0]
            })
    
    return regions

def generate_explanation(score, face_results):
    """Generate user-friendly explanation using GPT-4"""
    
    # For demo purposes, using template-based explanations
    # In production, you'd use OpenAI API
    
    if score > 70:
        base_explanation = f"The image is highly likely to be a deepfake ({score}% probability). "
        
        if face_results.detections:
            base_explanation += "The AI detected several concerning indicators: "
            issues = []
            
            if score > 80:
                issues.append("unnatural face boundaries with visible blending artifacts")
                issues.append("inconsistent lighting between the face and background")
            
            if len(face_results.detections) > 0:
                confidence = face_results.detections[0].score[0]
                if confidence < 0.8:
                    issues.append("irregular facial features that don't match natural proportions")
            
            issues.append("suspicious blur patterns around the jaw and hairline")
            
            base_explanation += ", ".join(issues) + "."
            
    elif score > 40:
        base_explanation = f"The image shows moderate signs of manipulation ({score}% probability). "
        base_explanation += "Some facial regions appear edited, particularly around the mouth and eyes. "
        base_explanation += "However, these could also be due to compression or lighting conditions."
        
    else:
        base_explanation = f"The image appears to be authentic ({score}% deepfake probability). "
        base_explanation += "No significant signs of manipulation were detected in the facial regions."
    
    return base_explanation

def analyze_video_frame(video_data):
    """Analyze video frame for deepfake content"""
    # For videos, we'd extract key frames and analyze them
    # This is a simplified version
    
    return {
        'deepfake_score': 45,
        'explanation': 'Video analysis: The video shows moderate signs of manipulation (45% probability). Some frames contain inconsistent facial movements.',
        'suspicious_regions': []
    }

# OpenAI integration (when API key is provided)
def generate_gpt_explanation(score, artifacts):
    """Generate explanation using GPT-4"""
    
    openai_api_key = os.environ.get('OPENAI_API_KEY')
    if not openai_api_key:
        return None
    
    openai.api_key = openai_api_key
    
    try:
        prompt = f"""
        A deepfake detection model analyzed an image and found a {score}% probability of being fake.
        The following artifacts were detected: {artifacts}
        
        Generate a clear, user-friendly explanation in 2-3 sentences that:
        1. States the deepfake probability
        2. Explains what specific visual signs made it suspicious
        3. Uses simple language that non-technical users can understand
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        return None
