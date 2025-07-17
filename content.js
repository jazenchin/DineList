let selectedItems = new Set();
let parentTemplate = '@頻道\n`週{weekday}午餐 ~ {date}`\n`{store}`\n{items}\n\n週{weekday}{date} :驚嘆號: 10:00收單\n請各位學長姊好心提醒左右鄰居點餐';
let itemTemplate = '{icon} {item}';

let breakfastTemplate = {
  header: '`週{weekday}早餐 {date} {store}`\n{items}\n',
  footer: ':allo_dance: 數量有限，先到先拿唷 :allo_dance:'
};

let lunchTemplate = {
  header: '@頻道\n`週{weekday}午餐 ~ {date}`\n`{store}`\n{items}\n',
  footer: '週{weekday}{date} :驚嘆號: 10:00收單\n請各位學長姊好心提醒左右鄰居點餐'
};

let zhCharIcons = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '零'];
let alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
let alphabetWhiteIcons = [];
let alphabetYellowIcons = [];
alphabet.forEach(letter => {
  alphabetWhiteIcons.push(`alphabet-white-${letter.toLowerCase()}`);
  alphabetYellowIcons.push(`alphabet-yellow-${letter.toLowerCase()}`);
});
let numberIcons = zhCharIcons;
let requestDate = "tomorrow";


// 取得明天的日期和星期
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayOfWeek = tomorrow.getDay();
  switch(dayOfWeek) {
    case 0:
      tomorrow.setDate(tomorrow.getDate() + 1);
      dayOfWeek = tomorrow.getDay();
      break;
    case 6:
      tomorrow.setDate(tomorrow.getDate() + 2);
      dayOfWeek = tomorrow.getDay();
      break;
    default:
      break;
  }
  const options = { month: '2-digit', day: '2-digit' };
  const date = tomorrow.toLocaleDateString('zh-TW', options).replaceAll('/', '/');
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][tomorrow.getDay()];
  return { date, weekday };
}

// 取得明天的日期和星期
function getCurrentDate() {
  const current = new Date();
  current.setDate(current.getDate());
  const dayOfWeek = current.getDay();
  switch(dayOfWeek) {
    case 0:
      current.setDate(current.getDate() + 1);
      dayOfWeek = current.getDay();
      break;
    case 6:
      current.setDate(current.getDate() + 2);
      dayOfWeek = current.getDay();
      break;
    default:
      break;
  }
  const options = { month: '2-digit', day: '2-digit' };
  const date = current.toLocaleDateString('zh-TW', options).replaceAll('/', '/');
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][current.getDay()];
  return { date, weekday };
}

// 檢測當前平台
function detectPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('ubereats.com')) {
    return 'ubereats';
  } else if (hostname.includes('foodpanda.com')) {
    return 'foodpanda';
  }
  return 'unknown';
}

// 根據平台獲取店家ID
function getStoreId() {
  const platform = detectPlatform();
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  
  if (platform === 'ubereats') {
    // UberEats: 倒數第二個元素
    return pathSegments[pathSegments.length - 2];
  } else if (platform === 'foodpanda') {
    // FoodPanda: 使用頁面上的店家名稱
    const titleElement = document.querySelector('h1.main-info__title');
    if (titleElement) {
      return titleElement.innerText.trim();
    }
    // 如果找不到標題元素，回退到原本的URL方式
    const restaurantIndex = pathSegments.findIndex(segment => segment === 'restaurant');
    if (restaurantIndex !== -1 && restaurantIndex + 1 < pathSegments.length) {
      return pathSegments.slice(restaurantIndex + 1).join('/');
    }
  }
  return null;
}

// 初始化功能
function initialize() {
  // 從 URL 中獲取店家 ID
  const storeId = getStoreId();
  
  if (!storeId) {
    console.error('無法獲取店家ID');
    return;
  }
  
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
    <button id="toggle-preview" class="btn bg-blue">顯示/隱藏 預覽</button>&nbsp;&nbsp;
    <button id="toggle-editor" class="btn bg-yellow">開啟編輯器</button>
    <div id="preview-container" >
      <pre><textarea rows="10" style="width: 100%; margin-top: 5px" id="output-content" class="hidden"></textarea></pre>
      <button id="copy-output" class="btn bg-yellow">複製</button>
    </div>
  `;
  document.body.appendChild(panel);

  document.getElementById('toggle-preview').addEventListener('click', function() {
    document.getElementById('preview-container').classList.toggle('hidden');
    document.getElementById('output-content').value = generateOutput();
  });

  document.getElementById('toggle-editor').addEventListener('click', function() {
    document.querySelector('.template-editor').classList.add('visible');
  });

  document.getElementById('copy-output').addEventListener('click', function() {
    const content = document.getElementById('output-content').value;
    navigator.clipboard.writeText(content);
    alert('已複製到剪貼簿！');
  });

}

function toggleTemplate() {
  console.log('toggleTemplate');
  console.log(document.getElementById('breakfast-radio').checked);
  if (document.getElementById('breakfast-radio').checked) {
    document.getElementById('parent-template-input').value = breakfastTemplate.header + '\n' + breakfastTemplate.footer;
  } else {
    document.getElementById('parent-template-input').value = lunchTemplate.header + '\n' + lunchTemplate.footer;
  }
}

function saveEmojiType() {
  let emojiType = document.getElementsByName('emoji-type');
  emojiType.forEach(radio => {
    if (radio.checked) {
      switch (radio.value) {
        case 'zhChar':
          numberIcons = zhCharIcons;
          break;
        case 'alphabetWhite':
          numberIcons = alphabetWhiteIcons;
          break;
        case 'alphabetYellow':
          numberIcons = alphabetYellowIcons;
          break;
      }
    }
  });
}

function saveDateType() {
  let dateType = document.getElementsByName('date-type');
  dateType.forEach(radio => {
    if (radio.checked) {
      switch (radio.value) {
        case 'today':
          requestDate = 'today';
          break;
        case 'tomorrow':
          requestDate = 'tomorrow';
          break;
      }
    }
  });
}


// 創建模板編輯器

function createTemplateEditor() {
  const editor = document.createElement('div');
  editor.className = 'template-editor';
  editor.innerHTML = `
    <h3 style="margin-bottom: 10px;">編輯輸出模板</h3>

    <label>訂餐日期：</label><br>
    <input type="radio" id="today-radio" name="date-type" value="today">
    <label for="today-radio">今天</label>
    <input type="radio" id="tomorrow-radio" name="date-type" value="tomorrow" checked>
    <label for="tomorrow-radio">明天</label><br>
    <hr class="hr">
    <label>選擇餐點類型：</label><br>
    <input type="radio" id="breakfast-radio" name="template-type" value="breakfast">
    <label for="breakfast-radio">早餐</label>
    <input type="radio" id="lunch-radio" name="template-type" value="lunch" checked>
    <label for="lunch-radio">午餐</label><br>
    <hr class="hr">
    <label>選擇餐點圖示：</label><br>
    <input type="radio" id="zhChar-radio" name="emoji-type" value="zhChar" checked>
    <label for="zhChar-radio"><span id="zhCharEx" class="emojiEx">1</span></label>
    <input type="radio" id="alphabetWhiteRadio" name="emoji-type" value="alphabetWhite">
    <label for="alphabetWhiteRadio"><span id="alphabetWhiteEx" class="emojiEx">A</span></label>
    <input type="radio" id="alphabetYellowRadio" name="emoji-type" value="alphabetYellow">
    <label for="alphabetYellowRadio"><span id="alphabetYellowEx" class="emojiEx">A</span></label><br>
    <hr class="hr">
    <label>父層模板：</label><br>
    <textarea id="parent-template-input" rows="10" style="width: 100%; margin-top: 5px">${lunchTemplate.header}\n${lunchTemplate.footer}</textarea>
    <label>子層模板：</label><br>
    <textarea id="item-template-input" rows="3" style="width: 100%; margin: 5px 0 10px 0">${itemTemplate}</textarea>
    <button id="save-template" class="btn bg-yellow">儲存</button>&nbsp;&nbsp;
    <button id="cancel-template" class="btn bg-blue">取消</button>
  `;
  document.body.appendChild(editor);

  document.getElementsByName('template-type').forEach(radio => {
    radio.addEventListener('click', function(){ toggleTemplate()});
  });

  document.getElementById('save-template').addEventListener('click', function() {
    parentTemplate = document.getElementById('parent-template-input').value;
    itemTemplate = document.getElementById('item-template-input').value;
    saveEmojiType();
    saveDateType();
    document.getElementById('output-content').value = generateOutput();
    editor.classList.remove('visible');
  });
  
  document.getElementById('cancel-template').addEventListener('click', function() {
    editor.classList.remove('visible');
  });
}


// 添加加號按鈕到菜單項目
function addPlusButtons() {
  const platform = detectPlatform();
  let menuItems = [];
  
  if (platform === 'ubereats') {
    menuItems = document.querySelectorAll('[data-testid="store-desktop-loaded-coi"] ul ul > li');
  } else if (platform === 'foodpanda') {
    menuItems = document.querySelectorAll('#menu>.menu ul>li');
  }
  
  menuItems.forEach(item => {
    if (!item.querySelector('.add-button')) {
      const button = document.createElement('div');
      button.className = 'add-button';
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        let itemName = '';
        
        if (platform === 'ubereats') {
          itemName = item.querySelector('a span').textContent.trim();
        } else if (platform === 'foodpanda') {
          itemName = item.querySelector('h3').textContent.trim();
        }
        
        if (itemName) {
          selectedItems.add(itemName);
          updatePanel();
          saveToStorage();
          document.getElementById('output-content').value = generateOutput();
        }
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
      document.getElementById('output-content').value = generateOutput();
    });
  });
}

// 保存到存儲
function saveToStorage() {
  // 從 URL 中獲取店家 ID
  const storeId = getStoreId();
  if (storeId) {
    chrome.storage.local.set({
      [storeId]: Array.from(selectedItems)
    });
  }
}

// 生成輸出內容
function generateOutput() {
  const outputContent = document.getElementById('output-content');
  outputContent.classList.remove('hidden');
  const storeId = getStoreId();
  const { date, weekday } = requestDate === 'today' ? getCurrentDate() : getTomorrowDate();
  
  const formattedItems = Array.from(selectedItems).map((item, index) => {
    const icon = index < numberIcons.length ? `:${numberIcons[index]}:` : `:${index + 1}:`;
    return itemTemplate.replace('{icon}', icon).replace('{item}', item);
  }).join('\n');
  
  return parentTemplate
    .replace('{store}', decodeURIComponent(storeId || ''))
    .replace(/{date}/g, date)
    .replace(/{weekday}/g, weekday)
    .replace('{items}', formattedItems)
    .replace('{count}', selectedItems.size);
}


// 監聽來自 popup 的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.action) {
    case 'togglePanel':
      const panel = document.querySelector('.selected-items-panel');
      panel.classList.toggle('visible');
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
