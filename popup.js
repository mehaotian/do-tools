/**
 * DO助手弹窗脚本
 */

import { popupUIManager } from './modules/uiManager.js';

/**
 * 初始化CSS动画
 * @param {HTMLElement} popup - 弹窗元素
 */
function initCSSAnimations(popup) {
  try {
    if (!popup || !(popup instanceof HTMLElement)) {
      console.warn('initCSSAnimations: Invalid popup element');
      return;
    }
    
    const animationTimer = setTimeout(() => {
      try {
        if (popup && popup.style) {
          popup.style.opacity = "1";
          popup.style.transform = "translateY(0) scale(1)";
          popup.classList.add('popup-animated');
        }
      } catch (error) {
        console.error('initCSSAnimations: Failed to apply animations:', error);
      }
    }, 100);
    
    // 存储定时器引用以便清理
    popup._animationTimer = animationTimer;

    const timeText = popup.querySelector(".time-text");
    if (timeText && timeText.style) {
      timeText.style.animation = "none";
    }
  } catch (error) {
    console.error('initCSSAnimations: Failed to initialize animations:', error);
  }
}

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
