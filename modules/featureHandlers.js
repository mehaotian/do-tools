/**
 * 功能处理器模块
 * 处理各种扩展功能的业务逻辑
 */

import { showNotification } from './utils.js';

/**
 * Chrome API 操作类
 */
class ChromeAPIManager {
  /**
   * 获取当前活动标签页
   * @returns {Promise<chrome.tabs.Tab>} 当前活动标签页
   */
  static async getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  /**
   * 在当前标签页执行脚本
   * @param {Function} func - 要执行的函数
   * @param {Array} args - 函数参数
   */
  static async executeScript(func, args = []) {
    const tab = await this.getCurrentTab();
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: func,
      args: args,
    });
  }

  /**
   * 发送消息到后台脚本
   * @param {Object} message - 要发送的消息
   */
  static sendMessage(message) {
    chrome.runtime.sendMessage(message);
  }

  /**
   * 创建书签
   * @param {string} title - 书签标题
   * @param {string} url - 书签URL
   * @returns {Promise<chrome.bookmarks.BookmarkTreeNode>} 创建的书签
   */
  static async createBookmark(title, url) {
    return new Promise((resolve) => {
      chrome.bookmarks.create({ title, url }, resolve);
    });
  }

  /**
   * 获取存储的主题设置
   * @returns {Promise<string>} 当前主题
   */
  static async getTheme() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["theme"], (result) => {
        resolve(result.theme || "light");
      });
    });
  }

  /**
   * 设置主题
   * @param {string} theme - 主题名称
   */
  static async setTheme(theme) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ theme }, resolve);
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
    if (typeof showTimerSettings === 'function') {
      showTimerSettings();
    }
  }
}

/**
 * 字数统计功能处理器
 */
class WordCountHandler {
  static async handle() {
    try {
      await ChromeAPIManager.executeScript(countWordsInPage);
    } catch (error) {
      showNotification('字数统计失败', 'error');
    }
  }
}

/**
 * 书签功能处理器
 */
class BookmarkHandler {
  static async handle() {
    try {
      const tab = await ChromeAPIManager.getCurrentTab();
      await ChromeAPIManager.createBookmark(tab.title, tab.url);
      showNotification("页面已收藏", "success");
    } catch (error) {
      showNotification('收藏失败', 'error');
    }
  }
}

/**
 * 主题切换功能处理器
 */
class ThemeHandler {
  static async handle() {
    try {
      const currentTheme = await ChromeAPIManager.getTheme();
      const newTheme = currentTheme === "light" ? "dark" : "light";
      await ChromeAPIManager.setTheme(newTheme);
      showNotification(
        `已切换到${newTheme === "dark" ? "深色" : "浅色"}主题`,
        "success"
      );
    } catch (error) {
      showNotification('主题切换失败', 'error');
    }
  }
}

/**
 * 设置功能处理器
 */
class SettingsHandler {
  static handle() {
    try {
      chrome.runtime.openOptionsPage();
    } catch (error) {
      showNotification('打开设置页面失败', 'error');
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
  static handle(minutes) {
    try {
      ChromeAPIManager.sendMessage({
        action: 'startTimer',
        minutes: minutes
      });
      showNotification(`自律提醒已设置：${minutes}分钟`, "success");
    } catch (error) {
      showNotification('启动计时器失败', 'error');
    }
  }

  /**
   * 停止计时器
   */
  static stop() {
    try {
      ChromeAPIManager.sendMessage({ action: "stopTimer" });
      showNotification('计时器已停止', 'info');
    } catch (error) {
      showNotification('停止计时器失败', 'error');
    }
  }

  /**
   * 获取计时器状态
   * @returns {Promise<Object>} 计时器状态
   */
  static async getStatus() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getTimerState" }, (response) => {
        resolve(response || { isRunning: false });
      });
    });
  }
}

/**
 * 功能处理器映射表
 */
export const featureHandlers = {
  "reading-time": ReadingTimeHandler.handle,
  "word-count": WordCountHandler.handle,
  "bookmark": BookmarkHandler.handle,
  "theme": ThemeHandler.handle,
  "settings": SettingsHandler.handle,
};

// 导出各个处理器类
export {
  ChromeAPIManager,
  ReadingTimeHandler,
  WordCountHandler,
  BookmarkHandler,
  ThemeHandler,
  SettingsHandler,
  TimerHandler,
  countWordsInPage
};