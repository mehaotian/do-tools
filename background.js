/**
 * DO助手后台脚本
 * 负责处理popup和content script之间的消息转发
 */

/**
 * 全局定时器管理器
 * 确保全局只有一个定时器实例，在所有页面同步显示
 */
class GlobalTimerManager {
  constructor() {
    this.currentTimer = null;
    this.timerState = {
      isActive: false,
      totalMinutes: 0,
      remainingSeconds: 0,
      startTime: null
    };
  }

  /**
   * 启动新的定时器
   * @param {number} minutes - 定时分钟数
   */
  async startTimer(minutes) {
    this.clearExistingTimer();
    
    this.timerState = {
      isActive: true,
      totalMinutes: minutes,
      remainingSeconds: minutes * 60,
      startTime: Date.now()
    };

    // 立即广播初始状态到所有标签页
    await this.broadcastTimerState();

    // 启动定时器
    this.currentTimer = setInterval(async () => {
      this.timerState.remainingSeconds--;
      
      if (this.timerState.remainingSeconds <= 0) {
        // 定时器结束
        await this.onTimerComplete();
      } else {
        // 广播当前状态到所有标签页
        await this.broadcastTimerState();
      }
    }, 1000);
  }

  /**
   * 清除现有定时器
   */
  clearExistingTimer() {
    if (this.currentTimer) {
      clearInterval(this.currentTimer);
      this.currentTimer = null;
    }
  }

  /**
   * 停止当前定时器
   */
  async stopTimer() {
    this.clearExistingTimer();
    this.timerState.isActive = false;
    
    await this.broadcastMessage({
      action: 'timerStopped'
    });
  }

  /**
   * 定时器完成处理
   */
  async onTimerComplete() {
    const totalMinutes = this.timerState.totalMinutes;
    this.clearExistingTimer();
    this.timerState.isActive = false;
    
    await this.sendToActiveTab({
      action: 'timerComplete',
      totalMinutes: totalMinutes
    });
    
    await this.broadcastMessage({
      action: 'timerStopped'
    });
  }

  /**
   * 获取当前定时器状态
   * @returns {Object} 当前定时器状态
   */
  getTimerState() {
    return { ...this.timerState };
  }

  /**
   * 广播定时器状态到所有标签页
   */
  async broadcastTimerState() {
    const message = {
      action: 'timerUpdate',
      timerState: { ...this.timerState }
    };
    
    await this.broadcastMessage(message);
  }

  /**
   * 向当前激活的标签页发送消息
   * @param {Object} message - 要发送的消息
   */
  async sendToActiveTab(message) {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (activeTab) {
        try {
          await chrome.tabs.sendMessage(activeTab.id, message);
        } catch (error) {
          // 忽略无法发送消息的标签页
        }
      }
    } catch (error) {
      // 发送失败时静默处理
    }
  }

  /**
   * 向所有标签页广播消息
   * @param {Object} message - 要广播的消息
   */
  async broadcastMessage(message) {
    try {
      const tabs = await chrome.tabs.query({});
      
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // 忽略无法发送消息的标签页（如chrome://页面）
        }
      }
    } catch (error) {
      // 广播失败时静默处理
    }
  }

}

// 创建全局定时器管理器实例
const globalTimer = new GlobalTimerManager();

/**
 * 消息处理器类
 * 统一管理各种消息的处理逻辑
 */
class MessageHandler {
  /**
   * 处理启动计时器消息
   * @param {Object} request - 消息请求对象
   * @param {number} request.minutes - 计时分钟数
   */
  static async handleStartTimer(request) {
    await globalTimer.startTimer(request.minutes);
  }

  /**
   * 处理停止计时器消息
   */
  static async handleStopTimer() {
    await globalTimer.stopTimer();
  }

  /**
   * 处理获取计时器状态消息
   * @param {Function} sendResponse - 响应函数
   */
  static handleGetTimerState(sendResponse) {
    const state = globalTimer.getTimerState();
    sendResponse({ timerState: state });
  }
  
  /**
   * 处理未知消息类型
   * @param {Object} request - 消息请求对象
   */
  static handleUnknownAction(request) {
    // 静默处理未知消息类型
  }
}

/**
 * 消息路由器
 * 根据消息类型分发到对应的处理器
 */
const messageRouter = {
  'startTimer': MessageHandler.handleStartTimer,
  'stopTimer': MessageHandler.handleStopTimer,
  'getTimerState': MessageHandler.handleGetTimerState
};

/**
 * 监听来自popup和content script的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handler = messageRouter[request.action];
  
  if (handler) {
    if (request.action === 'getTimerState') {
      handler(sendResponse);
      return true;
    } else {
      handler(request).catch(error => {
        // 静默处理错误
      });
    }
  } else {
    MessageHandler.handleUnknownAction(request);
  }
  
  return true;
});

/**
 * 扩展安装或启动时的初始化
 */
chrome.runtime.onInstalled.addListener((details) => {
  // 扩展安装或更新时的初始化逻辑
});

/**
 * 扩展启动时的处理
 */
chrome.runtime.onStartup.addListener(() => {
  // 扩展启动时的初始化逻辑
});