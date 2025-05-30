// DO 助手 - Popup 脚本
console.log("DO 助手已加载");

// 功能处理器
const featureHandlers = {
    'reading-time': () => {
        console.log('执行阅读时间功能');
        // 向当前标签页注入脚本来计算阅读时间
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: calculateReadingTime
            });
        });
    },
    
    'word-count': () => {
        console.log('执行字数统计功能');
        // 向当前标签页注入脚本来统计字数
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: countWords
            });
        });
    },
    
    'bookmark': () => {
        console.log('执行快速收藏功能');
        // 收藏当前页面
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            chrome.bookmarks.create({
                title: tab.title,
                url: tab.url
            }, (bookmark) => {
                showNotification('页面已收藏', 'success');
            });
        });
    },
    
    'theme': () => {
        console.log('执行主题切换功能');
        // 切换主题
        toggleTheme();
    },
    
    'settings': () => {
        console.log('打开设置页面');
        // 打开设置页面
        chrome.runtime.openOptionsPage();
    }
};

// 计算阅读时间的函数（注入到页面中执行）
function calculateReadingTime() {
    const text = document.body.innerText || document.body.textContent || '';
    const wordsPerMinute = 200; // 平均阅读速度
    const words = text.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / wordsPerMinute);
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'do-assistant-notification';
    notification.textContent = `预计阅读时间：${readingTime} 分钟 (${words} 字)`;
    
    document.body.appendChild(notification);
    
    // 3秒后移除通知
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// 统计字数的函数（注入到页面中执行）
function countWords() {
    const text = document.body.innerText || document.body.textContent || '';
    const words = text.trim().split(/\s+/).length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'do-assistant-notification';
    notification.innerHTML = `
        <div>字数统计结果：</div>
        <div>单词：${words} 个</div>
        <div>字符：${characters} 个</div>
        <div>字符(不含空格)：${charactersNoSpaces} 个</div>
    `;
    
    document.body.appendChild(notification);
    
    // 5秒后移除通知
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// 主题切换功能
function toggleTheme() {
    chrome.storage.sync.get(['theme'], (result) => {
        const currentTheme = result.theme || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        chrome.storage.sync.set({theme: newTheme}, () => {
            showNotification(`已切换到${newTheme === 'dark' ? '深色' : '浅色'}主题`, 'success');
        });
    });
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        }
        
        .notification-success {
            background-color: #10b981;
        }
        
        .notification-info {
            background-color: #3b82f6;
        }
        
        .notification-error {
            background-color: #ef4444;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, 3000);
}

// 初始化事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 为每个功能项添加点击事件
    const featureItems = document.querySelectorAll('.feature-item');
    
    featureItems.forEach(item => {
        item.addEventListener('click', () => {
            const feature = item.getAttribute('data-feature');
            const handler = featureHandlers[feature];
            
            if (handler) {
                // 添加点击反馈
                item.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    item.style.transform = '';
                }, 150);
                
                // 执行功能
                handler();
            } else {
                console.warn(`未找到功能处理器: ${feature}`);
            }
        });
        
        // 添加键盘支持
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            }
        });
        
        // 使元素可聚焦
        item.setAttribute('tabindex', '0');
    });
    
    console.log('DO 助手功能列表已初始化');
});