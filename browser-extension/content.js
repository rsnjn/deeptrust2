// Content script to detect and extract media from web pages

let detectedMedia = [];

function detectMedia() {
  detectedMedia = [];
  
  // Detect images
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (img.src && img.naturalWidth > 100 && img.naturalHeight > 100) {
      detectedMedia.push({
        type: 'image',
        url: img.src,
        element: img
      });
    }
  });
  
  // Detect videos
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    if (video.src || video.currentSrc) {
      detectedMedia.push({
        type: 'video',
        url: video.src || video.currentSrc,
        element: video
      });
    }
  });
  
  // Store detected media
  chrome.storage.local.set({ detectedMedia: detectedMedia });
}

// Add visual indicators for analyzed media
function addIndicator(element, score, explanation) {
  const indicator = document.createElement('div');
  indicator.className = 'deeptrust-indicator';
  indicator.style.cssText = `
    position: absolute;
    background: ${score > 70 ? '#ff4444' : score > 40 ? '#ff9944' : '#44ff44'};
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 12px;
    z-index: 10000;
    cursor: pointer;
  `;
  indicator.textContent = `DeepTRUST: ${score}% fake`;
  indicator.title = explanation;
  
  const rect = element.getBoundingClientRect();
  indicator.style.top = `${rect.top + window.scrollY}px`;
  indicator.style.left = `${rect.left + window.scrollX}px`;
  
  document.body.appendChild(indicator);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getMedia') {
    detectMedia();
    sendResponse({ media: detectedMedia });
  } else if (request.action === 'showResult') {
    const media = detectedMedia.find(m => m.url === request.url);
    if (media) {
      addIndicator(media.element, request.score, request.explanation);
    }
  }
});

// Initial media detection
detectMedia();

// Re-detect on page mutations
const observer = new MutationObserver(() => {
  detectMedia();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
