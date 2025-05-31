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
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      action: 'showNotification',
      title: title,
      message: message
    });
  }
}

/**
 * 安全地移除DOM元素
 * @param {Element} element - 要移除的元素
 */
export function safeRemoveElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * 创建样式元素
 * @param {string} css - CSS样式字符串
 * @param {string} id - 样式元素的ID
 * @returns {HTMLStyleElement} 创建的样式元素
 */
export function createStyleElement(css, id) {
  const style = document.createElement('style');
  style.textContent = css;
  if (id) {
    style.id = id;
  }
  return style;
}