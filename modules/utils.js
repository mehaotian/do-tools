/**
 * 工具函数模块
 * 提供通用的工具函数
 */

/**
 * 格式化时间显示
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串 (MM:SS)
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * 显示通知消息
 * @param {string} message - 通知内容
 * @param {string} type - 通知类型 (info|success|error)
 */
export function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  const style = document.createElement("style");
  style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        }
        
        .notification-success {
            background-color: #10b981;
        }
        
        .notification-info {
            background-color: #3b82f6;
        }
        
        .notification-error {
            background-color: #ef4444;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;

  document.head.appendChild(style);
  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  }, 3000);
}

/**
 * 安全地移除DOM元素
 * @param {HTMLElement} element - 要移除的元素
 */
export function safeRemoveElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * 创建样式元素并添加到head
 * @param {string} cssText - CSS样式文本
 * @param {string} id - 样式元素的ID（可选）
 * @returns {HTMLStyleElement} 创建的样式元素
 */
export function createStyleElement(cssText, id = null) {
  const style = document.createElement("style");
  if (id) {
    style.id = id;
  }
  style.textContent = cssText;
  document.head.appendChild(style);
  return style;
}