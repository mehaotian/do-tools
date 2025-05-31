/**
 * UI管理模块
 * 处理弹窗界面的显示、交互和状态管理
 */

import { showToast } from "./toast.js";
import { TimerHandler } from "./featureHandlers.js";

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
    this.settingsContainer = document.createElement("div");
    this.settingsContainer.className = "timer-settings-overlay";

    // 设置HTML结构
    this.settingsContainer.innerHTML = `
      <div class="timer-settings-modal">
        <div class="timer-settings-header">
          <h3>设置自律提醒时间</h3>
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
            <div class="input-mode-toggle">
              <button class="mode-btn active" data-mode="preset">快速选择</button>
              <button class="mode-btn" data-mode="custom">自定义时间</button>
            </div>
            
            <div class="preset-mode" id="preset-mode">
              <div class="preset-buttons">
                <button class="preset-btn" data-minutes="10">10分钟</button>
                <button class="preset-btn" data-minutes="25">25分钟</button>
                <button class="preset-btn" data-minutes="45">45分钟</button>
                <button class="preset-btn" data-minutes="60">1小时</button>
                <button class="preset-btn" data-minutes="120">2小时</button>
                <button class="preset-btn" data-minutes="300">5小时</button>
                <button class="preset-btn" data-minutes="720">12小时</button>
                <button class="preset-btn" data-minutes="1440">24小时</button>
              </div>
            </div>
            
            <div class="custom-mode" id="custom-mode" style="display: none;">
              <label>自定义倒计时时间：</label>
              <div class="time-inputs">
                <div class="time-input-item">
                  <input type="number" id="timer-hours" min="0" max="24" step="1" placeholder="0" />
                  <span class="time-unit">小时</span>
                </div>
                <div class="time-input-item">
                  <input type="number" id="timer-minutes" min="0" max="59" step="1" placeholder="0" />
                  <span class="time-unit">分钟</span>
                </div>
              </div>
              <div class="time-limit-hint">最大支持24小时倒计时</div>
            </div>
          </div>
          <div class="action-buttons" id="action-buttons" style="display: none;">
            <button class="start-timer-btn" type="button">开始自律</button>
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

      .input-mode-toggle {
        display: flex;
        margin-bottom: 16px;
        background: #f8fafc;
        border-radius: 8px;
        padding: 4px;
      }

      .mode-btn {
        flex: 1;
        padding: 8px 16px;
        border: none;
        background: transparent;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .mode-btn.active {
        background: white;
        color: #1e293b;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .mode-btn:hover:not(.active) {
        color: #475569;
      }

      .time-input-group label {
        display: block;
        margin-bottom: 12px;
        font-weight: 500;
        color: #333;
        font-size: 14px;
      }

      .time-inputs {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;
      }

      .time-input-item {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .time-input-item input {
        flex: 1;
        padding: 10px 12px;
        border: 2px solid #e1e5e9;
        border-radius: 6px;
        font-size: 16px;
        text-align: center;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
      }

      .time-input-item input:focus {
        outline: none;
        border-color: #007bff;
      }

      .time-unit {
        font-size: 14px;
        color: #64748b;
        font-weight: 500;
        min-width: 30px;
      }

      .time-limit-hint {
        font-size: 12px;
        color: #64748b;
        text-align: center;
        margin-top: 8px;
      }

      .preset-mode {
        margin-top: 8px;
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


    `;

    const styleElement = document.createElement("style");
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    if (!this.settingsContainer) return;

    // 关闭按钮
    const closeBtn = this.settingsContainer.querySelector(".close-btn");
    closeBtn?.addEventListener("click", () => this.hide());

    // 取消按钮
    const cancelBtn = this.settingsContainer.querySelector(".cancel-btn");
    cancelBtn?.addEventListener("click", () => this.hide());

    // 开始计时按钮
    const startBtn = this.settingsContainer.querySelector(".start-timer-btn");
    startBtn?.addEventListener("click", () => this.startTimer());

    // 停止计时器按钮
    const stopBtn = this.settingsContainer.querySelector(".stop-timer-btn");
    stopBtn?.addEventListener("click", () => this.stopTimer());

    // 模式切换按钮
    const modeBtns = this.settingsContainer.querySelectorAll(".mode-btn");
    modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-mode");
        this.switchInputMode(mode);
      });
    });

    // 预设时间按钮
    const presetBtns = this.settingsContainer.querySelectorAll(".preset-btn");
    presetBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const minutes = parseInt(btn.getAttribute("data-minutes"));

        // 直接启动计时器
        TimerHandler.handle(minutes);
        this.hide();
      });
    });

    // 点击遮罩层关闭
    this.settingsContainer.addEventListener("click", (e) => {
      if (e.target === this.settingsContainer) {
        this.hide();
      }
    });

    // ESC键关闭
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        this.hide();
        document.removeEventListener("keydown", handleKeydown);
      }
    };
    document.addEventListener("keydown", handleKeydown);

    // 输入框回车键
    const minutesInput = this.settingsContainer.querySelector("#timer-minutes");
    const hoursInput = this.settingsContainer.querySelector("#timer-hours");

    [minutesInput, hoursInput].forEach((input) => {
      input?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.startTimer();
        }
      });
    });

    // 输入框聚焦时选中所有文本
    [hoursInput, minutesInput].forEach((input) => {
      input?.addEventListener("focus", (e) => {
        e.target.select();
      });
    });

    // 输入框实时验证，防止小数和无效字符输入
    hoursInput?.addEventListener("input", function () {
      // 移除小数点和非数字字符
      this.value = this.value.replace(/[^0-9]/g, "");
      // 限制最大值
      if (parseInt(this.value) > 24) {
        this.value = "24";
      }
    });

    minutesInput?.addEventListener("input", function () {
      // 移除小数点和非数字字符
      this.value = this.value.replace(/[^0-9]/g, "");
      // 限制最大值
      if (parseInt(this.value) > 59) {
        this.value = "59";
      }
    });

    // 自动聚焦输入框
    setTimeout(() => minutesInput?.focus(), 100);
  }

  /**
   * 检查计时器状态
   */
  async checkTimerStatus() {
    try {
      const status = await this.getTimerStatus();
      this.updateStatusDisplay(status);
    } catch (error) {
      // 静默处理错误
    }
  }

  /**
   * 更新状态显示
   * @param {Object} status - 计时器状态
   */
  updateStatusDisplay(status) {
    const statusDiv = this.settingsContainer.querySelector("#timer-status");
    const inputGroup =
      this.settingsContainer.querySelector("#time-input-group");
    const presetButtons =
      this.settingsContainer.querySelector("#preset-buttons");
    const actionButtons =
      this.settingsContainer.querySelector("#action-buttons");
    const remainingTimeSpan =
      this.settingsContainer.querySelector("#remaining-time");

    if (status.isRunning) {
      // 显示运行状态
      statusDiv.style.display = "block";
      inputGroup.style.display = "none";
      presetButtons.style.display = "none";
      actionButtons.style.display = "none";

      if (remainingTimeSpan && status.remainingTime) {
        const minutes = Math.floor(status.remainingTime / 60);
        const seconds = status.remainingTime % 60;
        remainingTimeSpan.textContent = `${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`;
      }
    } else {
      // 显示设置状态
      statusDiv.style.display = "none";
      inputGroup.style.display = "block";
      presetButtons.style.display = "flex";
      actionButtons.style.display = "flex";
    }
  }

  /**
   * 切换输入模式
   */
  switchInputMode(mode) {
    const modeBtns = this.settingsContainer.querySelectorAll(".mode-btn");
    const presetMode = this.settingsContainer.querySelector("#preset-mode");
    const customMode = this.settingsContainer.querySelector("#custom-mode");
    const actionButtons =
      this.settingsContainer.querySelector("#action-buttons");

    // 更新按钮状态
    modeBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-mode") === mode);
    });

    // 切换显示模式
    if (mode === "preset") {
      presetMode.style.display = "block";
      customMode.style.display = "none";
      actionButtons.style.display = "none"; // 隐藏开始和取消按钮
    } else {
      presetMode.style.display = "none";
      customMode.style.display = "block";
      actionButtons.style.display = "flex"; // 显示开始和取消按钮
      // 聚焦到分钟输入框
      setTimeout(() => {
        const minutesInput =
          this.settingsContainer.querySelector("#timer-minutes");
        minutesInput?.focus();
      }, 100);
    }
  }

  /**
   * 验证时间输入
   */
  validateTimeInput(input, min, max) {
    let value = parseInt(input.value);

    // 如果输入为空，允许用户继续输入
    if (input.value === "") {
      return;
    }

    if (isNaN(value) || value < min) {
      input.value = min;
    } else if (value > max) {
      input.value = max;
    }

    // 检查总时间是否超过24小时
    this.validateTotalTime();
  }

  /**
   * 验证总时间不超过24小时
   */
  validateTotalTime() {
    const hoursInput = this.settingsContainer.querySelector("#timer-hours");
    const minutesInput = this.settingsContainer.querySelector("#timer-minutes");

    if (!hoursInput || !minutesInput) return;

    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes > 24 * 60) {
      // 如果超过24小时，重置为24小时
      hoursInput.value = 24;
      minutesInput.value = 0;
    }
  }

  /**
   * 启动计时器
   */
  startTimer() {
    const hoursInput = this.settingsContainer.querySelector("#timer-hours");
    const minutesInput = this.settingsContainer.querySelector("#timer-minutes");

    // 获取输入值
    const hoursValue = hoursInput.value.trim();
    const minutesValue = minutesInput.value.trim();

    // 检查是否为空
    if (hoursValue === "" && minutesValue === "") {
      showToast("请输入计时时间！", "warning");
      hoursInput.focus();
      return;
    }

    // 验证小时数
    if (hoursValue !== "") {
      const hoursNum = parseFloat(hoursValue);
      if (
        isNaN(hoursNum) ||
        hoursNum < 0 ||
        hoursNum > 24 ||
        !Number.isInteger(hoursNum)
      ) {
        showToast("小时数必须是0-24之间的整数！", "warning");
        hoursInput.focus();
        hoursInput.select();
        return;
      }
    }

    // 验证分钟数
    if (minutesValue !== "") {
      const minutesNum = parseFloat(minutesValue);
      if (
        isNaN(minutesNum) ||
        minutesNum < 0 ||
        minutesNum >= 60 ||
        !Number.isInteger(minutesNum)
      ) {
        showToast("分钟数必须是0-59之间的整数！", "warning");

        minutesInput.focus();
        minutesInput.select();
        return;
      }
    }

    // 处理空值情况
    const hours = hoursValue === "" ? 0 : parseInt(hoursValue);
    const minutes = minutesValue === "" ? 0 : parseInt(minutesValue);
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes < 1) {
      showToast("请设置至少1分钟的计时时间！", "warning");
      return;
    }

    if (totalMinutes > 24 * 60) {
      showToast("计时时间不能超过24小时！", "warning");
      return;
    }

    // 启动计时器
    TimerHandler.handle(totalMinutes);
    this.hide();
  }

  /**
   * 停止计时器
   */
  stopTimer() {
    TimerHandler.stop();
    this.hide();
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
    this.isInitialized = true;
  }

  /**
   * 绑定功能项事件
   */
  bindFeatureEvents() {
    const featureItems = document.querySelectorAll(".feature-item");

    featureItems.forEach((item) => {
      // 点击事件
      item.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleFeatureClick(item);
      });

      // 键盘事件
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.handleFeatureClick(item);
        }
      });

      // 确保可聚焦
      if (!item.hasAttribute("tabindex")) {
        item.setAttribute("tabindex", "0");
      }
    });
  }

  /**
   * 处理功能项点击
   * @param {HTMLElement} item - 被点击的功能项
   */
  handleFeatureClick(item) {
    const featureId = item.getAttribute("data-feature");

    if (!featureId) {
      return;
    }

    // 特殊处理自律提醒功能
    if (featureId === "reading-time") {
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
      const { featureHandlers } = await import("./featureHandlers.js");

      const handler = featureHandlers[featureId];
      if (typeof handler === "function") {
        await handler();
      }
    } catch (error) {
      // 静默处理错误
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
export { PopupUIManager, TimerSettingsManager, popupUIManager };

// 导出便捷函数
export const showTimerSettings = () => popupUIManager.showTimerSettings();

// DOM加载完成后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => popupUIManager.init());
} else {
  popupUIManager.init();
}
