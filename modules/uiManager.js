/**
 * UI管理模块
 * 处理弹窗界面的显示、交互和状态管理
 */

import { showNotification } from './utils.js';
import { TimerHandler } from './featureHandlers.js';
import { initPopupAnimations } from './animations.js';

/**
 * 时间设置界面管理器
 */
class TimerSettingsManager {
  constructor() {
    this.isVisible = false;
    this.settingsContainer = null;
  }

  /**
   * 显示时间设置界面
   */
  async show() {
    if (this.isVisible) return;

    this.createSettingsUI();
    this.bindEvents();
    await this.checkTimerStatus();
    this.isVisible = true;
  }

  /**
   * 隐藏时间设置界面
   */
  hide() {
    if (!this.isVisible || !this.settingsContainer) return;

    this.settingsContainer.remove();
    this.settingsContainer = null;
    this.isVisible = false;
  }

  /**
   * 创建设置界面UI
   */
  createSettingsUI() {
    // 创建容器
    this.settingsContainer = document.createElement('div');
    this.settingsContainer.className = 'timer-settings-overlay';
    
    // 设置HTML结构
    this.settingsContainer.innerHTML = `
      <div class="timer-settings-modal">
        <div class="timer-settings-header">
          <h3>设置深耕提醒时间</h3>
          <button class="close-btn" type="button">&times;</button>
        </div>
        <div class="timer-settings-content">
          <div class="timer-status" id="timer-status" style="display: none;">
            <div class="status-info">
              <span class="status-text">计时器正在运行中...</span>
              <span class="remaining-time" id="remaining-time"></span>
            </div>
            <button class="stop-timer-btn" type="button">停止计时器</button>
          </div>
          <div class="time-input-group" id="time-input-group">
            <label for="timer-minutes">设置时间（分钟）：</label>
            <input type="number" id="timer-minutes" min="1" max="120" value="25" />
          </div>
          <div class="preset-buttons" id="preset-buttons">
            <button class="preset-btn" data-minutes="10">10分钟</button>
            <button class="preset-btn" data-minutes="25">25分钟</button>
            <button class="preset-btn" data-minutes="45">45分钟</button>
            <button class="preset-btn" data-minutes="60">60分钟</button>
          </div>
          <div class="action-buttons" id="action-buttons">
            <button class="start-timer-btn" type="button">开始深耕</button>
            <button class="cancel-btn" type="button">取消</button>
          </div>
        </div>
      </div>
    `;

    // 添加样式
    this.addStyles();
    
    // 添加到页面
    document.body.appendChild(this.settingsContainer);
  }

  /**
   * 添加样式
   */
  addStyles() {
    const styles = `
      .timer-settings-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      }

      .timer-settings-modal {
        background: white;
        border-radius: 12px;
        padding: 0;
        min-width: 320px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
      }

      .timer-settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px 16px;
        border-bottom: 1px solid #eee;
      }

      .timer-settings-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: #999;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s ease;
      }

      .close-btn:hover {
        background: #f5f5f5;
        color: #666;
      }

      .timer-settings-content {
        padding: 24px;
      }

      .time-input-group {
        margin-bottom: 24px;
      }

      .time-input-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
      }

      .time-input-group input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e1e5e9;
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
      }

      .time-input-group input:focus {
        outline: none;
        border-color: #007bff;
      }

      .timer-status {
        background: #f0f9ff;
        border: 1px solid #0ea5e9;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
      }

      .status-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .status-text {
        font-weight: 500;
        color: #0369a1;
      }

      .remaining-time {
        font-weight: 600;
        color: #0c4a6e;
        font-size: 16px;
      }

      .stop-timer-btn {
        width: 100%;
        padding: 10px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .stop-timer-btn:hover {
        background: #dc2626;
      }

      .preset-buttons {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .preset-btn {
        flex: 1;
        min-width: 70px;
        padding: 8px 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 13px;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .preset-btn:hover {
        background: #e2e8f0;
        border-color: #cbd5e1;
      }

      .action-buttons {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .start-timer-btn, .cancel-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .start-timer-btn {
        background: #6366f1;
        color: white;
      }

      .start-timer-btn:hover {
        background: #5855eb;
      }

      .cancel-btn {
        background: #f3f4f6;
        color: #374151;
      }

      .cancel-btn:hover {
        background: #e5e7eb;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    if (!this.settingsContainer) return;

    // 关闭按钮
    const closeBtn = this.settingsContainer.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    // 取消按钮
    const cancelBtn = this.settingsContainer.querySelector('.cancel-btn');
    cancelBtn?.addEventListener('click', () => this.hide());

    // 开始计时按钮
    const startBtn = this.settingsContainer.querySelector('.start-timer-btn');
    startBtn?.addEventListener('click', () => this.startTimer());

    // 停止计时器按钮
    const stopBtn = this.settingsContainer.querySelector('.stop-timer-btn');
    stopBtn?.addEventListener('click', () => this.stopTimer());

    // 预设时间按钮
    const presetBtns = this.settingsContainer.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const minutes = parseInt(btn.getAttribute('data-minutes'));
        const input = this.settingsContainer.querySelector('#timer-minutes');
        if (input) {
          input.value = minutes;
        }
      });
    });

    // 点击遮罩层关闭
    this.settingsContainer.addEventListener('click', (e) => {
      if (e.target === this.settingsContainer) {
        this.hide();
      }
    });

    // ESC键关闭
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        this.hide();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // 输入框回车键
    const input = this.settingsContainer.querySelector('#timer-minutes');
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleStartTimer();
      }
    });

    // 自动聚焦输入框
    setTimeout(() => input?.focus(), 100);
  }

  /**
   * 检查计时器状态
   */
  async checkTimerStatus() {
    try {
      const status = await TimerHandler.getStatus();
      this.updateStatusDisplay(status);
    } catch (error) {
      console.error('获取计时器状态失败:', error);
    }
  }

  /**
   * 更新状态显示
   * @param {Object} status - 计时器状态
   */
  updateStatusDisplay(status) {
    const statusDiv = this.settingsContainer.querySelector('#timer-status');
    const inputGroup = this.settingsContainer.querySelector('#time-input-group');
    const presetButtons = this.settingsContainer.querySelector('#preset-buttons');
    const actionButtons = this.settingsContainer.querySelector('#action-buttons');
    const remainingTimeSpan = this.settingsContainer.querySelector('#remaining-time');

    if (status.isRunning) {
      // 显示运行状态
      statusDiv.style.display = 'block';
      inputGroup.style.display = 'none';
      presetButtons.style.display = 'none';
      actionButtons.style.display = 'none';
      
      if (remainingTimeSpan && status.remainingTime) {
        const minutes = Math.floor(status.remainingTime / 60);
        const seconds = status.remainingTime % 60;
        remainingTimeSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    } else {
      // 显示设置状态
      statusDiv.style.display = 'none';
      inputGroup.style.display = 'block';
      presetButtons.style.display = 'flex';
      actionButtons.style.display = 'flex';
    }
  }

  /**
   * 启动计时器
   */
  startTimer() {
    const input = this.settingsContainer.querySelector('#timer-minutes');
    if (!input) return;

    const minutes = parseInt(input.value);
    if (isNaN(minutes) || minutes <= 0) {
      showNotification('请输入有效的时间', 'error');
      return;
    }

    // 启动计时器
    TimerHandler.handle(minutes);
    
    // 关闭设置界面
    this.hide();
  }



  /**
   * 停止计时器
   */
  async stopTimer() {
    TimerHandler.stop();
    // 更新状态显示
    await this.checkTimerStatus();
  }
}

/**
 * 弹窗UI管理器
 */
class PopupUIManager {
  constructor() {
    this.timerSettings = new TimerSettingsManager();
    this.isInitialized = false;
  }

  /**
   * 初始化弹窗UI
   */
  init() {
    if (this.isInitialized) return;

    this.bindFeatureEvents();
    this.initAnimations();
    this.isInitialized = true;
  }

  /**
   * 绑定功能项事件
   */
  bindFeatureEvents() {
    const featureItems = document.querySelectorAll('.feature-item');
    
    featureItems.forEach(item => {
      // 点击事件
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleFeatureClick(item);
      });

      // 键盘事件
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleFeatureClick(item);
        }
      });

      // 确保可聚焦
      if (!item.hasAttribute('tabindex')) {
        item.setAttribute('tabindex', '0');
      }
    });
  }

  /**
   * 处理功能项点击
   * @param {HTMLElement} item - 被点击的功能项
   */
  handleFeatureClick(item) {
    const featureId = item.getAttribute('data-feature');
    
    if (!featureId) {
      console.warn('功能项缺少 data-feature 属性');
      return;
    }

    // 特殊处理深耕提醒功能
    if (featureId === 'reading-time') {
      this.timerSettings.show();
      return;
    }

    // 处理其他功能
    this.executeFeature(featureId);
  }

  /**
   * 执行功能
   * @param {string} featureId - 功能ID
   */
  async executeFeature(featureId) {
    try {
      // 动态导入功能处理器
      const { featureHandlers } = await import('./featureHandlers.js');
      
      const handler = featureHandlers[featureId];
      if (typeof handler === 'function') {
        await handler();
      } else {
        console.warn(`未找到功能处理器: ${featureId}`);
        showNotification('功能暂不可用', 'error');
      }
    } catch (error) {
      console.error(`执行功能失败 [${featureId}]:`, error);
      showNotification('功能执行失败', 'error');
    }
  }

  /**
   * 初始化动画
   */
  initAnimations() {
    try {
      initPopupAnimations();
    } catch (error) {
      console.warn('初始化动画失败:', error);
    }
  }

  /**
   * 显示计时器设置
   */
  showTimerSettings() {
    this.timerSettings.show();
  }
}

// 创建全局实例
const popupUIManager = new PopupUIManager();

// 导出管理器和函数
export {
  PopupUIManager,
  TimerSettingsManager,
  popupUIManager
};

// 导出便捷函数
export const showTimerSettings = () => popupUIManager.showTimerSettings();

// DOM加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => popupUIManager.init());
} else {
  popupUIManager.init();
}