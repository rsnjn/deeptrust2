// Background service worker for API communication

const BACKEND_URL = 'https://deeptrust2-backend-9dnie8pyo-rsnjns-projects.vercel.app'; // UPDATE THIS!

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeMedia') {
    analyzeMedia(request.url, request.type)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function analyzeMedia(mediaUrl, mediaType) {
  try {
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
      throw new Error('Analysis failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// Context menu for right-click analysis
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyzeWithDeepTRUST',
    title: 'Analyze with DeepTRUST',
    contexts: ['image', 'video']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'analyzeWithDeepTRUST') {
    const mediaUrl = info.srcUrl;
    const mediaType = info.mediaType;
    
    try {
      const result = await analyzeMedia(mediaUrl, mediaType);
      
      // Send result to content script
      chrome.tabs.sendMessage(tab.id, {
        action: 'showResult',
        url: mediaUrl,
        score: result.deepfake_score,
        explanation: result.explanation
      });
    } catch (error) {
      console.error('Context menu analysis error:', error);
    }
  }
});
