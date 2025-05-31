/**
 * 计时器模块
 * 处理自律提醒计时器的创建、显示和管理
 */


/**
 * 计时器样式常量
 */
const TIMER_STYLES = {
  display: `
    position: fixed !important;
    bottom: 30px !important;
    right: 30px !important;
    background: linear-gradient(135deg, rgba(45, 55, 72, 0.95), rgba(74, 85, 104, 0.9)) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    color: white !important;
    padding: 18px !important;
    border-radius: 16px !important;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    z-index: 2147483647 !important;
    font-family: 'Digital', BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    min-width: 100px !important;
    user-select: none !important;
    opacity: 0;
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: hidden;
    will-change: transform, opacity !important;
    transform: translateZ(0) !important;
  `,
  
  font: `
    @font-face {
        font-family: 'Digital';
        src: url(chrome-extension://${chrome.runtime.id}/fonts/digital.ttf) format('truetype');
        font-weight: normal;
        font-style: normal;
    }
  `
};

/**
 * 计时器管理类
 */
class TimerManager {
  constructor() {
    this.currentTimer = null;
  }

  /**
   * 清除现有计时器
   */
  clearExistingTimer() {
    if (window.deepWorkTimer) {
      clearInterval(window.deepWorkTimer.interval);
      if (window.deepWorkTimer.display) {
        window.deepWorkTimer.display.remove();
      }
    }
  }

  /**
   * 创建计时器显示元素
   * @returns {HTMLElement} 计时器显示元素
   */
  createTimerDisplay() {
    const timerDisplay = document.createElement("div");
    timerDisplay.className = "deep-work-timer";
    timerDisplay.style.cssText = TIMER_STYLES.display;
    return timerDisplay;
  }

  /**
   * 格式化时间显示
   * @param {number} totalSeconds - 总秒数
   * @param {number} originalMinutes - 原始分钟数（用于进度计算）
   * @returns {string} 格式化的HTML内容
   */
  formatTimeDisplay(totalSeconds, originalMinutes) {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    let timeText = "";
    if (hours > 0) {
      timeText = `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      timeText = `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }

    const progressOffset = 2 * Math.PI * 15 * (totalSeconds / (originalMinutes * 60));

    return `
      <div style="display: flex !important; flex-direction: column !important; align-items: center !important; gap: 4px !important; position: relative !important;font-family: 'Digital', sans-serif;">
          <div style="opacity: 0.9 !important; z-index: 10 !important; position: relative !important; color: #FFB74D !important;">
              距离休息还有
          </div>
          <div style="font-size: 22px !important; font-weight: bold !important; font-family: 'Digital','Courier New', 'Lucida Console', monospace !important; text-shadow: 0 0 10px rgba(255, 183, 77, 0.8), 0 0 20px rgba(255, 183, 77, 0.4), 0 0 30px rgba(255, 183, 77, 0.2) !important; letter-spacing: 2px !important; z-index: 10 !important; position: relative !important; color: #FFB74D !important; background: rgba(0, 0, 0, 0.2) !important; padding: 6px 12px !important; border-radius: 8px !important; border: 1px solid rgba(255, 183, 77, 0.3) !important;">${timeText}</div>
          <div style="font-size: 12px !important; opacity: 0.9 !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; z-index: 10 !important; position: relative !important;">疯狂摄取知识中</div>
          <div style="position: absolute !important; top: -8px !important; left: 50% !important; transform: translateX(-50%) !important; opacity: 0.25 !important;">
              <div style="transform: scale(0.4) !important;">
                  <svg width="40" height="40" viewBox="0 0 35 35">
                      <circle cx="17.5" cy="17.5" r="15" fill="none" stroke="rgba(255, 183, 77, 0.2)" stroke-width="1"/>
                      <circle cx="17.5" cy="17.5" r="15" fill="none" stroke="rgba(255, 183, 77, 0.7)" stroke-width="1.5" 
                          stroke-dasharray="${2 * Math.PI * 15}" 
                          stroke-dashoffset="${progressOffset}"
                          transform="rotate(-90 17.5 17.5)" style="transition: stroke-dashoffset 1s ease-in-out !important; filter: drop-shadow(0 0 3px rgba(255, 183, 77, 0.5)) !important;"/>
                  </svg>
              </div>
          </div>
      </div>
    `;
  }

  /**
   * 启动计时器动画
   * @param {HTMLElement} timerDisplay - 计时器显示元素
   */
  startTimerAnimation(timerDisplay) {
    setTimeout(() => {
      timerDisplay.style.opacity = "1";
      timerDisplay.style.transform = "translateY(0) scale(1)";
      timerDisplay.style.background =
        "linear-gradient(135deg, rgba(45, 55, 72, 0.95), rgba(74, 85, 104, 0.9), rgba(113, 128, 150, 0.85)) !important";
      timerDisplay.style.backgroundSize = "200% 200% !important";
      timerDisplay.style.animation =
        "gradientShift 6s cubic-bezier(0.4, 0, 0.6, 1) infinite, borderGlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite !important";
    }, 100);
  }
}

// 创建全局计时器管理器实例
const timerManager = new TimerManager();

/**
 * 初始化全局计时器
 * @param {number} minutes - 计时分钟数
 */
export function initializeTimer(minutes) {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      action: 'startTimer',
      minutes: minutes
    });
  }
}

export { timerManager };