/**
 * 休息提醒模块
 * 处理深耕结束后的休息提醒界面
 */

import { createStyleElement, safeRemoveElement } from './utils.js';
import { initRestReminderAnimations } from './animations.js';

/**
 * 休息提醒样式常量
 */
const REST_REMINDER_STYLES = `
  .rest-reminder-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%) !important;
      z-index: 999999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      animation: overlayFadeIn 0.8s ease-out !important;
  }
  .rest-reminder {
      text-align: center !important;
      color: white !important;
      max-width: 600px !important;
      padding: 40px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  }
  .rest-animation {
      margin-bottom: 40px !important;
      height: 100px !important;
      position: relative !important;
  }
  .floating-icon {
      position: absolute !important;
      font-size: 32px !important;
      animation: float 3s ease-in-out infinite !important;
  }
  .floating-icon:nth-child(1) {
      left: 20% !important;
      animation-delay: 0s !important;
  }
  .floating-icon:nth-child(2) {
      left: 40% !important;
      animation-delay: 0.5s !important;
  }
  .floating-icon:nth-child(3) {
      left: 60% !important;
      animation-delay: 1s !important;
  }
  .floating-icon:nth-child(4) {
      left: 80% !important;
      animation-delay: 1.5s !important;
  }
  .rest-title {
      font-size: 48px !important;
      font-weight: 700 !important;
      margin-bottom: 16px !important;
      text-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
      animation: titlePulse 2s ease-in-out infinite !important;
  }
  .rest-subtitle {
      font-size: 20px !important;
      margin-bottom: 40px !important;
      opacity: 0.9 !important;
      font-weight: 400 !important;
  }
  .rest-tips {
      display: flex !important;
      justify-content: space-around !important;
      margin-bottom: 40px !important;
      flex-wrap: wrap !important;
      gap: 20px !important;
  }
  .tip {
      background: rgba(255,255,255,0.2) !important;
      padding: 16px 20px !important;
      border-radius: 12px !important;
      font-size: 16px !important;
      backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(255,255,255,0.3) !important;
      animation: tipSlideUp 0.6s ease-out forwards !important;
      opacity: 0 !important;
      transform: translateY(20px) !important;
  }
  .tip:nth-child(1) { animation-delay: 0.2s !important; }
  .tip:nth-child(2) { animation-delay: 0.4s !important; }
  .tip:nth-child(3) { animation-delay: 0.6s !important; }
  .continue-btn {
      background: rgba(255,255,255,0.9) !important;
      color: #667eea !important;
      border: none !important;
      padding: 16px 32px !important;
      border-radius: 12px !important;
      font-size: 18px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2) !important;
      font-family: inherit !important;
  }
  .continue-btn:hover {
      background: white !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3) !important;
  }
`;

/**
 * 休息提醒配置
 */
const REST_CONFIG = {
  icons: ['🌸', '🍃', '☁️', '🌺'],
  tips: [
    '💧 喝杯水补充水分',
    '👀 眺望远方放松眼睛', 
    '🧘 深呼吸舒缓身心'
  ],
  autoCloseDelay: 30000, // 30秒自动关闭
  title: '该休息一下啦！',
  subtitle: '深耕时光已结束，让眼睛和心灵都放松一下吧',
  buttonText: '继续深耕'
};

/**
 * 休息提醒管理类
 */
class RestReminderManager {
  constructor() {
    this.currentOverlay = null;
    this.autoCloseTimer = null;
  }

  /**
   * 创建浮动图标HTML
   * @returns {string} 浮动图标的HTML字符串
   */
  createFloatingIcons() {
    return REST_CONFIG.icons
      .map(icon => `<div class="floating-icon">${icon}</div>`)
      .join('');
  }

  /**
   * 创建休息提示HTML
   * @returns {string} 休息提示的HTML字符串
   */
  createRestTips() {
    return REST_CONFIG.tips
      .map(tip => `<div class="tip">${tip}</div>`)
      .join('');
  }

  /**
   * 创建休息提醒覆盖层
   * @returns {HTMLElement} 覆盖层元素
   */
  createOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "rest-reminder-overlay";

    overlay.innerHTML = `
      <div class="rest-reminder">
          <div class="rest-animation">
              ${this.createFloatingIcons()}
          </div>
          <h1 class="rest-title">${REST_CONFIG.title}</h1>
          <p class="rest-subtitle">${REST_CONFIG.subtitle}</p>
          <div class="rest-tips">
              ${this.createRestTips()}
          </div>
          <button class="continue-btn">${REST_CONFIG.buttonText}</button>
      </div>
    `;

    return overlay;
  }

  /**
   * 设置事件监听器
   * @param {HTMLElement} overlay - 覆盖层元素
   */
  setupEventListeners(overlay) {
    // 点击继续按钮关闭提醒
    const continueBtn = overlay.querySelector(".continue-btn");
    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        this.closeReminder();
      });
    }

    // 设置自动关闭定时器
    this.autoCloseTimer = setTimeout(() => {
      this.closeReminder();
    }, REST_CONFIG.autoCloseDelay);
  }

  /**
   * 关闭休息提醒
   */
  closeReminder() {
    if (this.currentOverlay) {
      safeRemoveElement(this.currentOverlay);
      this.currentOverlay = null;
    }
    
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }

  /**
   * 显示休息提醒
   */
  show() {
    console.log("showRestReminder 函数被调用");

    // 如果已有提醒在显示，先关闭
    if (this.currentOverlay) {
      this.closeReminder();
    }

    // 初始化动画样式
    initRestReminderAnimations();
    
    // 添加休息提醒样式
    createStyleElement(REST_REMINDER_STYLES, 'rest-reminder-styles');

    // 创建并显示覆盖层
    this.currentOverlay = this.createOverlay();
    document.body.appendChild(this.currentOverlay);

    // 设置事件监听器
    this.setupEventListeners(this.currentOverlay);

    console.log(
      "overlay已添加到页面，当前body子元素数量：",
      document.body.children.length
    );
  }
}

// 创建全局休息提醒管理器实例
const restReminderManager = new RestReminderManager();

/**
 * 显示休息提醒（全局函数）
 */
export function showRestReminder() {
  restReminderManager.show();
}

/**
 * 关闭休息提醒（全局函数）
 */
export function closeRestReminder() {
  restReminderManager.closeReminder();
}

export { restReminderManager, REST_CONFIG };