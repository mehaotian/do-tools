/**
 * DO助手弹窗脚本
 */

import { popupUIManager } from './modules/uiManager.js';

/**
 * 初始化CSS动画
 * @param {HTMLElement} popup - 弹窗元素
 */
function initCSSAnimations(popup) {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        33.33% { background-position: 100% 50%; }
        66.66% { background-position: 200% 50%; }
    }
    @keyframes borderGlow {
        0%, 100% { box-shadow: 0 20px 40px rgba(99, 102, 241, 0.3), 0 8px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 0 rgba(99, 102, 241, 0); }
        50% { box-shadow: 0 20px 40px rgba(99, 102, 241, 0.5), 0 8px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 20px rgba(99, 102, 241, 0.4); }
    }
    @keyframes minuteSpecial {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    @keyframes endCelebration {
        0%, 100% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.1) rotate(5deg); }
        75% { transform: scale(1.1) rotate(-5deg); }
    }
    `;
  document.head.appendChild(style);


  setTimeout(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translateY(0) scale(1)";
    popup.style.background =
      "linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(168, 85, 247, 0.8), rgba(59, 130, 246, 0.9)) !important";
    popup.style.backgroundSize = "200% 200% !important";
    popup.style.animation =
      "gradientShift 6s cubic-bezier(0.4, 0, 0.6, 1) infinite, borderGlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite !important";
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
