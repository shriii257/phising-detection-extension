// Popup script - handles the extension popup interface
// This runs when user clicks the extension icon

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  analyzeCurrentPage();
});

// Function to analyze the current active tab
function analyzeCurrentPage() {
  // Get the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const currentTab = tabs[0];
      const url = currentTab.url;
      
      // Display the current URL
      displayURL(url);
      
      // Check if it's a special browser page (can't analyze these)
      if (url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:')) {
        showSpecialPageMessage();
        return;
      }
      
      // Request analysis from background script
      chrome.runtime.sendMessage(
        { action: 'analyzeCurrentTab' },
        (response) => {
          if (response && response.threats) {
            displayResults(response.threats);
          }
        }
      );
    }
  });
}

// Display the current URL in the popup
function displayURL(url) {
  const urlElement = document.getElementById('current-url');
  
  try {
    const urlObj = new URL(url);
    // Show just the hostname for cleaner display
    urlElement.textContent = urlObj.hostname;
    urlElement.title = url; // Full URL on hover
  } catch (error) {
    urlElement.textContent = url;
  }
}

// Display analysis results
function displayResults(threats) {
  const statusDiv = document.getElementById('status');
  const statusText = statusDiv.querySelector('.status-text');
  const statusIcon = statusDiv.querySelector('.status-icon');
  const threatsContainer = document.getElementById('threats-container');
  const threatsList = document.getElementById('threats-list');
  const safeMessage = document.getElementById('safe-message');
  
  if (threats.length === 0) {
    // Site is safe - no threats detected
    statusDiv.className = 'status-safe';
    statusIcon.textContent = '✓';
    statusText.textContent = 'Site appears safe';
    safeMessage.style.display = 'block';
    threatsContainer.style.display = 'none';
  } else {
    // Threats detected - determine severity
    const hasCritical = threats.some(t => t.severity === 'critical');
    const hasHigh = threats.some(t => t.severity === 'high');
    
    if (hasCritical) {
      statusDiv.className = 'status-danger';
      statusIcon.textContent = '⚠';
      statusText.textContent = 'DANGER: Likely phishing site!';
    } else if (hasHigh) {
      statusDiv.className = 'status-warning';
      statusIcon.textContent = '⚠';
      statusText.textContent = 'Warning: Suspicious activity detected';
    } else {
      statusDiv.className = 'status-caution';
      statusIcon.textContent = '!';
      statusText.textContent = 'Caution: Minor concerns detected';
    }
    
    // Display list of threats
    safeMessage.style.display = 'none';
    threatsContainer.style.display = 'block';
    threatsList.innerHTML = ''; // Clear existing threats
    
    // Create threat items
    threats.forEach(threat => {
      const threatItem = document.createElement('div');
      threatItem.className = `threat-item threat-${threat.severity}`;
      
      const severityBadge = document.createElement('span');
      severityBadge.className = 'severity-badge';
      severityBadge.textContent = threat.severity.toUpperCase();
      
      const threatMessage = document.createElement('span');
      threatMessage.className = 'threat-message';
      threatMessage.textContent = threat.message;
      
      threatItem.appendChild(severityBadge);
      threatItem.appendChild(threatMessage);
      threatsList.appendChild(threatItem);
    });
  }
}

// Show message for special browser pages
function showSpecialPageMessage() {
  const statusDiv = document.getElementById('status');
  const statusText = statusDiv.querySelector('.status-text');
  const statusIcon = statusDiv.querySelector('.status-icon');
  const safeMessage = document.getElementById('safe-message');
  const threatsContainer = document.getElementById('threats-container');
  
  statusDiv.className = 'status-info';
  statusIcon.textContent = 'ℹ';
  statusText.textContent = 'Cannot analyze browser pages';
  
  safeMessage.style.display = 'block';
  safeMessage.innerHTML = `
    <div class="safe-box">
      <div class="safe-icon">ℹ️</div>
      <p>This is a browser internal page.</p>
      <p class="safe-note">Extension works on regular websites only.</p>
    </div>
  `;
  threatsContainer.style.display = 'none';
}