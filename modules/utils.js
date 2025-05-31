/**
 * 工具函数模块
 * 提供通用的工具函数，如时间格式化、通知显示等
 */

/**
 * 格式化时间显示
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串 (MM:SS)
 */
export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * 显示系统通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 */
export function showNotification(title, message) {
  try {
    // 参数验证
    if (!title || typeof title !== 'string') {
      console.warn('通知显示: 标题参数无效');
      return;
    }
    
    if (!message || typeof message !== 'string') {
      console.warn('通知显示: 消息参数无效');
      return;
    }
    
    // 检查Chrome扩展环境
    if (typeof chrome === 'undefined') {
      console.warn('通知显示: Chrome API不可用');
      return;
    }
    
    if (!chrome.runtime) {
      console.warn('通知显示: Chrome运行时不可用');
      return;
    }
    
    // 检查扩展上下文是否有效
    if (chrome.runtime.id === undefined) {
      console.warn('通知显示: 扩展上下文无效');
      return;
    }
    
    chrome.runtime.sendMessage({
      action: 'showNotification',
      title: title,
      message: message
    }, (response) => {
      // 检查是否有错误
      if (chrome.runtime.lastError) {
        console.error('showNotification: Failed to send message:', chrome.runtime.lastError.message);
      }
    });
    
  } catch (error) {
    console.error('showNotification: Failed to show notification:', error);
  }
}

/**
 * 安全地移除DOM元素
 * @param {Element} element - 要移除的元素
 */
export function safeRemoveElement(element) {
  try {
    if (!element) {
      return;
    }
    
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  } catch (error) {
    console.error('safeRemoveElement: Failed to remove element:', error);
  }
}

/**
 * 创建样式元素
 * @param {string} css - CSS样式字符串
 * @param {string} id - 样式元素的ID
 * @returns {HTMLStyleElement|null} 创建的样式元素
 */
export function createStyleElement(css, id) {
  try {
    // 参数验证
    if (!css || typeof css !== 'string') {
      console.warn('样式元素创建: CSS参数无效');
      return null;
    }
    
    // 检查DOM环境
    if (typeof document === 'undefined') {
      console.warn('样式元素创建: 文档对象不可用');
      return null;
    }
    
    const style = document.createElement('style');
    style.textContent = css;
    
    if (id && typeof id === 'string') {
      style.id = id;
    }
    
    return style;
    
  } catch (error) {
    console.error('createStyleElement: Failed to create style element:', error);
    return null;
  }
}