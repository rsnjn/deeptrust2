// Background service worker for API communication

const BACKEND_URL = 'https://deeptrust2-backend-9dnie8pyo-rsnjns-projects.vercel.app/';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeMedia') {
    analyzeMedia(request.url, request.type)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function analyzeMedia(mediaUrl, mediaType) {
  
