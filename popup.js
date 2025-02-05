document.addEventListener('DOMContentLoaded', function() {
  const editTemplateBtn = document.getElementById('editTemplate');
  const togglePanelBtn = document.getElementById('togglePanel');
  const showOutputBtn = document.getElementById('showOutput');

  editTemplateBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'editTemplate'});
    });
  });

  togglePanelBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'togglePanel'});
    });
  });

  showOutputBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'showOutput'});
    });
  });
}); 