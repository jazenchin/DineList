document.addEventListener('DOMContentLoaded', function() {
  const togglePanelBtn = document.getElementById('togglePanel');
  togglePanelBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'togglePanel'});
    });
  });
}); 