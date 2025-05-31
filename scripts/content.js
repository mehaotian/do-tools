/**
 * DO助手内容脚本
 * 负责在网页中显示全局定时器和休息提醒
 */
class GlobalTimerDisplay {
  constructor() {
    this.timerElement = null;
    this.isVisible = false;
    this.currentState = null;
  }

  /**
   * 创建定时器显示元素
   */
  createTimerElement() {
    if (this.timerElement) {
      return;
    }

    this.timerElement = document.createElement('div');
    this.timerElement.className = 'deep-work-timer';

    this.addFontStyles();
    this.createHoverOverlay();
    this.addMouseEvents();

    document.body.appendChild(this.timerElement);
    this.startTimerAnimation();
  }

  /**
   * 创建悬停遮罩和停止按钮
   */
  createHoverOverlay() {
    this.hoverOverlay = document.createElement('div');
    this.hoverOverlay.className = 'timer-hover-overlay';

    this.stopButton = document.createElement('button');
    this.stopButton.className = 'timer-stop-button';
    this.stopButton.innerHTML = '⏹ 停止计时';
    this.stopButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.stopTimer();
    });

    this.hoverOverlay.appendChild(this.stopButton);
    this.timerElement.appendChild(this.hoverOverlay);
  }

  /**
   * 添加鼠标事件
   */
  addMouseEvents() {
    this.timerElement.addEventListener('mouseenter', () => {
      this.hoverOverlay.classList.add('visible');
    });

    this.timerElement.addEventListener('mouseleave', () => {
      this.hoverOverlay.classList.remove('visible');
    });
  }

  /**
   * 停止计时器
   */
  stopTimer() {
    if (isExtensionContextValid()) {
      try {
        chrome.runtime.sendMessage({ action: 'stopTimer' });
      } catch (error) {
        // 静默处理扩展上下文失效错误
      }
    }
    this.hideTimerWithAnimation();
  }

  /**
   * 带动画的隐藏定时器
   */
  hideTimerWithAnimation() {
    if (!this.timerElement) return;
    
    this.timerElement.classList.add('timer-hiding');
    
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
   * 启动定时器动画
   */
  startTimerAnimation() {
    setTimeout(() => {
      this.timerElement.classList.add('timer-active');
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
      <div class="timer-display-content">
          <div class="timer-label-text">
              距离休息还有
          </div>
          <div class="timer-time-display">${timeText}</div>
          <div class="timer-status-text">疯狂摄取知识中</div>
          <div class="timer-progress-container">
              <div class="timer-progress-svg">
                  <svg width="40" height="40" viewBox="0 0 35 35">
                      <circle cx="17.5" cy="17.5" r="15" fill="none" stroke="rgba(255, 183, 77, 0.2)" stroke-width="1"/>
                      <circle cx="17.5" cy="17.5" r="15" fill="none" stroke="rgba(255, 183, 77, 0.7)" stroke-width="1.5" 
                          class="timer-progress-circle"
                          stroke-dasharray="${2 * Math.PI * 15}" 
                          stroke-dashoffset="${progressOffset}"
                          transform="rotate(-90 17.5 17.5)"/>
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


    let contentContainer = this.timerElement.querySelector('.timer-content');
    if (!contentContainer) {
      contentContainer = document.createElement('div');
      contentContainer.className = 'timer-content';
      contentContainer.style.cssText = 'position: relative; z-index: 1;';
      this.timerElement.appendChild(contentContainer);
      

      if (this.hoverOverlay && !this.timerElement.contains(this.hoverOverlay)) {
        this.timerElement.appendChild(this.hoverOverlay);
      }
    }


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
          <h2 class="rest-title">L站虽好，但也要注意节制哦~</h2>
          <p class="rest-message">您已经学习 ${totalMinutes} 分钟，超过0.1%佬友</p>
          <p class="rest-message">佬友你太牛逼了！！！</p>
          <p class="rest-tip">建议休息 5-10 分钟，放松一下眼睛和身体</p>
          <div class="rest-actions">
            <button class="close-btn">关闭提醒</button>
          </div>
        </div>
      </div>
    `;

    const closeBtn = reminderElement.querySelector('.close-btn');
    
    const closeReminder = () => {
      if (document.body.contains(reminderElement)) {
        document.body.removeChild(reminderElement);
      }
    };
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeReminder);
    }

    setTimeout(closeReminder, 30000);

    document.body.appendChild(reminderElement);
  }


}


const globalTimerDisplay = new GlobalTimerDisplay();

/**
 * 监听来自后台脚本的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
  }
});

/**
 * 检查扩展上下文是否有效
 */
function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch (error) {
    return false;
  }
}

/**
 * 获取定时器状态
 */
function getTimerState() {
  if (!isExtensionContextValid()) {
    return;
  }
  
  try {
    chrome.runtime.sendMessage({ action: 'getTimerState' }, (response) => {
      if (chrome.runtime.lastError) {
        return;
      }
      if (response && response.timerState) {
        globalTimerDisplay.updateDisplay(response.timerState);
      }
    });
  } catch (error) {
    // 静默处理扩展上下文失效错误
  }
}

getTimerState();

/**
 * 监听页面可见性变化
 */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isExtensionContextValid()) {
    getTimerState();
  }
});

/**
 * 监听窗口焦点变化
 */
window.addEventListener('focus', () => {
  if (isExtensionContextValid()) {
    getTimerState();
  }
});
