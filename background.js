/**
 * DO助手后台脚本
 * 负责处理popup和content script之间的消息转发
 * 以及主题管理功能
 */

// 配置侧边栏行为
chrome.runtime.onInstalled.addListener(() => {
  // 设置点击扩展图标时不自动打开侧边栏
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
});

/**
 * 全局定时器管理器
 * 确保全局只有一个定时器实例，在所有页面同步显示
 */
class GlobalTimerManager {
  constructor() {
    this.currentTimer = null; // 存储当前定时器的引用
    // 初始化定时器状态
    this.timerState = {
      isActive: false,
      totalMinutes: 0,
      remainingSeconds: 0,
      startTime: null,
      isPaused: false, // 新增：是否暂停
      pausedTime: null, // 新增：暂停时间点
    };
    this.isDestroyed = false; // 标记是否已销毁

    // 绑定清理方法到实例
    this.cleanup = this.cleanup.bind(this);

    // 监听扩展卸载事件
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.onSuspend?.addListener(this.cleanup);
    }
  }

  /**
   * 启动新的定时器
   * @param {number} minutes - 定时分钟数
   */
  async startTimer(minutes) {
    // 检查实例是否已销毁
    if (this.isDestroyed) {
      console.warn("计时器管理器已被摧毁");
      return;
    }

    // 验证输入参数
    if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 1440) {
      console.error("无效的计时器持续时间:", minutes);
      return;
    }

    // 清除现有定时器，如果存在则清除
    this.clearExistingTimer();

    // 设置新的定时器状态
    this.timerState = {
      isActive: true,
      totalMinutes: minutes,
      remainingSeconds: minutes * 60,
      startTime: Date.now(),
      isPaused: false,
      pausedTime: null,
    };

    // 立即广播初始状态到所有标签页
    await this.broadcastTimerState();

    // 启动定时器，使用箭头函数确保this绑定正确
    this.currentTimer = setInterval(async () => {
      // 检查实例是否已销毁
      if (this.isDestroyed) {
        this.clearExistingTimer();
        return;
      }

      // 如果计时器暂停，不更新剩余时间
      if (this.timerState.isPaused) {
        return;
      }

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
   * 暂停计时器
   */
  async pauseTimer() {
    if (!this.timerState.isActive || this.timerState.isPaused) {
      return;
    }

    this.timerState.isPaused = true;
    this.timerState.pausedTime = Date.now();
    await this.broadcastTimerState();
  }

  /**
   * 继续计时器
   */
  async resumeTimer() {
    if (!this.timerState.isActive || !this.timerState.isPaused) {
      return;
    }

    this.timerState.isPaused = false;
    this.timerState.pausedTime = null;
    await this.broadcastTimerState();
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
   * 清理资源
   */
  cleanup() {
    this.isDestroyed = true;
    this.clearExistingTimer();
    this.timerState.isActive = false;
  }

  /**
   * 停止当前定时器
   */
  async stopTimer() {
    this.clearExistingTimer();
    this.timerState.isActive = false;

    await this.broadcastMessage({
      action: "timerStopped",
    });
  }

  /**
   * 定时器完成处理
   */
  async onTimerComplete() {
    if (this.isDestroyed) {
      return;
    }

    const totalMinutes = this.timerState.totalMinutes;
    this.clearExistingTimer();
    this.timerState.isActive = false;

    try {
      await this.sendToActiveTab({
        action: "timerComplete",
        totalMinutes: totalMinutes,
      });

      await this.broadcastMessage({
        action: "timerStopped",
      });
    } catch (error) {
      console.error("Error in timer completion:", error);
    }
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
      action: "timerUpdate",
      timerState: { ...this.timerState },
    };

    await this.broadcastMessage(message);
  }

  /**
   * 向当前激活的标签页发送消息
   * @param {Object} message - 要发送的消息
   * @param {number} retries - 重试次数
   */
  async sendToActiveTab(message, retries = 2) {
    if (this.isDestroyed) {
      return;
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const [activeTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (activeTab && activeTab.id) {
          try {
            await chrome.tabs.sendMessage(activeTab.id, message);
            return; // 成功发送，退出重试循环
          } catch (error) {
            if (attempt === retries) {
              console.warn(
                "Failed to send message to active tab after retries:",
                error.message
              );
            }
          }
        }
      } catch (error) {
        if (attempt === retries) {
          console.error("Failed to query active tab:", error.message);
        }
      }

      // 如果不是最后一次尝试，等待一段时间后重试
      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 100 * (attempt + 1))
        );
      }
    }
  }

  /**
   * 向所有标签页广播消息
   * @param {Object} message - 要广播的消息
   */
  async broadcastMessage(message) {
    if (this.isDestroyed) return;

    try {
      const tabs = await chrome.tabs.query({});
      // 确定广播页面和排除广播页面
      const validTabs = tabs.filter(
        (tab) =>
          tab.id &&
          tab.url &&
          !tab.url.startsWith("chrome://") &&
          !tab.url.startsWith("chrome-extension://") &&
          !tab.url.startsWith("moz-extension://")
      );

      // 使用Promise.allSettled来并行发送消息，避免单个失败影响其他
      const results = await Promise.allSettled(
        validTabs.map((tab) =>
          chrome.tabs.sendMessage(tab.id, message).catch((error) => {
            // 记录但不抛出错误
            console.debug(`未能将消息发送到选项卡 ${tab.id}:`, error.message);
          })
        )
      );

      // 统计成功和失败的数量（仅在开发模式下）
      try {
        const successful = results.filter(
          (result) => result.status === "fulfilled"
        ).length;
        const failed = results.filter(
          (result) => result.status === "rejected"
        ).length;
        console.debug(
          `Broadcast message: ${successful} successful, ${failed} failed`
        );
      } catch (debugError) {
        // 忽略调试信息错误
      }
    } catch (error) {
      console.error("Failed to broadcast message:", error.message);
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
   * 处理暂停计时器消息
   * @param {Object} request - 消息请求对象
   */
  static async handlePauseTimer(request) {
    try {
      await globalTimer.pauseTimer();
      return { success: true };
    } catch (error) {
      console.error("Failed to pause timer:", error);
      throw error;
    }
  }

  /**
   * 处理继续计时器消息
   * @param {Object} request - 消息请求对象
   */
  static async handleResumeTimer(request) {
    try {
      await globalTimer.resumeTimer();
      return { success: true };
    } catch (error) {
      console.error("Failed to resume timer:", error);
      throw error;
    }
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
   * 处理显示通知消息
   * @param {Object} request - 消息请求对象
   * @param {string} request.title - 通知标题
   * @param {string} request.message - 通知内容
   */
  static async handleShowNotification(request) {
    if (typeof chrome !== "undefined" && chrome.notifications) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "logo.png",
        title: request.title,
        message: request.message,
      });
    }
  }

  /**
   * 处理页面美化消息
   * @param {Object} request - 消息请求对象
   */
  static async handlePageBeautify(request) {
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab) {
        // 转发消息到内容脚本
        const response = await chrome.tabs
          .sendMessage(tab.id, {
            action: "pageBeautify",
            type: request.type,
            data: request.data,
            // 为了兼容可能存在的旧格式，保留直接属性
            ...(request.theme && { theme: request.theme }),
          })
          .catch((error) => {
            // 连接失败通常是因为页面刷新或切换导致的，属于正常情况
            // 在开发环境下输出调试信息
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest().name.includes('开发')) {
              console.warn('Content script通信: 页面切换导致的连接失败', error.message);
            }
            throw error;
          });
        return response;
      } else {
        // 静默处理：未找到活动标签页通常是因为用户切换了页面或关闭了标签页
        const error = new Error("未找到活动标签页");
        // 在开发环境下输出调试信息
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest().name.includes('开发')) {
          console.warn('页面美化消息处理: 页面切换导致的连接失败', error.message);
        }
        throw error;
      }
    } catch (error) {
      // 这些错误通常是正常的页面切换导致的通信失败，不需要在扩展页面显示
      // 在开发环境下输出调试信息
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest().name.includes('开发')) {
        console.warn('页面美化消息处理: 页面切换导致的连接失败', error.message);
      }
      throw error;
    }
  }

  // 主题相关方法已移除，功能已迁移到新的可视化CSS编辑器

  /**
   * 处理未知消息类型
   * @param {Object} request - 消息请求对象
   */
  static handleUnknownAction(request) {
    // 静默处理未知消息类型
  }

  /**
   * 处理页面切换相关的错误
   * @param {string} context - 错误上下文
   * @param {Error} error - 错误对象
   */
  static handlePageSwitchError(context, error) {
    const isConnectionError = error.message.includes('Could not establish connection') ||
                             error.message.includes('未找到活动标签页') ||
                             error.message.includes('Receiving end does not exist');
    
    if (isConnectionError) {
      // 仅在开发环境显示这些正常的连接错误
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
        console.warn(`[SoftError] ${context}: 页面切换导致的连接失败`, error.message);
      }
    } else {
      console.error(`[Error] ${context}: 未知错误`, error);
    }
  }
}

/**
 * 根据消息类型分发到对应的处理器
 */
const messageRouter = {
  startTimer: MessageHandler.handleStartTimer,
  stopTimer: MessageHandler.handleStopTimer,
  pauseTimer: MessageHandler.handlePauseTimer,
  resumeTimer: MessageHandler.handleResumeTimer,
  getTimerState: MessageHandler.handleGetTimerState,
  showNotification: MessageHandler.handleShowNotification,
  pageBeautify: MessageHandler.handlePageBeautify,
};

/**
 * 监听来自popup和content script的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 验证消息格式
  if (!request || typeof request !== "object" || !request.action) {
    console.warn("Invalid message format received:", request);
    return false;
  }
  const handler = messageRouter[request.action];

  if (handler) {
    try {
      if (request.action === "getTimerState") {
        handler(sendResponse);
        return true;
      } else if (request.action === "pageBeautify") {
        // 异步处理页面美化消息并返回响应
        handler(request)
          .then((response) => sendResponse(response))
          .catch((error) => {
            console.error(`Error handling ${request.action}:`, error.message);
            sendResponse({ success: false, error: error.message });
          });
        return true; // 保持消息通道开放
      } else {
        // 异步处理其他消息
        handler(request).catch((error) => {
          console.error(`Error handling ${request.action}:`, error.message);
          // 可以选择发送错误响应给发送方
          if (sendResponse) {
            sendResponse({ error: error.message });
          }
        });
      }
    } catch (error) {
      console.error(
        `Synchronous error handling ${request.action}:`,
        error.message
      );
      if (sendResponse) {
        sendResponse({ error: error.message });
      }
    }
  } else {
    MessageHandler.handleUnknownAction(request);
  }

  return true;
});

/**
 * 监听标签页更新事件（URL变化、页面加载等）
 * 当页面URL改变或页面重新加载时，通知content script更新插件状态
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // 只在页面完全加载完成时处理
  if (changeInfo.status === "complete" && tab.url) {
    // 排除chrome内部页面和扩展页面
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("moz-extension://")
    ) {
      return;
    }

    try {
      // 向该标签页发送URL变化通知
      await chrome.tabs.sendMessage(tabId, {
        action: "urlChanged",
        url: tab.url,
        tabId: tabId,
      });
    } catch (error) {
      // 忽略无法发送消息的错误（可能是页面还未准备好接收消息）
      console.debug(
        `[Background] 无法向标签页 ${tabId} 发送URL变化通知:`,
        error.message
      );
    }
  }
});

/**
 * 监听标签页激活事件（用户切换标签页）
 * 当用户切换到不同标签页时，通知新激活的标签页更新插件状态
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // 获取激活标签页的详细信息
    const tab = await chrome.tabs.get(activeInfo.tabId);

    // 排除chrome内部页面和扩展页面
    if (
      tab.url &&
      !tab.url.startsWith("chrome://") &&
      !tab.url.startsWith("chrome-extension://") &&
      !tab.url.startsWith("moz-extension://")
    ) {
      // 向激活的标签页发送激活通知
      await chrome.tabs.sendMessage(activeInfo.tabId, {
        action: "tabActivated",
        url: tab.url,
        tabId: activeInfo.tabId,
      });
    }
  } catch (error) {
    // 忽略无法发送消息的错误
    console.debug(
      `[Background] 无法向激活标签页 ${activeInfo.tabId} 发送激活通知:`,
      error.message
    );
  }
});

/**
 * 扩展安装或启动时的初始化
 */
chrome.runtime.onInstalled.addListener((details) => {
  // 扩展安装或更新时的初始化逻辑
  // TODO 暂时没有需求使用
});

/**
 * 扩展启动时的处理
 */
chrome.runtime.onStartup.addListener(() => {
  // 扩展启动时的初始化逻辑
  // TODO 暂时没有需求使用
});
