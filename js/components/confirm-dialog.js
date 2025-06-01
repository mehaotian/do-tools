/**
 * 自定义确认对话框组件
 * 用于替换系统的confirm弹窗，提供更好的用户体验
 */

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
export function showConfirmDialog(message, options = {}) {
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
              ${getIconByType(type)}
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
            <button class="btn btn-${getButtonTypeByDialogType(type)} confirm-dialog-confirm" id="confirmDialogConfirm">
              ${confirmText}
            </button>
          </div>
        </div>
      </div>
    `;

    // 创建对话框元素
    const dialogElement = document.createElement('div');
    dialogElement.innerHTML = dialogHTML;
    const overlay = dialogElement.firstElementChild;

    // 添加到页面
    document.body.appendChild(overlay);

    // 添加样式（如果还没有添加）
    addConfirmDialogStyles();

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
 * 根据对话框类型获取图标
 * @param {string} type - 对话框类型
 * @returns {string} SVG图标
 */
function getIconByType(type) {
  const icons = {
    warning: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    danger: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 9V13M12 17H12.01M4.93 4.93L19.07 19.07M19.07 4.93L4.93 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
 * @param {string} type - 对话框类型
 * @returns {string} 按钮类型
 */
function getButtonTypeByDialogType(type) {
  const buttonTypes = {
    warning: 'warning',
    danger: 'danger',
    info: 'primary'
  };
  return buttonTypes[type] || 'primary';
}

/**
 * 添加确认对话框样式
 */
function addConfirmDialogStyles() {
  // 检查是否已经添加过样式
  if (document.getElementById('confirm-dialog-styles')) {
    return;
  }

  const styles = `
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