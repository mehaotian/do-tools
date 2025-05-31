/**
 * DO助手弹窗脚本
 */

import { popupUIManager } from './modules/uiManager.js';

/**
 * 初始化CSS动画
 * @param {HTMLElement} popup - 弹窗元素
 */
function initCSSAnimations(popup) {
  setTimeout(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translateY(0) scale(1)";
    popup.classList.add('popup-animated');
  }, 100);

  const timeText = popup.querySelector(".time-text");
  if (timeText) {
    timeText.style.animation = "none";
  }
}

/**
 * DOM加载完成后初始化
 */
document.addEventListener("DOMContentLoaded", () => {
  popupUIManager.init();
});
