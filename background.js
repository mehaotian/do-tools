/**
 * DO助手后台脚本
 * 负责处理popup和content script之间的消息转发
 */
console.log("DO助手后台脚本已加载");

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
    // 清除已存在的定时器
    this.clearExistingTimer();

    console.log(`启动全局定时器: ${minutes}分钟`);
    
    // 设置定时器状态
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
    console.log('全局定时器已停止');
    
    // 广播停止状态到所有标签页
    await this.broadcastMessage({
      action: 'timerStopped'
    });
  }

  /**
   * 定时器完成处理
   */
  async onTimerComplete() {
    console.log('定时器完成');
    const totalMinutes = this.timerState.totalMinutes;
    this.clearExistingTimer();
    this.timerState.isActive = false;
    
    // 只向当前激活的标签页发送定时器完成消息
    await this.sendToActiveTab({
      action: 'timerComplete',
      totalMinutes: totalMinutes
    });
    
    // 向其他标签页发送定时器停止消息
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
          console.log(`消息已发送到激活标签页 ${activeTab.id}`);
        } catch (error) {
          console.debug(`无法向激活标签页 ${activeTab.id} 发送消息:`, error.message);
        }
      }
    } catch (error) {
      console.error('发送消息到激活标签页失败:', error);
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
          console.debug(`无法向标签页 ${tab.id} 发送消息:`, error.message);
        }
      }
    } catch (error) {
      console.error('广播消息失败:', error);
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
    console.log(`收到启动计时器消息: ${request.minutes}分钟`);
    await globalTimer.startTimer(request.minutes);
  }

  /**
   * 处理停止计时器消息
   */
  static async handleStopTimer() {
    console.log('收到停止计时器消息');
    await globalTimer.stopTimer();
  }

  /**
   * 处理获取计时器状态消息
   * @param {Function} sendResponse - 响应函数
   */
  static handleGetTimerState(sendResponse) {
    const state = globalTimer.getTimerState();
    console.log('返回计时器状态:', state);
    sendResponse({ timerState: state });
  }
  
  /**
   * 处理未知消息类型
   * @param {Object} request - 消息请求对象
   */
  static handleUnknownAction(request) {
    console.warn(`收到未知消息类型: ${request.action}`);
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

// 监听来自popup和content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request);
  
  const handler = messageRouter[request.action];
  
  if (handler) {
    // 特殊处理需要同步响应的消息
    if (request.action === 'getTimerState') {
      handler(sendResponse);
      return true; // 保持消息通道开放
    } else {
      // 异步处理其他消息
      handler(request).catch(error => {
        console.error(`处理消息 ${request.action} 时发生错误:`, error);
      });
    }
  } else {
    MessageHandler.handleUnknownAction(request);
  }
  
  // 返回true表示异步响应
  return true;
});

// 扩展安装或启动时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('DO助手扩展已安装/更新:', details.reason);
  
  if (details.reason === 'install') {
    console.log('欢迎使用DO助手！');
  } else if (details.reason === 'update') {
    console.log('DO助手已更新到新版本');
  }
});

// 扩展启动时
chrome.runtime.onStartup.addListener(() => {
  console.log('DO助手后台服务已启动');
});