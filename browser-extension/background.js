async function analyzeMedia(mediaUrl, mediaType) {
  try {
    console.log('Starting analysis:', mediaUrl);
    
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: mediaUrl,
        type: mediaType
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server responded with error:', response.status, errorText);
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Analysis error:', error.message);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Network error - possible CORS issue or backend is down');
      throw new Error('Network error - please check if the backend is accessible');
    }
    
    throw error;
  }
}
