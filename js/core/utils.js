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
  static async exportJSON(data, filename) {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // 检查是否支持文件系统访问API
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'JSON文件',
              accept: {
                'application/json': ['.json'],
              },
            }],
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          this.showToast('主题导出成功', 'success');
          return;
        } catch (error) {
          // 用户取消了文件选择或其他错误，回退到默认下载
          if (error.name === 'AbortError') {
            return; // 用户取消，不显示错误
          }
        }
      }
      
      // 回退到传统下载方式
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

    // 检查urlPatterns格式（可选字段）
    if (theme.urlPatterns !== undefined) {
      if (!Array.isArray(theme.urlPatterns)) {
        return false;
      }
      
      for (const urlPattern of theme.urlPatterns) {
        if (!this.validateUrlPattern(urlPattern)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 验证URL模式数据格式
   * @param {any} urlPattern - URL模式数据
   * @returns {boolean} 是否有效
   */
  static validateUrlPattern(urlPattern) {
    if (!urlPattern || typeof urlPattern !== 'object') {
      return false;
    }

    // 检查必需字段
    if (!urlPattern.pattern || typeof urlPattern.pattern !== 'string') {
      return false;
    }

    // 检查模式类型
    const validTypes = ['wildcard', 'regex', 'exact'];
    if (urlPattern.type && !validTypes.includes(urlPattern.type)) {
      return false;
    }

    // 检查enabled字段
    if (urlPattern.enabled !== undefined && typeof urlPattern.enabled !== 'boolean') {
      return false;
    }

    return true;
  }

  /**
   * 检查主题是否匹配当前URL
   * @param {Object} theme - 主题数据
   * @param {string} currentUrl - 当前页面URL
   * @returns {boolean} 是否匹配
   */
  static isThemeMatchUrl(theme, currentUrl) {
    if (!theme || !currentUrl) {
      return false;
    }

    // 如果没有urlPatterns或为空数组，则不匹配任何URL
    if (!theme.urlPatterns || !Array.isArray(theme.urlPatterns) || theme.urlPatterns.length === 0) {
      return false;
    }

    // 检查是否有任何启用的模式匹配当前URL
    return theme.urlPatterns.some(urlPattern => {
      if (!urlPattern.enabled) {
        return false;
      }

      return this.matchUrlPattern(currentUrl, urlPattern.pattern, urlPattern.type || 'wildcard');
    });
  }

  /**
   * 检查URL是否匹配指定模式
   * @param {string} url - 要检查的URL
   * @param {string} pattern - 匹配模式
   * @param {string} type - 模式类型
   * @returns {boolean} 是否匹配
   */
  static matchUrlPattern(url, pattern, type = 'wildcard') {
    if (!url || !pattern) {
      return false;
    }

    try {
      switch (type) {
        case 'exact':
          return url === pattern;
          
        case 'regex':
          const regex = new RegExp(pattern);
          return regex.test(url);
          
        case 'wildcard':
        default:
          return this.wildcardMatch(url, pattern);
      }
    } catch (error) {
      console.warn('URL匹配失败:', error);
      return false;
    }
  }

  /**
   * 通配符匹配
   * @param {string} url - 要检查的URL
   * @param {string} pattern - 通配符模式
   * @returns {boolean} 是否匹配
   */
  static wildcardMatch(url, pattern) {
    if (pattern === '*') {
      return true;
    }
    
    // 将通配符模式转换为正则表达式
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
      .replace(/\*/g, '.*') // * 转换为 .*
      .replace(/\?/g, '.'); // ? 转换为 .
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(url);
  }

  /**
   * 从URL中提取域名
   * @param {string} url - 完整的URL
   * @returns {string|null} 域名，如果解析失败返回null
   */
  static extractDomain(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      console.warn('URL解析失败:', error);
      return null;
    }
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

  /**
   * 显示确认对话框
   * @param {string} message - 确认消息
   * @param {Object} options - 配置选项
   * @param {string} options.title - 对话框标题
   * @param {string} options.confirmText - 确认按钮文本
   * @param {string} options.cancelText - 取消按钮文本
   * @param {string} options.type - 对话框类型 (warning, danger, info)
   * @returns {Promise<boolean>} 用户选择结果
   */
  static showConfirmDialog(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = '确认操作',
        confirmText = '确定',
        cancelText = '取消',
        type = 'warning'
      } = options;

      // 创建对话框HTML
      const dialogHTML = `
        <div class="confirm-dialog-overlay" id="confirmDialogOverlay">
          <div class="confirm-dialog">
            <div class="confirm-dialog-header">
              <div class="confirm-dialog-icon confirm-dialog-icon-${type}">
                ${this._getIconByType(type)}
              </div>
              <h3 class="confirm-dialog-title">${title}</h3>
            </div>
            <div class="confirm-dialog-body">
              <p class="confirm-dialog-message">${message}</p>
            </div>
            <div class="confirm-dialog-footer">
              <button class="btn btn-secondary confirm-dialog-cancel" id="confirmDialogCancel">
                ${cancelText}
              </button>
              <button class="btn btn-${this._getButtonTypeByDialogType(type)} confirm-dialog-confirm" id="confirmDialogConfirm">
                ${confirmText}
              </button>
            </div>
          </div>
        </div>
      `;

      // 移除现有的确认对话框（如果存在）
      const existingOverlay = document.getElementById('confirmDialogOverlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // 创建对话框元素
      const dialogElement = document.createElement('div');
      dialogElement.innerHTML = dialogHTML;
      const overlay = dialogElement.firstElementChild;

      // 添加到页面
      document.body.appendChild(overlay);

      // 添加样式（如果还没有添加）
      this._addConfirmDialogStyles();

      // 获取按钮元素
      const confirmBtn = overlay.querySelector('#confirmDialogConfirm');
      const cancelBtn = overlay.querySelector('#confirmDialogCancel');

      // 处理确认
      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };

      // 处理取消
      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      // 清理函数
      const cleanup = () => {
        if (overlay && overlay.parentNode) {
          overlay.classList.add('confirm-dialog-hiding');
          setTimeout(() => {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          }, 200);
        }
        document.removeEventListener('keydown', handleKeydown);
      };

      // 键盘事件处理
      const handleKeydown = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
        } else if (e.key === 'Enter') {
          handleConfirm();
        }
      };

      // 绑定事件
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleCancel();
        }
      });
      document.addEventListener('keydown', handleKeydown);

      // 显示动画
      setTimeout(() => {
        overlay.classList.add('confirm-dialog-show');
      }, 10);

      // 聚焦到取消按钮（更安全的默认选择）
      setTimeout(() => {
        cancelBtn.focus();
      }, 100);
    });
  }

  /**
   * 显示输入对话框
   * @param {string} message - 提示消息
   * @param {Object} options - 配置选项
   * @param {string} options.title - 对话框标题
   * @param {string} options.placeholder - 输入框占位符
   * @param {string} options.defaultValue - 默认值
   * @param {string} options.confirmText - 确认按钮文本
   * @param {string} options.cancelText - 取消按钮文本
   * @param {string} options.type - 对话框类型
   * @returns {Promise<string|null>} 用户输入的值或null
   */
  static showInputDialog(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = '输入信息',
        placeholder = '',
        defaultValue = '',
        confirmText = '确定',
        cancelText = '取消',
        type = 'info'
      } = options;

      // 创建对话框HTML
      const dialogHTML = `
        <div class="confirm-dialog-overlay" id="inputDialogOverlay">
          <div class="confirm-dialog">
            <div class="confirm-dialog-header">
              <div class="confirm-dialog-icon confirm-dialog-icon-${type}">
                ${this._getIconByType(type)}
              </div>
              <h3 class="confirm-dialog-title">${title}</h3>
            </div>
            <div class="confirm-dialog-body">
              <p class="confirm-dialog-message">${message}</p>
              <input type="text" class="input-dialog-input" id="inputDialogInput" placeholder="${placeholder}" value="${this.escapeHtml(defaultValue)}">
            </div>
            <div class="confirm-dialog-footer">
              <button class="btn btn-secondary input-dialog-cancel" id="inputDialogCancel">
                ${cancelText}
              </button>
              <button class="btn btn-primary input-dialog-confirm" id="inputDialogConfirm">
                ${confirmText}
              </button>
            </div>
          </div>
        </div>
      `;

      // 移除现有的确认对话框（如果存在）
      const existingOverlay = document.getElementById('confirmDialogOverlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // 创建对话框元素
      const dialogElement = document.createElement('div');
      dialogElement.innerHTML = dialogHTML;
      const overlay = dialogElement.firstElementChild;

      // 添加到页面
      document.body.appendChild(overlay);

      // 添加样式
      this._addConfirmDialogStyles();

      // 获取元素
      const confirmBtn = overlay.querySelector('#inputDialogConfirm');
      const cancelBtn = overlay.querySelector('#inputDialogCancel');
      const input = overlay.querySelector('#inputDialogInput');

      // 处理确认
      const handleConfirm = () => {
        const value = input.value.trim();
        cleanup();
        resolve(value || null);
      };

      // 处理取消
      const handleCancel = () => {
        cleanup();
        resolve(null);
      };

      // 清理函数
      const cleanup = () => {
        if (overlay && overlay.parentNode) {
          overlay.classList.add('confirm-dialog-hiding');
          setTimeout(() => {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          }, 200);
        }
        document.removeEventListener('keydown', handleKeydown);
      };

      // 键盘事件处理
      const handleKeydown = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
        } else if (e.key === 'Enter') {
          handleConfirm();
        }
      };

      // 绑定事件
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleCancel();
        }
      });
      document.addEventListener('keydown', handleKeydown);

      // 显示动画
      setTimeout(() => {
        overlay.classList.add('confirm-dialog-show');
      }, 10);

      // 聚焦到输入框
      setTimeout(() => {
        input.focus();
        input.select();
      }, 100);
    });
  }

  /**
   * 根据对话框类型获取图标
   * @private
   * @param {string} type - 对话框类型
   * @returns {string} SVG图标
   */
  static _getIconByType(type) {
    const icons = {
      warning: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `,
      danger: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 0 0 3.54 21H20.46A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `,
      info: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 16V12M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
    };
    return icons[type] || icons.info;
  }

  /**
   * 根据对话框类型获取按钮类型
   * @private
   * @param {string} type - 对话框类型
   * @returns {string} 按钮类型
   */
  static _getButtonTypeByDialogType(type) {
    const buttonTypes = {
      warning: 'warning',
      danger: 'danger',
      info: 'primary'
    };
    return buttonTypes[type] || 'primary';
  }

  /**
   * 添加确认对话框样式
   * @private
   */
  static _addConfirmDialogStyles() {
    // 检查是否已经添加过样式
    if (document.getElementById('confirm-dialog-styles')) {
      return;
    }

    const styles = `
      :root {
        --warning: 45 93% 47%; /* 黄色警告 */
      }
      
      .confirm-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .confirm-dialog-overlay.confirm-dialog-show {
        opacity: 1;
      }

      .confirm-dialog-overlay.confirm-dialog-hiding {
        opacity: 0;
      }

      .confirm-dialog {
        background: hsl(var(--background));
        border: 1px solid hsl(var(--border));
        border-radius: var(--radius);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        width: 90%;
        max-height: 90vh;
        overflow: hidden;
        transform: scale(0.95) translateY(-10px);
        transition: transform 0.2s ease;
      }

      .confirm-dialog-show .confirm-dialog {
        transform: scale(1) translateY(0);
      }

      .confirm-dialog-header {
        padding: 1.5rem 1.5rem 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .confirm-dialog-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .confirm-dialog-icon-warning {
        color: hsl(var(--warning));
        background: hsl(var(--warning) / 0.1);
      }

      .confirm-dialog-icon-danger {
        color: hsl(var(--destructive));
        background: hsl(var(--destructive) / 0.1);
      }

      .confirm-dialog-icon-info {
        color: hsl(var(--primary));
        background: hsl(var(--primary) / 0.1);
      }

      .confirm-dialog-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: hsl(var(--foreground));
      }

      .confirm-dialog-body {
        padding: 0 1.5rem 1.5rem;
      }

      .confirm-dialog-message {
        margin: 0;
        color: hsl(var(--muted-foreground));
        line-height: 1.5;
      }

      .input-dialog-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        margin-top: 1rem;
        border: 1px solid hsl(var(--border));
        border-radius: var(--radius);
        background: hsl(var(--background));
        color: hsl(var(--foreground));
        font-size: 0.875rem;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .input-dialog-input:focus {
        border-color: hsl(var(--primary));
        box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
      }

      .confirm-dialog-footer {
        padding: 1rem 1.5rem 1.5rem;
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }

      .confirm-dialog-footer .btn {
        min-width: 80px;
      }

      /* 响应式设计 */
      @media (max-width: 480px) {
        .confirm-dialog {
          width: 95%;
          margin: 1rem;
        }

        .confirm-dialog-header {
          padding: 1rem 1rem 0.75rem;
        }

        .confirm-dialog-body {
          padding: 0 1rem 1rem;
        }

        .confirm-dialog-footer {
          padding: 0.75rem 1rem 1rem;
          flex-direction: column-reverse;
        }

        .confirm-dialog-footer .btn {
          width: 100%;
        }
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'confirm-dialog-styles';
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
}