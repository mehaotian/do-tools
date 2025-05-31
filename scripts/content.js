/**
 * DO助手内容脚本
 * 负责在网页中显示全局定时器和休息提醒
 */

/**
 * 全局定时器显示类
 * 负责在网页中显示全局定时器
 */
class GlobalTimerDisplay {
  constructor() {
    this.timerElement = null; // 存储定时器元素
    this.isVisible = false; // 存储定时器是否可见
    this.currentState = null; // 存储当前状态
    this.isDestroyed = false; // 标记是否已销毁
    this.eventListeners = new Map(); // 跟踪事件监听器
    this.animationFrameId = null; // 存储动画帧ID
    
    // 绑定方法到实例
    this.cleanup = this.cleanup.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleWindowFocus = this.handleWindowFocus.bind(this);
    
    // 监听页面卸载事件
    this.addEventListenerTracked(window, 'beforeunload', this.cleanup);
    this.addEventListenerTracked(document, 'visibilitychange', this.handleVisibilityChange);
    this.addEventListenerTracked(window, 'focus', this.handleWindowFocus);
  }

  /**
   * 创建定时器显示元素
   */
  createTimerElement() {
    if (this.timerElement || this.isDestroyed) {
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
    this.stopButton.innerHTML = '⏹ 停止自律';
    
    const stopClickHandler = (e) => {
      e.stopPropagation();
      this.stopTimer();
    };
    
    this.addEventListenerTracked(this.stopButton, 'click', stopClickHandler);

    this.hoverOverlay.appendChild(this.stopButton);
    this.timerElement.appendChild(this.hoverOverlay);
  }

  /**
   * 添加鼠标事件
   */
  addMouseEvents() {
    const mouseEnterHandler = () => {
      if (!this.isDestroyed && this.hoverOverlay) {
        this.hoverOverlay.classList.add('visible');
      }
    };
    
    const mouseLeaveHandler = () => {
      if (!this.isDestroyed && this.hoverOverlay) {
        this.hoverOverlay.classList.remove('visible');
      }
    };
    
    this.addEventListenerTracked(this.timerElement, 'mouseenter', mouseEnterHandler);
    this.addEventListenerTracked(this.timerElement, 'mouseleave', mouseLeaveHandler);
  }

  /**
   * 停止计时器
   */
  stopTimer() {
    if (this.isDestroyed) {
      return;
    }
    
    if (isExtensionContextValid()) {
      try {
        chrome.runtime.sendMessage({ action: 'stopTimer' });
      } catch (error) {
        console.warn('Failed to send stop timer message:', error.message);
      }
    }
    this.hideTimerWithAnimation();
  }

  /**
   * 带动画的隐藏定时器
   */
  hideTimerWithAnimation() {
    if (!this.timerElement || this.isDestroyed) return;
    
    this.timerElement.classList.add('timer-hiding');
    
    const hideTimeout = setTimeout(() => {
      if (this.timerElement && this.timerElement.parentNode && !this.isDestroyed) {
        this.timerElement.parentNode.removeChild(this.timerElement);
        this.timerElement = null;
        this.isVisible = false;
      }
    }, 500);
    
    // 如果组件被销毁，立即清理
    if (this.isDestroyed) {
      clearTimeout(hideTimeout);
    }
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

    return `
      <div class="timer-display-content">
          <div class="timer-label-text">
              距离休息还有
          </div>
          <div class="timer-time-display">${timeText}</div>
          <div class="timer-status-text">疯狂摄取知识中</div>
      </div>
    `;
  }

  /**
   * 更新定时器内容
   * @param {Object} timerState - 定时器状态
   */
  updateTimerContent(timerState) {
    if (!this.timerElement || this.isDestroyed) {
      return;
    }

    const content = this.formatTimeDisplay(
      timerState.remainingSeconds,
      timerState.originalMinutes || 25
    );
    
    this.timerElement.innerHTML = content;
    
    // 重新添加悬停遮罩和事件
    this.createHoverOverlay();
    this.addMouseEvents();
  }

  /**
   * 更新定时器显示
   * @param {Object} timerState - 定时器状态
   */
  updateDisplay(timerState) {
    if (this.isDestroyed) {
      return;
    }
    
    if (!timerState || !timerState.isActive) {
      this.hideTimer();
      return;
    }

    this.currentState = timerState;

    if (!this.isVisible) {
      this.createTimerElement();
    }

    this.updateTimerContent(timerState);
  }

  /**
   * 隐藏定时器
   */
  hideTimer() {
    if (this.timerElement && !this.isDestroyed) {
      this.hideTimerWithAnimation();
    }
  }

  /**
   * 添加事件监听器并跟踪
   */
  addEventListenerTracked(element, event, handler, options) {
    if (this.isDestroyed) return;
    
    element.addEventListener(event, handler, options);
    
    // 跟踪事件监听器以便后续清理
    const key = `${element.constructor.name}-${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key).push({ element, event, handler, options });
  }
  
  /**
   * 处理页面可见性变化
   */
  handleVisibilityChange() {
    if (!document.hidden && !this.isDestroyed) {
      this.checkExistingTimer();
    }
  }
  
  /**
   * 处理窗口焦点变化
   */
  handleWindowFocus() {
    if (!this.isDestroyed) {
      this.checkExistingTimer();
    }
  }
  
  /**
   * 检查现有定时器状态
   */
  checkExistingTimer() {
    if (this.isDestroyed || !isExtensionContextValid()) {
      return;
    }
    
    try {
      chrome.runtime.sendMessage({ action: 'getTimerState' }, (response) => {
        if (this.isDestroyed) return;
        
        if (chrome.runtime.lastError) {
          console.warn('Error getting timer state:', chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.timerState && response.timerState.isActive) {
          this.updateDisplay(response.timerState);
        }
      });
    } catch (error) {
      console.warn('Failed to check existing timer:', error.message);
    }
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    this.isDestroyed = true;
    
    // 清理动画帧
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // 清理事件监听器
    this.eventListeners.forEach((listeners) => {
      listeners.forEach(({ element, event, handler, options }) => {
        try {
          element.removeEventListener(event, handler, options);
        } catch (error) {
          console.warn('Error removing event listener:', error.message);
        }
      });
    });
    this.eventListeners.clear();
    
    // 清理DOM元素
    if (this.timerElement && this.timerElement.parentNode) {
      this.timerElement.parentNode.removeChild(this.timerElement);
      this.timerElement = null;
    }
    
    this.isVisible = false;
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


// 创建全局时间实例
let globalTimerDisplay = null;

// 初始化函数
function initializeTimerDisplay() {
  if (!globalTimerDisplay) {
    globalTimerDisplay = new GlobalTimerDisplay();
    
    // 监听来自background的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!globalTimerDisplay || globalTimerDisplay.isDestroyed) {
        return;
      }
      
      try {
        if (request.action === 'timerUpdate') {
          globalTimerDisplay.updateDisplay(request.timerState);
        } else if (request.action === 'timerComplete') {
          globalTimerDisplay.showRestReminder(request.totalMinutes);
        } else if (request.action === 'timerStopped') {
          globalTimerDisplay.hideTimer();
        }
      } catch (error) {
        console.error('Error handling timer message:', error.message);
      }
    });
    
    // 检查现有定时器
    globalTimerDisplay.checkExistingTimer();
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTimerDisplay);
} else {
  initializeTimerDisplay();
}

/**
 * 检查扩展上下文是否有效
 * @returns {boolean} 扩展上下文是否有效
 */
function isExtensionContextValid() {
  try {
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch (error) {
    return false;
  }
}
