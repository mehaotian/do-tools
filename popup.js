// DO 助手 - Popup 脚本
console.log("DO 助手已加载");

// 导入模块
import { formatTime, showNotification } from './modules/utils.js';
import { popupUIManager } from './modules/uiManager.js';
import { initPopupAnimations } from './modules/animations.js';


// 定时器功能已迁移到 background.js 中进行全局管理
// 倒计时显示将通过 content script 在页面中展示

// CSS动画实现
function initCSSAnimations(popup) {
  // 添加CSS动画样式 - 恢复正确的心跳和水波纹效果
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

  // 触发动画
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
    // 取消倒计时文字的跳动动画
    timeText.style.animation = "none";
  }

  // 倒计时数字变化动画已迁移到全局定时器管理
}

// 功能处理器将通过模块动态加载

// 时间设置界面通过 uiManager 模块处理

// 计时器启动逻辑通过 featureHandlers 模块处理

// 字数统计功能已移至 featureHandlers.js 模块

// 主题切换功能已移至 featureHandlers.js 模块

// 通知显示功能已移至 utils.js 模块

// DOM加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
  // 初始化弹窗UI管理器
  popupUIManager.init();
});
