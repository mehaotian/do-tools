/**
 * Toast 提示组件
 * 用于显示美观的页面内提示信息
 */

/**
 * 显示Toast提示
 * @param {string} message - 提示消息
 * @param {string} type - 提示类型: 'success', 'error', 'warning', 'info'
 * @param {number} duration - 显示时长(毫秒)，默认3000ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  try {
    // 参数验证
    if (!message || typeof message !== 'string') {
      console.warn('showToast: Invalid message parameter');
      return;
    }
    
    // 验证类型参数
    const validTypes = ['success', 'error', 'warning', 'info'];
    if (!validTypes.includes(type)) {
      console.warn(`showToast: Invalid type '${type}', using 'info' instead`);
      type = 'info';
    }
    
    // 验证持续时间参数
    if (typeof duration !== 'number' || duration < 0) {
      console.warn('showToast: Invalid duration, using default 3000ms');
      duration = 3000;
    }
    
    // 检查DOM环境
    if (typeof document === 'undefined') {
      console.warn('showToast: Document not available');
      return;
    }
    
    // 创建toast容器（如果不存在）
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container';
      
      if (document.body) {
        document.body.appendChild(toastContainer);
      } else {
        console.error('showToast: Document body not available');
        return;
      }
    }

    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // 添加图标
    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.innerHTML = getToastIcon(type);
    
    // 添加消息文本
    const messageEl = document.createElement('div');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    
    // 添加关闭按钮
    const closeBtn = document.createElement('div');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => removeToast(toast);
    
    toast.appendChild(icon);
    toast.appendChild(messageEl);
    toast.appendChild(closeBtn);
    
    // 添加到容器
    toastContainer.appendChild(toast);
    
    // 触发动画
    const showTimer = setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.classList.add('toast-show');
      }
    }, 10);
    
    // 自动移除
    const removeTimer = setTimeout(() => {
      removeToast(toast);
    }, duration);
    
    // 存储定时器引用以便清理
    toast._showTimer = showTimer;
    toast._removeTimer = removeTimer;
    
  } catch (error) {
    console.error('showToast: Failed to show toast:', error);
  }
}

/**
 * 移除Toast
 * @param {HTMLElement} toast - toast元素
 */
function removeToast(toast) {
  try {
    if (!toast) {
      return;
    }
    
    // 清理定时器
    if (toast._showTimer) {
      clearTimeout(toast._showTimer);
      toast._showTimer = null;
    }
    if (toast._removeTimer) {
      clearTimeout(toast._removeTimer);
      toast._removeTimer = null;
    }
    
    if (toast.parentNode) {
      toast.classList.add('toast-hide');
      
      const hideTimer = setTimeout(() => {
        try {
          if (toast && toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        } catch (error) {
          console.error('removeToast: Failed to remove toast element:', error);
        }
      }, 300);
      
      // 存储隐藏定时器引用
      toast._hideTimer = hideTimer;
    }
  } catch (error) {
    console.error('removeToast: Failed to remove toast:', error);
  }
}

/**
 * 获取Toast图标
 * @param {string} type - 提示类型
 * @returns {string} SVG图标
 */
function getToastIcon(type) {
  const icons = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 12l2 2 4-4"/>
      <circle cx="12" cy="12" r="10"/>
    </svg>`,
    error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`
  };
  return icons[type] || icons.info;
}