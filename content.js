let selectedItems = new Set();
let parentTemplate = '`週{weekday}午餐 {date} {store}`\n{items}\n';
let itemTemplate = '{icon} {item}';

// 取得明天的日期和星期
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const options = { month: '2-digit', day: '2-digit' };
  const date = tomorrow.toLocaleDateString('zh-TW', options).replaceAll('/', '/');
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][tomorrow.getDay()];
  return { date, weekday };
}

// 初始化功能
function initialize() {
  // 從 URL 中獲取店家 ID
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const storeId = pathSegments[pathSegments.length - 2]; // 倒數第二個元素
  
  // 從存儲中讀取數據
  chrome.storage.local.get([storeId], function(result) {
    if (result[storeId]) {
      selectedItems = new Set(result[storeId]);
      updatePanel();
    }
  });

  // 創建固定面板
  createPanel();
  
  // 創建模板編輯器
  createTemplateEditor();
  
  // 創建輸出預覽
  createOutputPreview();
  
  // 添加菜單項目的加號按鈕
  addPlusButtons();
}

// 創建固定面板

function createPanel() {
  const panel = document.createElement('div');
  panel.className = 'selected-items-panel visible';
  panel.innerHTML = `
  <style>
    #toggle-preview {
      margin-top: 10px;
    }
    .hidden {
      display: none;
    }
  </style>
  <h3>已選擇的項目</h3>
    <div id="selected-items-list"></div>
    <button id="toggle-preview">顯示/隱藏 預覽</button>
    <div id="preview-container">
      <pre><div id="output-content"></div></pre>
      <button id="copy-output">複製</button>
    </div>
  `;
  document.body.appendChild(panel);

  document.getElementById('toggle-preview').addEventListener('click', function() {
    document.getElementById('preview-container').classList.toggle('hidden');
    document.getElementById('output-content').textContent = generateOutput();
  });

  document.getElementById('copy-output').addEventListener('click', function() {
    const content = document.getElementById('output-content').textContent;
    navigator.clipboard.writeText(content);
    alert('已複製到剪貼簿！');
  });
}

// 創建模板編輯器
function createTemplateEditor() {
  const editor = document.createElement('div');
  editor.className = 'template-editor';
  editor.innerHTML = `
    <h3>編輯輸出模板</h3>
    <label>父層模板：</label>
    <textarea id="parent-template-input" rows="3" style="width: 100%">${parentTemplate}</textarea>
    <label>子層模板：</label>
    <textarea id="item-template-input" rows="3" style="width: 100%">${itemTemplate}</textarea>
    <button id="save-template">儲存</button>
    <button id="cancel-template">取消</button>
  `;
  document.body.appendChild(editor);
  
  document.getElementById('save-template').addEventListener('click', function() {
    parentTemplate = document.getElementById('parent-template-input').value;
    itemTemplate = document.getElementById('item-template-input').value;
    editor.classList.remove('visible');
  });
  
  document.getElementById('cancel-template').addEventListener('click', function() {
    editor.classList.remove('visible');
  });
}

// 創建輸出預覽
function createOutputPreview() {
  const preview = document.createElement('div');
  preview.className = 'output-preview';
  preview.innerHTML = `
    <h3>輸出預覽</h3>
    <pre><div id="output-content"></div></pre>
    <button id="copy-output-preview">複製</button>
    <button id="close-preview">關閉</button>
  `;
  document.body.appendChild(preview);
  
  document.getElementById('copy-output-preview').addEventListener('click', function() {
    const content = document.getElementById('output-content').textContent;
    navigator.clipboard.writeText(content);
    alert('已複製到剪貼簿！');
  });
  
  document.getElementById('close-preview').addEventListener('click', function() {
    preview.classList.remove('visible');
  });
}

// 添加加號按鈕到菜單項目
function addPlusButtons() {
  const menuItems = document.querySelectorAll('[data-testid="store-desktop-loaded-coi"] ul ul > li');
  menuItems.forEach(item => {
    if (!item.querySelector('.add-button')) {
      const button = document.createElement('div');
      button.className = 'add-button';
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        const itemName = item.querySelector('a span').textContent.trim();
        selectedItems.add(itemName);
        updatePanel();
        saveToStorage();
        document.getElementById('output-content').textContent = generateOutput();
      });
      item.appendChild(button);
    }
  });
}

// 更新面板內容
function updatePanel() {
  const list = document.getElementById('selected-items-list');
  if (!list) return;
  
  list.innerHTML = '';
  selectedItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'selected-item';
    div.innerHTML = `
      <span>${item}</span>
      <span class="delete-button" data-item="${item}">×</span>
    `;
    list.appendChild(div);
  });
  
  // 添加刪除功能
  document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', function() {
      const item = this.getAttribute('data-item');
      selectedItems.delete(item);
      updatePanel();
      saveToStorage();
      document.getElementById('output-content').textContent = generateOutput();
    });
  });
}

// 保存到存儲
function saveToStorage() {
  // 從 URL 中獲取店家 ID
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const storeId = pathSegments[pathSegments.length - 2]; // 倒數第二個元素
  chrome.storage.local.set({
    [storeId]: Array.from(selectedItems)
  });
}

// 生成輸出內容
function generateOutput() {
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const storeId = pathSegments[pathSegments.length - 2];
  const { date, weekday } = getTomorrowDate();
  
  const numberIcons = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  
  const formattedItems = Array.from(selectedItems).map((item, index) => {
    const icon = index < numberIcons.length ? `:${numberIcons[index]}:` : `:${index + 1}:`;
    return itemTemplate.replace('{icon}', icon).replace('{item}', item);
  }).join('\n');
  
  return parentTemplate
    .replace('{store}', decodeURIComponent(storeId))
    .replace('{date}', date)
    .replace('{weekday}', weekday)
    .replace('{items}', formattedItems)
    .replace('{count}', selectedItems.size);
}


// 監聽來自 popup 的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.action) {
    case 'editTemplate':
      document.querySelector('.template-editor').classList.add('visible');
      break;
    case 'togglePanel':
      const panel = document.querySelector('.selected-items-panel');
      panel.classList.toggle('visible');
      break;
    case 'showOutput':
      const preview = document.querySelector('.output-preview');
      document.getElementById('output-content').textContent = generateOutput();
      preview.classList.add('visible');
      break;
  }
});

// 監聽 DOM 變化，以處理動態加載的內容
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.addedNodes.length) {
      addPlusButtons();
    }
  });
});

// 開始觀察
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 初始化
initialize();
