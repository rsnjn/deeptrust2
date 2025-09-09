document.addEventListener('DOMContentLoaded', () => {
  loadMedia();
  
  document.getElementById('scanPage').addEventListener('click', loadMedia);
  document.getElementById('settings').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});

async function loadMedia() {
  const mediaList = document.getElementById('mediaList');
  mediaList.innerHTML = '<p class="loading">Detecting media on this page...</p>';
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getMedia' }, (response) => {
      if (response && response.media && response.media.length > 0) {
        displayMedia(response.media);
      } else {
        mediaList.innerHTML = '<p class="loading">No media detected on this page.</p>';
      }
    });
  });
}

function displayMedia(mediaItems) {
  const mediaList = document.getElementById('mediaList');
  mediaList.innerHTML = '';
  
  mediaItems.forEach((item, index) => {
    const mediaElement = document.createElement('div');
    mediaElement.className = 'media-item';
    mediaElement.innerHTML = `
      <img src="${item.url}" alt="Media thumbnail" class="media-thumb" onerror="this.src='icons/icon48.png'">
      <div class="media-info">
        <div class="media-type">${item.type}</div>
        <div class="media-url">${item.url}</div>
      </div>
      <button class="btn-analyze" data-index="${index}">Analyze</button>
    `;
    
    mediaElement.querySelector('.btn-analyze').addEventListener('click', (e) => {
      e.stopPropagation();
      analyzeMedia(item, e.target);
    });
    
    mediaList.appendChild(mediaElement);
  });
}

async function analyzeMedia(mediaItem, button) {
  button.disabled = true;
  button.innerHTML = '<span class="analyzing">Analyzing...</span>';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'analyzeMedia',
      url: mediaItem.url,
      type: mediaItem.type
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    displayResult(response);
    
    // Send result to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'showResult',
        url: mediaItem.url,
        score: response.deepfake_score,
        explanation: response.explanation
      });
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    button.innerHTML = 'Error';
    setTimeout(() => {
      button.disabled = false;
      button.innerHTML = 'Analyze';
    }, 2000);
  }
}

function displayResult(result) {
  const resultsDiv = document.getElementById('results');
  const resultContent = document.getElementById('resultContent');
  
  resultsDiv.style.display = 'block';
  
  const scoreClass = result.deepfake_score > 70 ? 'score-high' : 
                     result.deepfake_score > 40 ? 'score-medium' : 'score-low';
  
  resultContent.innerHTML = `
    <div class="result-item">
      <div class="deepfake-score ${scoreClass}">
        ${result.deepfake_score}% Deepfake Probability
      </div>
      <div class="explanation">
        ${result.explanation}
      </div>
    </div>
  `;
}
