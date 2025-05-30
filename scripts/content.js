/**
 * DO助手内容脚本
 * 负责在网页中显示全局定时器和休息提醒
 * 基于temp中的原始设计，保持样式和逻辑一致
 */

// 全局定时器显示管理器
class GlobalTimerDisplay {
  constructor() {
    this.timerElement = null;
    this.isVisible = false;
    this.currentState = null;
  }

  /**
   * 创建定时器显示元素
   * 使用temp中的样式设计
   */
  createTimerElement() {
    if (this.timerElement) {
      return;
    }

    // 创建定时器容器，使用temp中的样式
    this.timerElement = document.createElement('div');
    this.timerElement.className = 'deep-work-timer';
    this.timerElement.style.cssText = `
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
    `;

    // 添加字体样式
    this.addFontStyles();
    
    // 添加动画样式
    this.addAnimationStyles();

    // 创建悬停遮罩和停止按钮
    this.createHoverOverlay();
    
    // 添加鼠标事件
    this.addMouseEvents();
    
    // 添加到页面
    document.body.appendChild(this.timerElement);
    
    // 启动动画
    this.startTimerAnimation();
  }

  /**
   * 创建悬停遮罩和停止按钮
   */
  createHoverOverlay() {
    // 创建悬停遮罩
    this.hoverOverlay = document.createElement('div');
    this.hoverOverlay.className = 'timer-hover-overlay';
    this.hoverOverlay.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(255, 255, 255, 0.9) !important;
      border-radius: 16px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      opacity: 0 !important;
      visibility: hidden !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      z-index: 10 !important;
    `;

    // 创建停止按钮
    this.stopButton = document.createElement('button');
    this.stopButton.className = 'timer-stop-button';
    this.stopButton.innerHTML = '⏹ 停止计时';
    this.stopButton.style.cssText = `
      background: linear-gradient(135deg, #ff4757, #ff3742) !important;
      color: white !important;
      border: none !important;
      padding: 12px 20px !important;
      border-radius: 25px !important;
      font-size: 14px !important;
      font-weight: bold !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4) !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      transform: scale(0.9) !important;
    `;

    // 停止按钮悬停效果
    this.stopButton.addEventListener('mouseenter', () => {
      this.stopButton.style.transform = 'scale(1) translateY(-2px) !important';
      this.stopButton.style.boxShadow = '0 6px 20px rgba(255, 71, 87, 0.6) !important';
    });

    this.stopButton.addEventListener('mouseleave', () => {
      this.stopButton.style.transform = 'scale(0.9) !important';
      this.stopButton.style.boxShadow = '0 4px 15px rgba(255, 71, 87, 0.4) !important';
    });

    // 停止按钮点击事件
    this.stopButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.stopTimer();
    });

    this.hoverOverlay.appendChild(this.stopButton);
    // 确保悬停遮罩在最后添加，这样z-index才能正确工作
    // 先不添加，等内容容器创建后再添加
  }

  /**
   * 添加鼠标事件
   */
  addMouseEvents() {
    this.timerElement.addEventListener('mouseenter', () => {
      this.hoverOverlay.style.opacity = '1';
      this.hoverOverlay.style.visibility = 'visible';
    });

    this.timerElement.addEventListener('mouseleave', () => {
      this.hoverOverlay.style.opacity = '0';
      this.hoverOverlay.style.visibility = 'hidden';
    });
  }

  /**
   * 停止定时器
   */
  stopTimer() {
    // 发送停止定时器消息到后台
    chrome.runtime.sendMessage({ action: 'stopTimer' });
    
    // 添加关闭动画
    this.hideTimerWithAnimation();
  }

  /**
   * 带动画的隐藏定时器
   */
  hideTimerWithAnimation() {
    if (!this.timerElement) return;
    
    // 添加关闭动画
    this.timerElement.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    this.timerElement.style.transform = 'translateY(20px) scale(0.8)';
    this.timerElement.style.opacity = '0';
    
    // 动画完成后移除元素
    setTimeout(() => {
      if (this.timerElement && this.timerElement.parentNode) {
        this.timerElement.parentNode.removeChild(this.timerElement);
        this.timerElement = null;
        this.isVisible = false;
      }
    }, 500);
  }

  /**
   * 添加字体样式
   */
  addFontStyles() {
    if (document.getElementById('do-timer-font-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'do-timer-font-styles';
    style.textContent = `
      @font-face {
        font-family: 'Digital';
        src: url(chrome-extension://${chrome.runtime.id}/fonts/digital.ttf) format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 添加动画样式
   */
  addAnimationStyles() {
    if (document.getElementById('do-timer-animation-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'do-timer-animation-styles';
    style.textContent = `
      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        33.33% { background-position: 100% 50%; }
        66.66% { background-position: 200% 50%; }
      }
      @keyframes borderGlow {
        0%, 100% { 
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 rgba(45, 55, 72, 0); 
        }
        50% { 
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.1), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 20px rgba(45, 55, 72, 0.4); 
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 启动定时器动画
   */
  startTimerAnimation() {
    setTimeout(() => {
      this.timerElement.style.opacity = "1";
      this.timerElement.style.transform = "translateY(0) scale(1)";
      this.timerElement.style.background =
        "linear-gradient(135deg, rgba(45, 55, 72, 0.95), rgba(74, 85, 104, 0.9), rgba(113, 128, 150, 0.85)) !important";
      this.timerElement.style.backgroundSize = "200% 200% !important";
      this.timerElement.style.animation =
        "gradientShift 6s cubic-bezier(0.4, 0, 0.6, 1) infinite, borderGlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite !important";
    }, 100);
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
   * 更新定时器显示
   * @param {Object} timerState - 定时器状态
   */
  updateDisplay(timerState) {
    if (!timerState.isActive) {
      this.hideTimer();
      return;
    }

    if (!this.timerElement) {
      this.createTimerElement();
    }

    this.showTimer();
    this.currentState = timerState;

    // 检查是否已有内容容器，如果没有则创建
    let contentContainer = this.timerElement.querySelector('.timer-content');
    if (!contentContainer) {
      contentContainer = document.createElement('div');
      contentContainer.className = 'timer-content';
      contentContainer.style.cssText = 'position: relative; z-index: 1;';
      this.timerElement.appendChild(contentContainer);
      
      // 在内容容器创建后添加悬停遮罩
      if (this.hoverOverlay && !this.timerElement.contains(this.hoverOverlay)) {
        this.timerElement.appendChild(this.hoverOverlay);
      }
    }

    // 只更新内容部分，保留悬停遮罩
    contentContainer.innerHTML = this.formatTimeDisplay(
      timerState.remainingSeconds, 
      timerState.totalMinutes
    );
  }

  /**
   * 显示定时器
   */
  showTimer() {
    if (this.timerElement && !this.isVisible) {
      this.timerElement.style.display = 'block';
      this.isVisible = true;
    }
  }

  /**
   * 隐藏定时器
   */
  hideTimer() {
    if (this.timerElement) {
      this.timerElement.style.display = 'none';
      this.isVisible = false;
    }
  }

  /**
   * 停止定时器
   */
  stopTimer() {
    chrome.runtime.sendMessage({ action: 'stopTimer' });
  }

  /**
   * 显示休息提醒
   * @param {number} totalMinutes - 总计时分钟数
   * 保持与temp中一致的设计风格
   */
  showRestReminder(totalMinutes) {
    this.hideTimer();
    
    // 创建休息提醒界面
    const reminderElement = document.createElement('div');
    reminderElement.id = 'do-rest-reminder';
    reminderElement.innerHTML = `
      <div class="rest-overlay">
        <div class="rest-content">
          <div class="rest-icon">🎉</div>
          <h2 class="rest-title">深耕时间结束！</h2>
          <p class="rest-message">您已疯狂摄取 ${totalMinutes} 分钟知识，超过0.1%佬友，做得很棒！</p>
          <p class="rest-tip">建议休息 5-10 分钟，放松一下眼睛和身体</p>
          <div class="rest-actions">
            <button class="continue-btn">继续深耕</button>
            <button class="close-btn">关闭提醒</button>
          </div>
        </div>
      </div>
    `;

    // 添加休息提醒样式
    this.addRestReminderStyles();

    // 添加事件监听
    const continueBtn = reminderElement.querySelector('.continue-btn');
    const closeBtn = reminderElement.querySelector('.close-btn');
    
    const closeReminder = () => {
      if (document.body.contains(reminderElement)) {
        document.body.removeChild(reminderElement);
      }
    };
    
    continueBtn.addEventListener('click', closeReminder);
    closeBtn.addEventListener('click', closeReminder);

    // 30秒后自动关闭
    setTimeout(closeReminder, 30000);

    document.body.appendChild(reminderElement);
  }

  /**
   * 添加休息提醒样式
   */
  addRestReminderStyles() {
    if (document.getElementById('do-rest-reminder-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'do-rest-reminder-styles';
    style.textContent = `
      #do-rest-reminder {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10001;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      .rest-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.5s ease;
      }

      .rest-content {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideIn 0.5s ease;
      }

      .rest-icon {
        font-size: 60px;
        margin-bottom: 20px;
        animation: bounce 2s ease infinite;
      }

      .rest-title {
        font-size: 28px;
        margin-bottom: 16px;
        font-weight: bold;
      }

      .rest-message {
        font-size: 18px;
        margin-bottom: 12px;
        opacity: 0.9;
      }

      .rest-tip {
        font-size: 14px;
        margin-bottom: 30px;
        opacity: 0.8;
      }

      .rest-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
      }

      .continue-btn, .close-btn {
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .continue-btn {
        background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
        color: white;
        box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
      }

      .continue-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(79, 172, 254, 0.6);
      }

      .close-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
    `;

    document.head.appendChild(style);
  }
}

// 创建全局定时器显示实例
const globalTimerDisplay = new GlobalTimerDisplay();

// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script 收到消息:', request);
  
  switch (request.action) {
    case 'timerUpdate':
      globalTimerDisplay.updateDisplay(request.timerState);
      break;
      
    case 'timerComplete':
      globalTimerDisplay.showRestReminder(request.totalMinutes);
      break;
      
    case 'timerStopped':
      globalTimerDisplay.hideTimer();
      break;
      
    default:
      console.log('未知消息类型:', request.action);
  }
});

// 获取定时器状态的函数
function getTimerState() {
  chrome.runtime.sendMessage({ action: 'getTimerState' }, (response) => {
    if (response && response.timerState) {
      globalTimerDisplay.updateDisplay(response.timerState);
    }
  });
}

// 页面加载时获取当前定时器状态
getTimerState();

// 监听页面可见性变化
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // 页面变为可见时，重新获取定时器状态
    console.log('页面变为可见，重新获取定时器状态');
    getTimerState();
  }
});

// 监听窗口焦点变化
window.addEventListener('focus', () => {
  // 窗口获得焦点时，重新获取定时器状态
  console.log('窗口获得焦点，重新获取定时器状态');
  getTimerState();
});

// 计时器初始化逻辑已移至 timer.js 模块
// 休息提醒逻辑已移至 restReminder.js 模块
