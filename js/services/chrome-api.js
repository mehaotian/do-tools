/**
 * Chrome API 通信服务
 * 统一管理与background script和content script的消息传递
 * 提供错误处理和重试机制
 */

import { Utils } from '../core/utils.js';

/**
 * Chrome API 服务类
 * 封装所有Chrome扩展相关的API调用
 */
export class ChromeApiService {
  constructor() {
    this.retryCount = 3;
    this.retryDelay = 1000;
  }

  /**
   * 发送消息到background script
   * @param {Object} message - 消息对象
   * @param {number} timeout - 超时时间(毫秒)
   * @returns {Promise<any>} 响应结果
   */
  async sendMessage(message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('消息发送超时'));
      }, timeout);

      try {
        chrome.runtime.sendMessage(message, (response) => {
          clearTimeout(timeoutId);
          
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          resolve(response);
        });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * 带重试机制的消息发送
   * @param {Object} message - 消息对象
   * @param {number} maxRetries - 最大重试次数
   * @returns {Promise<any>} 响应结果
   */
  async sendMessageWithRetry(message, maxRetries = this.retryCount) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await this.sendMessage(message);
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries) {
          console.warn(`消息发送失败，正在重试 (${i + 1}/${maxRetries}):`, error.message);
          await this.delay(this.retryDelay * (i + 1));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 验证CSS选择器
   * @param {string} selector - CSS选择器
   * @returns {Promise<Object>} 验证结果
   */
  async validateSelector(selector) {
    try {
      const response = await this.sendMessageWithRetry({
        action: "pageBeautify",
        type: "VALIDATE_SELECTOR",
        data: { selector }
      });
      
      return {
        success: true,
        isValid: response?.isValid || false,
        elementCount: response?.elementCount || 0
      };
    } catch (error) {
      console.error('选择器验证失败:', error);
      return {
        success: false,
        isValid: false,
        elementCount: 0,
        error: error.message
      };
    }
  }

  /**
   * 应用主题到页面
   * @param {Object} theme - 主题数据
   * @returns {Promise<boolean>} 是否成功
   */
  async applyTheme(theme) {
    try {
      const response = await this.sendMessageWithRetry({
        action: "pageBeautify",
        type: "APPLY_THEME",
        data: theme
      });
      
      return response?.success || false;
    } catch (error) {
      console.error('主题应用失败:', error);
      Utils.showToast('主题应用失败: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * 清除页面样式
   * @returns {Promise<boolean>} 是否成功
   */
  async clearStyles() {
    try {
      const response = await this.sendMessageWithRetry({
        action: "pageBeautify",
        type: "CLEAR_STYLES"
      });
      
      return response?.success || false;
    } catch (error) {
      console.error('清除样式失败:', error);
      Utils.showToast('清除样式失败: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * 重置页面样式（与clearStyles功能相同）
   * @returns {Promise<boolean>} 是否成功
   */
  async resetStyles() {
    return this.clearStyles();
  }

  /**
   * 实时预览样式
   * @param {string} selector - CSS选择器
   * @param {string} property - CSS属性名
   * @param {string} value - CSS属性值
   * @returns {Promise<boolean>} 是否成功
   */
  async previewStyle(selector, property, value) {
    try {
      const response = await this.sendMessage({
        action: "pageBeautify",
        type: "PREVIEW_STYLE",
        data: { selector, property, value }
      });
      
      return response?.success || false;
    } catch (error) {
      console.warn('实时预览失败:', error);
      return false;
    }
  }

  /**
   * 清除特定属性的预览效果
   * @param {string} selector - CSS选择器
   * @param {string} property - CSS属性名
   * @returns {Promise<boolean>} 是否成功
   */
  async clearPreviewProperty(selector, property) {
    try {
      const response = await this.sendMessage({
        action: "pageBeautify",
        type: "CLEAR_PREVIEW_PROPERTY",
        data: { selector, property }
      });
      
      return response?.success || false;
    } catch (error) {
      console.warn('清除预览失败:', error);
      return false;
    }
  }

  /**
   * 清除所有预览效果
   * @returns {Promise<boolean>} 是否成功
   */
  async clearAllPreview() {
    try {
      const response = await this.sendMessage({
        action: "pageBeautify",
        type: "CLEAR_ALL_PREVIEW"
      });
      
      return response?.success || false;
    } catch (error) {
      console.warn('清除所有预览失败:', error);
      return false;
    }
  }

  /**
   * 应用CSS样式到页面（通过CSS注入）
   * @param {string} css - CSS代码
   * @param {string} styleId - 样式ID
   * @returns {Promise<boolean>} 是否成功
   */
  async applyStyles(css, styleId) {
    try {
      const response = await this.sendMessageWithRetry({
        action: "pageBeautify",
        type: "APPLY_CSS",
        data: { css, styleId }
      });
      
      return response?.success || false;
    } catch (error) {
      console.error('CSS应用失败:', error);
      Utils.showToast('CSS应用失败: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * 清除选择器高亮效果
   * @returns {Promise<boolean>} 是否成功
   */
  async clearSelectorHighlight() {
    try {
      const response = await this.sendMessage({
        action: "pageBeautify",
        type: "CLEAR_SELECTOR_HIGHLIGHT",
        data: {}
      });
      
      return response?.success || false;
    } catch (error) {
      console.error('清除高亮失败:', error);
      return false;
    }
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟时间(毫秒)
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查Chrome扩展环境是否可用
   * @returns {boolean} 是否可用
   */
  isExtensionEnvironment() {
    return !!(window.chrome && window.chrome.runtime && window.chrome.runtime.id);
  }

  /**
   * 获取扩展信息
   * @returns {Object} 扩展信息
   */
  getExtensionInfo() {
    if (!this.isExtensionEnvironment()) {
      return null;
    }

    return {
      id: chrome.runtime.id,
      version: chrome.runtime.getManifest()?.version,
      name: chrome.runtime.getManifest()?.name
    };
  }

  /**
   * 监听来自background的消息
   * @param {Function} callback - 消息处理回调
   */
  onMessage(callback) {
    if (!this.isExtensionEnvironment()) {
      console.warn('非Chrome扩展环境，无法监听消息');
      return;
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        callback(message, sender, sendResponse);
      } catch (error) {
        console.error('消息处理失败:', error);
        sendResponse({ success: false, error: error.message });
      }
    });
  }
}

// 创建单例实例
export const chromeApi = new ChromeApiService();