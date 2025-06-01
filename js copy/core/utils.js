/**
 * 通用工具函数模块
 * 提供ID生成、提示消息、验证、深拷贝等基础功能
 */

/**
 * 工具类 - 提供各种通用的辅助方法
 */
export class Utils {
  /**
   * 生成唯一ID
   * @returns {string} 唯一标识符
   */
  static generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  /**
   * 显示提示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型 (success, error, warning, info)
   * @param {number} duration - 显示时长(毫秒)
   */
  static showToast(message, type = 'info', duration = 3000) {
    // 移除已存在的toast
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
      existingToast.remove();
    }

    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;
    
    // 添加样式
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 24px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      fontSize: '14px',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateX(100%)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      maxWidth: '400px',
      wordWrap: 'break-word',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    });

    // 设置不同类型的背景色
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    toast.style.backgroundColor = colors[type] || colors.info;

    // 添加到页面
    document.body.appendChild(toast);

    // 显示动画
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    // 自动隐藏
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  /**
   * 转义HTML特殊字符
   * @param {string} text - 要转义的文本
   * @returns {string} 转义后的文本
   */
  static escapeHtml(text) {
    if (typeof text !== 'string') {
      return String(text || '');
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 验证CSS选择器格式
   * @param {string} selector - CSS选择器
   * @returns {boolean} 是否有效
   */
  static validateSelector(selector) {
    if (!selector || typeof selector !== 'string') {
      return false;
    }

    try {
      // 尝试使用querySelector验证选择器语法
      document.querySelector(selector);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 深拷贝对象
   * @param {any} obj - 要拷贝的对象
   * @returns {any} 拷贝后的对象
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }

    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }

    return obj;
  }

  /**
   * 导出JSON数据为文件
   * @param {any} data - 要导出的数据
   * @param {string} filename - 文件名
   */
  static exportJSON(data, filename) {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      this.showToast('主题导出成功', 'success');
    } catch (error) {
      console.error('导出失败:', error);
      this.showToast('导出失败: ' + error.message, 'error');
    }
  }

  /**
   * 导入JSON文件
   * @param {File} file - 文件对象
   * @returns {Promise<any>} 解析后的数据
   */
  static importJSON(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        // 创建文件输入元素
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          const selectedFile = e.target.files[0];
          if (selectedFile) {
            this.importJSON(selectedFile).then(resolve).catch(reject);
          } else {
            reject(new Error('未选择文件'));
          }
        };
        input.click();
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('文件格式错误: ' + error.message));
        }
      };
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * 防抖函数
   * @param {Function} func - 要防抖的函数
   * @param {number} delay - 延迟时间(毫秒)
   * @returns {Function} 防抖后的函数
   */
  static debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * 节流函数
   * @param {Function} func - 要节流的函数
   * @param {number} delay - 延迟时间(毫秒)
   * @returns {Function} 节流后的函数
   */
  static throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(this, args);
      }
    };
  }

  /**
   * 延迟执行
   * @param {number} ms - 延迟时间(毫秒)
   * @returns {Promise<void>} Promise对象
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 验证主题数据格式
   * @param {any} theme - 主题数据
   * @returns {boolean} 是否有效
   */
  static validateTheme(theme) {
    if (!theme || typeof theme !== 'object') {
      return false;
    }

    // 检查必需字段
    const requiredFields = ['id', 'name', 'groups'];
    for (const field of requiredFields) {
      if (!(field in theme)) {
        return false;
      }
    }

    // 检查groups格式
    if (!Array.isArray(theme.groups)) {
      return false;
    }

    // 检查每个group的格式
    for (const group of theme.groups) {
      if (!group || typeof group !== 'object') {
        return false;
      }
      if (!group.id || !group.name || !Array.isArray(group.rules)) {
        return false;
      }

      // 检查每个rule的格式
      for (const rule of group.rules) {
        if (!rule || typeof rule !== 'object') {
          return false;
        }
        if (!rule.selector || !rule.properties || typeof rule.properties !== 'object') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 安全地执行异步操作
   * @param {Function} asyncFn - 异步函数
   * @param {string} errorMessage - 错误提示消息
   * @returns {Promise<any>} 执行结果
   */
  static async safeAsync(asyncFn, errorMessage = '操作失败') {
    try {
      return await asyncFn();
    } catch (error) {
      console.error(errorMessage + ':', error);
      this.showToast(errorMessage + ': ' + error.message, 'error');
      throw error;
    }
  }
}