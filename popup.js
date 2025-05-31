/**
 * DO助手弹窗脚本
 */

import { popupUIManager } from './modules/uiManager.js';

/**
 * DOM加载完成后初始化
 */
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (popupUIManager && typeof popupUIManager.init === 'function') {
      popupUIManager.init();
    } else {
      console.error('popupUIManager not available or init method missing');
    }
  } catch (error) {
    console.error('Failed to initialize popup UI manager:', error);
  }
});
