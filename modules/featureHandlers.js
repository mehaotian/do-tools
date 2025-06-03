/**
 * 功能处理器模块
 * 处理各种扩展功能的业务逻辑
 */

import { showNotification } from './utils.js';
import { showToast } from './toast.js';

/**
 * Chrome API 操作类
 */
class ChromeAPIManager {
  /**
   * 检查扩展上下文是否有效
   * @returns {boolean} 扩展上下文是否有效
   */
  static isExtensionContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取当前活动标签页
   * @returns {Promise<chrome.tabs.Tab>} 当前活动标签页
   */
  static async getCurrentTab() {
    if (!this.isExtensionContextValid()) {
      throw new Error('Extension context is invalid');
    }
    
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!tabs || tabs.length === 0) {
            reject(new Error('No active tab found'));
            return;
          }
          resolve(tabs[0]);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 在当前标签页执行脚本
   * @param {Function} func - 要执行的函数
   * @param {Array} args - 函数参数
   */
  static async executeScript(func, args = []) {
    if (!this.isExtensionContextValid()) {
      throw new Error('Extension context is invalid');
    }
    
    if (typeof func !== 'function') {
      throw new Error('Invalid function provided');
    }
    
    try {
      const tab = await this.getCurrentTab();
      
      if (!tab || !tab.id) {
        throw new Error('Invalid tab');
      }
      
      // 检查是否可以在该标签页执行脚本
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
        throw new Error('Cannot execute script on chrome:// or extension pages');
      }
      
      return new Promise((resolve, reject) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: func,
          args: args,
        }, (results) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(results);
        });
      });
    } catch (error) {
      console.error('Failed to execute script:', error);
      throw error;
    }
  }

  /**
   * 发送消息到后台脚本
   * @param {Object} message - 要发送的消息
   * @returns {Promise<any>} 消息响应
   */
  static async sendMessage(message) {
    if (!this.isExtensionContextValid()) {
      throw new Error('Extension context is invalid');
    }
    
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message object');
    }
    
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 创建书签
   * @param {string} title - 书签标题
   * @param {string} url - 书签URL
   * @returns {Promise<chrome.bookmarks.BookmarkTreeNode>} 创建的书签
   */
  static async createBookmark(title, url) {
    if (!this.isExtensionContextValid()) {
      throw new Error('Extension context is invalid');
    }
    
    if (!title || typeof title !== 'string') {
      throw new Error('Invalid bookmark title');
    }
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid bookmark URL');
    }
    
    return new Promise((resolve, reject) => {
      try {
        chrome.bookmarks.create({ title, url }, (bookmark) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(bookmark);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 获取存储的主题设置
   * @returns {Promise<string>} 当前主题
   */
  static async getTheme() {
    if (!this.isExtensionContextValid()) {
      throw new Error('Extension context is invalid');
    }
    
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.get(["theme"], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(result.theme || "light");
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 设置主题
   * @param {string} theme - 主题名称
   */
  static async setTheme(theme) {
    if (!this.isExtensionContextValid()) {
      throw new Error('Extension context is invalid');
    }
    
    if (!theme || typeof theme !== 'string') {
      throw new Error('Invalid theme value');
    }
    
    const validThemes = ['light', 'dark'];
    if (!validThemes.includes(theme)) {
      throw new Error(`Invalid theme: ${theme}. Must be one of: ${validThemes.join(', ')}`);
    }
    
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.set({ theme }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

/**
 * 字数统计功能（注入到页面中执行）
 */
function countWordsInPage() {
  const text = document.body.innerText || document.body.textContent || "";
  const words = text.trim().split(/\s+/).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;

  // 创建通知元素
  const notification = document.createElement("div");
  notification.className = "do-assistant-notification";
  notification.innerHTML = `
    <div>字数统计结果：</div>
    <div>单词：${words} 个</div>
    <div>字符：${characters} 个</div>
    <div>字符(不含空格)：${charactersNoSpaces} 个</div>
  `;

  // 添加样式
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;

  document.body.appendChild(notification);

  // 5秒后移除通知
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

/**
 * 自律提醒功能处理器
 */
class ReadingTimeHandler {
  static handle() {
    try {
      if (typeof showTimerSettings === 'function') {
        showTimerSettings();
      } else {
        console.warn('showTimerSettings function not available');
        showToast('自律提醒功能暂时不可用', 'warning');
      }
    } catch (error) {
      console.error('Failed to handle reading time:', error);
      showToast('启动自律提醒失败', 'error');
    }
  }
}

/**
 * 字数统计功能处理器
 */
class WordCountHandler {
  static async handle() {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('Extension context is invalid');
      }
      
      await ChromeAPIManager.executeScript(countWordsInPage);
    } catch (error) {
      console.error('Failed to count words:', error);
      
      let errorMessage = '字数统计失败';
      if (error.message.includes('chrome://') || error.message.includes('extension pages')) {
        errorMessage = '无法在此页面进行字数统计';
      } else if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      showToast(errorMessage, 'error');
    }
  }
}

/**
 * 书签功能处理器
 */
class BookmarkHandler {
  static async handle() {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('Extension context is invalid');
      }
      
      const tab = await ChromeAPIManager.getCurrentTab();
      
      if (!tab || !tab.url) {
        throw new Error('Invalid tab or URL');
      }
      
      // 检查是否为有效的可收藏页面
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        throw new Error('Cannot bookmark chrome:// or extension pages');
      }
      
      const title = tab.title || tab.url;
      await ChromeAPIManager.createBookmark(title, tab.url);
      showToast("页面已收藏", "success");
    } catch (error) {
      console.error('Failed to create bookmark:', error);
      
      let errorMessage = '收藏失败';
      if (error.message.includes('chrome://') || error.message.includes('extension pages')) {
        errorMessage = '无法收藏此类页面';
      } else if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      showToast(errorMessage, 'error');
    }
  }
}

/**
 * 页面美化功能处理器
 */
class PageBeautifyHandler {
  static async handle() {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('Extension context is invalid');
      }
      
      // 使用Chrome扩展的原生侧边栏API
      await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
      showToast('页面美化工具已打开', 'success');
      
      // 关闭弹窗
      if (window && window.close) {
        window.close();
      }
      
    } catch (error) {
      console.error('Failed to open page beautify:', error);
      
      let errorMessage = '页面美化工具打开失败';
      if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      showToast(errorMessage, 'error');
    }
  }
}

/**
 * 设置功能处理器
 */
class SettingsHandler {
  static handle() {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('Extension context is invalid');
      }
      
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        throw new Error('Options page not available');
      }
    } catch (error) {
      console.error('Failed to open settings:', error);
      
      let errorMessage = '打开设置页面失败';
      if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      } else if (error.message.includes('not available')) {
        errorMessage = '设置页面不可用';
      }
      
      showToast(errorMessage, 'error');
    }
  }
}

/**
 * 计时器功能处理器
 */
class TimerHandler {
  /**
   * 启动计时器
   * @param {number} minutes - 计时分钟数
   */
  static async handle(minutes) {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('扩展上下文无效');
      }
      
      // 验证输入参数
      if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) {
        throw new Error('时间数字无效');
      }
      
      if (minutes > 24 * 60) {
        throw new Error('计时器持续时间不能超过24小时');
      }
      
      // 发送消息给后台脚本，通知后台脚本开始计时
      await ChromeAPIManager.sendMessage({
        action: 'startTimer',
        minutes: minutes
      });
      showNotification(`自律提醒已设置：${minutes}分钟`, "success");
    } catch (error) {
      console.error('Failed to start timer:', error);
      
      let errorMessage = '启动计时器失败';
      if (error.message.includes('Invalid minutes')) {
        errorMessage = '无效的时间设置';
      } else if (error.message.includes('exceed 24 hours')) {
        errorMessage = '计时时间不能超过24小时';
      } else if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      showNotification(errorMessage, 'error');
    }
  }

  /**
   * 停止计时器
   */
  static async stop() {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('Extension context is invalid');
      }
      
      await ChromeAPIManager.sendMessage({ action: "stopTimer" });
      showNotification('计时器已停止', 'info');
    } catch (error) {
      console.error('Failed to stop timer:', error);
      
      let errorMessage = '停止计时器失败';
      if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      showNotification(errorMessage, 'error');
    }
  }

  /**
   * 暂停计时器
   */
  static async pause() {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('Extension context is invalid');
      }
      
      await ChromeAPIManager.sendMessage({ action: "pauseTimer" });
      showNotification('计时器已暂停', 'info');
    } catch (error) {
      console.error('Failed to pause timer:', error);
      
      let errorMessage = '暂停计时器失败';
      if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      showNotification(errorMessage, 'error');
    }
  }

  /**
   * 继续计时器
   */
  static async resume() {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('Extension context is invalid');
      }
      
      await ChromeAPIManager.sendMessage({ action: "resumeTimer" });
      showNotification('计时器已继续', 'info');
    } catch (error) {
      console.error('Failed to resume timer:', error);
      
      let errorMessage = '继续计时器失败';
      if (error.message.includes('Extension context is invalid')) {
        errorMessage = '扩展已失效，请刷新页面重试';
      }
      
      showNotification(errorMessage, 'error');
    }
  }

  /**
   * 获取计时器状态
   * @returns {Promise<Object>} 计时器状态
   */
  static async getStatus() {
    try {
      if (!ChromeAPIManager.isExtensionContextValid()) {
        throw new Error('Extension context is invalid');
      }
      
      const response = await ChromeAPIManager.sendMessage({ action: "getTimerState" });
      return response || { isRunning: false };
    } catch (error) {
      console.error('Failed to get timer status:', error);
      return { isRunning: false, error: error.message };
    }
  }
}

/**
 * 功能处理器映射表
 */
export const featureHandlers = {
  "reading-time": ReadingTimeHandler.handle,
  "word-count": WordCountHandler.handle,
  "bookmark": BookmarkHandler.handle,
  "page-beautify": PageBeautifyHandler.handle,
  "settings": SettingsHandler.handle,
};

// 导出各个处理器类
export {
  ChromeAPIManager,
  ReadingTimeHandler,
  WordCountHandler,
  BookmarkHandler,
  PageBeautifyHandler,
  SettingsHandler,
  TimerHandler,
  countWordsInPage
};