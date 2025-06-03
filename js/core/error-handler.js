/**
 * 错误处理工具类
 * 统一管理不同级别的错误日志输出，区分开发和生产环境
 */
class ErrorHandler {
  /**
   * 检查是否为开发环境
   * @returns {boolean}
   */
  static isDevelopment() {
    return process.env.NODE_ENV === 'development' || 
           typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest().version.includes('dev');
  }

  /**
   * 记录调试信息（仅在开发环境显示）
   * @param {string} message - 消息内容
   * @param {...any} args - 额外参数
   */
  static debug(message, ...args) {
    if (this.isDevelopment()) {
      console.log(`[Debug] ${message}`, ...args);
    }
  }

  /**
   * 记录信息日志（仅在开发环境显示）
   * @param {string} message - 消息内容
   * @param {...any} args - 额外参数
   */
  static info(message, ...args) {
    if (this.isDevelopment()) {
      console.info(`[Info] ${message}`, ...args);
    }
  }

  /**
   * 记录警告信息（仅在开发环境显示）
   * @param {string} message - 消息内容
   * @param {...any} args - 额外参数
   */
  static warn(message, ...args) {
    if (this.isDevelopment()) {
      console.warn(`[Warn] ${message}`, ...args);
    }
  }

  /**
   * 记录非致命错误（仅在开发环境显示）
   * 用于页面切换、连接失败等正常的错误情况
   * @param {string} message - 消息内容
   * @param {...any} args - 额外参数
   */
  static softError(message, ...args) {
    if (this.isDevelopment()) {
      console.warn(`[SoftError] ${message}`, ...args);
    }
  }

  /**
   * 记录致命错误（始终显示）
   * 用于真正需要用户关注的错误
   * @param {string} message - 消息内容
   * @param {...any} args - 额外参数
   */
  static error(message, ...args) {
    console.error(`[Error] ${message}`, ...args);
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
      this.softError(`${context}: 页面切换导致的连接失败`, error.message);
    } else {
      this.error(`${context}: 未知错误`, error);
    }
  }

  /**
   * 处理样式应用相关的错误
   * @param {string} context - 错误上下文
   * @param {Error} error - 错误对象
   */
  static handleStyleError(context, error) {
    const isNormalError = error.message.includes('没有记录的原始状态') ||
                         error.message.includes('选择器无效') ||
                         error.message.includes('元素不存在');
    
    if (isNormalError) {
      this.info(`${context}: ${error.message}`);
    } else {
      this.error(`${context}: 样式处理错误`, error);
    }
  }
}

// 导出错误处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
}

// ES6模块导出
export { ErrorHandler };