/**
 * 动画模块
 * 处理各种动画效果
 */

import { formatTime, createStyleElement } from './utils.js';

/**
 * 动画样式常量
 */
const ANIMATION_STYLES = {
  popup: `
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
  `,
  
  timer: `
    @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        33.33% { background-position: 100% 50%; }
        66.66% { background-position: 200% 50%; }
    }
    @keyframes borderGlow {
        0%, 100% { box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 rgba(255, 183, 77, 0); }
        50% { box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 20px rgba(255, 183, 77, 0.3); }
    }
  `,
  
  restReminder: `
    @keyframes overlayFadeIn {
        from {
            opacity: 0 !important;
            transform: scale(0.95) !important;
        }
        to {
            opacity: 1 !important;
            transform: scale(1) !important;
        }
    }
    @keyframes float {
        0%, 100% {
            transform: translateY(0px) !important;
        }
        50% {
            transform: translateY(-20px) !important;
        }
    }
    @keyframes titlePulse {
        0%, 100% {
            transform: scale(1) !important;
        }
        50% {
            transform: scale(1.05) !important;
        }
    }
    @keyframes tipSlideUp {
        to {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    }
  `
};

/**
 * 初始化弹窗动画
 * 为弹窗元素添加动画效果
 */
export function initPopupAnimations() {
  if (!document.getElementById('popup-animations-style')) {
    const style = document.createElement('style');
    style.id = 'popup-animations-style';
    style.textContent = ANIMATION_STYLES;
    document.head.appendChild(style);
  }
  
  const popupElements = document.querySelectorAll('.popup, .modal, .dialog');
  popupElements.forEach(element => {
    element.classList.add('popup-fade-in');
  });
}

/**
 * 启动倒计时动画效果
 * @param {HTMLElement} popup - 弹窗元素
 */
export function startCountdownAnimation(popup) {
  const timeText = popup.querySelector(".time-text");
  if (!timeText) return;

  let currentTime =
    parseInt(timeText.textContent.split(":")[0]) * 60 +
    parseInt(timeText.textContent.split(":")[1]);

  const countdownInterval = setInterval(() => {
    if (currentTime <= 0) {
      clearInterval(countdownInterval);
      // 倒计时结束动画
      popup.style.animation =
        "endCelebration 1s ease-in-out, glowBreath 3s ease-in-out infinite 1s";
      return;
    }

    currentTime--;
    const newTimeText = formatTime(currentTime);
    timeText.textContent = newTimeText;

    // 每分钟的特殊效果
    if (currentTime % 60 === 0 && currentTime > 0) {
      popup.style.animation =
        "minuteSpecial 0.5s ease-out, glowBreath 3s ease-in-out infinite 0.5s";
    }
  }, 1000);
}

/**
 * 初始化计时器动画样式
 */
export function initTimerAnimations() {
  if (!document.getElementById("deep-work-timer-styles")) {
    createStyleElement(ANIMATION_STYLES.timer, 'deep-work-timer-styles');
  }
}

/**
 * 初始化休息提醒动画样式
 */
export function initRestReminderAnimations() {
  createStyleElement(ANIMATION_STYLES.restReminder, 'rest-reminder-animations');
}

/**
 * 添加点击反馈动画
 * @param {HTMLElement} element - 要添加动画的元素
 */
export function addClickFeedback(element) {
  element.style.transform = "scale(0.98)";
  setTimeout(() => {
    element.style.transform = "";
  }, 150);
}