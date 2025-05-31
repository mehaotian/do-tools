/**
 * UI管理模块
 * 处理弹窗界面的显示、交互和状态管理
 */

import { showToast } from "./toast.js";
import { TimerHandler } from "./featureHandlers.js";

/**
 * 弹窗UI管理器 ==> index.html 直接操作
 */
class PopupUIManager {
  constructor() {
    this.timerSettings = new TimerSettingsManager(); // 时间设置管理器
    this.isInitialized = false; // 是否已经初始化
    this.isDestroyed = false; // 是否已经销毁
    this.eventListeners = new Map(); // 事件监听器
  }

  /**
   * 初始化弹窗UI
   */
  init() {
    // 确保只初始化一次
    if (this.isInitialized || this.isDestroyed) return;

    try {
      // 注册事件监听器
      this.bindFeatureEvents();
      // 初始化完成，状态设置为已初始化
      this.isInitialized = true;
    } catch (error) {
      console.error("弹窗UI初始化失败:", error);
    }
  }

  /**
   * 添加事件监听器并跟踪
   */
  addEventListenerTracked(element, event, handler) {
    if (!element || this.isDestroyed) return;

    element.addEventListener(event, handler);

    // 检查是否已经添加过监听器，如果没有则创建一个空数组
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    // 将事件监听器添加到列表
    this.eventListeners.get(element).push({ event, handler });
  }

  /**
   * 绑定功能项事件
   */
  bindFeatureEvents() {
    // 检测是否已经销毁
    if (this.isDestroyed) return;

    try {
      const featureItems = document.querySelectorAll(".feature-item");

      featureItems.forEach((item) => {
        // 点击事件回调
        const clickHandler = (e) => {
          e.preventDefault();
          this.handleFeatureClick(item);
        };
        // 注册点击事件并追踪事件
        this.addEventListenerTracked(item, "click", clickHandler);

        // 键盘事件回调
        const keydownHandler = (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.handleFeatureClick(item);
          }
        };
        // 注册键盘事件并追踪事件
        this.addEventListenerTracked(item, "keydown", keydownHandler);

        // 确保可聚焦
        if (!item.hasAttribute("tabindex")) {
          item.setAttribute("tabindex", "0");
        }
      });
    } catch (error) {
      console.error("绑定事件失败:", error);
    }
  }

  /**
   * 处理功能项点击
   * @param {HTMLElement} item - 被点击的功能项
   */
  handleFeatureClick(item) {
    if (this.isDestroyed || !item) return;

    try {
      // 获取弹窗可点击列表句柄
      const featureId = item.getAttribute("data-feature");

      if (!featureId) {
        console.warn("获取功能项ID失败");
        return;
      }

      // 因为时间提醒需要当前页面弹窗，单独处理
      if (featureId === "reading-time") {
        this.timerSettings.show();
        return;
      }

      // 处理其他功能
      this.executeFeature(featureId);
    } catch (error) {
      console.error("Failed to handle feature click:", error);
    }
  }

  /**
   * 执行功能
   * @param {string} featureId - 功能ID
   */
  async executeFeature(featureId) {
    if (this.isDestroyed) return;

    try {
      // 动态导入功能处理器
      const { featureHandlers } = await import("./featureHandlers.js");

      const handler = featureHandlers[featureId];
      if (typeof handler === "function") {
        await handler();
      } else {
        console.warn(`找不到功能的处理程序: ${featureId}`);
      }
    } catch (error) {
      console.error(`无法执行功能 ${featureId}:`, error);
    }
  }

  /**
   * 显示计时器设置
   */
  showTimerSettings() {
    if (this.isDestroyed) return;

    try {
      this.timerSettings.show();
    } catch (error) {
      console.error("Failed to show timer settings:", error);
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.isDestroyed) return;

    // 清理事件监听器
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler }) => {
        try {
          element.removeEventListener(event, handler);
        } catch (error) {
          // 静默处理移除事件监听器的错误
        }
      });
    });
    this.eventListeners.clear();

    // 清理计时器设置管理器
    if (this.timerSettings) {
      this.timerSettings.destroy();
    }
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.isDestroyed = true;
    this.cleanup();
    this.isInitialized = false;
  }
}

/**
 * 时间设置界面管理器
 */
class TimerSettingsManager {
  constructor() {
    this.isVisible = false; // 时间设置界面是否可见
    this.settingsContainer = null; // 时间设置容器
    this.isDestroyed = false; // 时间设置管理器是否已经销毁
    this.eventListeners = new Map(); // 事件监听器
    this.statusCheckInterval = null; // 状态检查间隔
    this.keydownHandler = null; // 键盘事件处理函数
  }

  /**
   * 显示时间设置界面
   */
  async show() {
    if (this.isVisible || this.isDestroyed) return;

    try {
      // 创建设置界面UI
      this.createSettingsUI();
      // 绑定事件
      this.bindEvents();
      // 检查计时器状态
      await this.checkTimerStatus();
      // 设置可见状态
      this.isVisible = true;
    } catch (error) {
      console.error("Failed to show timer settings:", error);
      // 如果启动时间控件失败，则清理资源
      this.cleanup();
    }
  }

  /**
   * 隐藏时间设置界面
   */
  hide() {
    if (!this.isVisible || !this.settingsContainer || this.isDestroyed) return;

    try {
      // 关闭后清理资源，清理时间控制器容器，防止内存泄露
      this.cleanup();
      this.settingsContainer.remove();
      this.settingsContainer = null;
      this.isVisible = false;
    } catch (error) {
      console.error("计时器关闭设置失败:", error);
    }
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

    // 因为是执行在 popup.js 中，所以需要使用 document.createElement 来创建元素
    // 样式无法直接使用外部样式类，所需要要手动添加样式
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
    // 创建样式元素并添加到页面
    const styleElement = document.createElement("style"); 
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  /**
   * 添加事件监听器并跟踪
   */
  addEventListenerTracked(element, event, handler) {
    if (!element || this.isDestroyed) return;

    element.addEventListener(event, handler);

    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    this.eventListeners.get(element).push({ event, handler });
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    if (!this.settingsContainer || this.isDestroyed) return;

    try {
      // 关闭按钮
      const closeBtn = this.settingsContainer.querySelector(".close-btn");
      if (closeBtn) {
        this.addEventListenerTracked(closeBtn, "click", () => this.hide());
      }

      // 取消按钮
      const cancelBtn = this.settingsContainer.querySelector(".cancel-btn");
      if (cancelBtn) {
        this.addEventListenerTracked(cancelBtn, "click", () => this.hide());
      }

      // 开始计时按钮
      const startBtn = this.settingsContainer.querySelector(".start-timer-btn");
      if (startBtn) {
        this.addEventListenerTracked(startBtn, "click", () =>
          this.startTimer()
        );
      }

      // 停止计时器按钮
      const stopBtn = this.settingsContainer.querySelector(".stop-timer-btn");
      if (stopBtn) {
        this.addEventListenerTracked(stopBtn, "click", () => this.stopTimer());
      }

      // 模式切换按钮
      const modeBtns = this.settingsContainer.querySelectorAll(".mode-btn");
      modeBtns.forEach((btn) => {
        this.addEventListenerTracked(btn, "click", () => {
          const mode = btn.getAttribute("data-mode");
          this.switchInputMode(mode);
        });
      });

      // 预设时间按钮
      const presetBtns = this.settingsContainer.querySelectorAll(".preset-btn");
      presetBtns.forEach((btn) => {
        this.addEventListenerTracked(btn, "click", () => {
          const minutes = parseInt(btn.getAttribute("data-minutes"));
          if (!isNaN(minutes) && minutes > 0) {
            try {
              TimerHandler.handle(minutes);
              this.hide();
            } catch (error) {
              console.error("计时开始失败:", error);
            }
          }
        });
      });

      // 点击遮罩层关闭
      this.addEventListenerTracked(this.settingsContainer, "click", (e) => {
        if (e.target === this.settingsContainer) {
          this.hide();
        }
      });

      // ESC键关闭
      this.keydownHandler = (e) => {
        if (e.key === "Escape" && this.isVisible) {
          this.hide();
        }
      };
      document.addEventListener("keydown", this.keydownHandler);

      // 输入框事件
      const minutesInput =
        this.settingsContainer.querySelector("#timer-minutes");
      const hoursInput = this.settingsContainer.querySelector("#timer-hours");

      [minutesInput, hoursInput].forEach((input) => {
        if (input) {
          this.addEventListenerTracked(input, "keydown", (e) => {
            // 设置回车键直接确定
            if (e.key === "Enter") {
              this.startTimer();
            }
          });
          // 获取焦点
          this.addEventListenerTracked(input, "focus", (e) => {
            e.target.select();
          });
        }
      });

      // 输入框实时验证
      if (hoursInput) {
        this.addEventListenerTracked(hoursInput, "input", function () {
          this.value = this.value.replace(/[^0-9]/g, "");
          if (parseInt(this.value) > 24) {
            this.value = "24";
          }
        });
      }

      if (minutesInput) {
        this.addEventListenerTracked(minutesInput, "input", function () {
          this.value = this.value.replace(/[^0-9]/g, "");
          if (parseInt(this.value) > 59) {
            this.value = "59";
          }
        });

        // 自动聚焦输入框
        setTimeout(() => {
          if (!this.isDestroyed && minutesInput) {
            minutesInput.focus();
          }
        }, 100);
      }
    } catch (error) {
      console.error("绑定事件失败:", error);
    }
  }

  /**
   * 获取定时器状态
   */
  async getTimerStatus() {
    return new Promise((resolve) => {
      try {
        // 发送消息到后台脚本获取定时器状态
        chrome.runtime.sendMessage({ action: "getTimerState" }, (response) => {
          // 处理 chorome.runtime.lastError 错误
          if (chrome.runtime.lastError) {
            console.warn(
              "Error getting timer state:",
              chrome.runtime.lastError.message
            );
            resolve(null);
            return;
          }

          if (response && response.timerState) {
            resolve({
              isRunning: response.timerState.isActive,
              remainingSeconds: response.timerState.remainingSeconds,
              originalMinutes: response.timerState.originalMinutes,
            });
          } else {
            resolve(null);
          }
        });
      } catch (error) {
        console.error("获取时间状态失败:", error);
        resolve(null);
      }
    });
  }

  /**
   * 检查计时器状态
   */
  async checkTimerStatus() {
    if (this.isDestroyed) return;

    try {
      const status = await this.getTimerStatus();
      if (!this.isDestroyed) {
        this.updateStatusDisplay(status);

        // 如果计时器正在运行，启动状态检查间隔
        if (status && status.isRunning && !this.statusCheckInterval) {
          this.statusCheckInterval = setInterval(() => {
            if (!this.isDestroyed) {
              this.checkTimerStatus();
            } else {
              this.clearStatusInterval();
            }
          }, 1000);
        } else if (!status || !status.isRunning) {
          this.clearStatusInterval();
        }
      }
    } catch (error) {
      console.error("检查定时器错误:", error);
    }
  }

  /**
   * 更新状态显示
   * @param {Object} status - 计时器状态
   */
  updateStatusDisplay(status) {
    if (!this.settingsContainer || this.isDestroyed || !status) {
      return;
    }

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
      if (statusDiv) statusDiv.style.display = "block";
      if (inputGroup) inputGroup.style.display = "none";
      if (presetButtons) presetButtons.style.display = "none";
      if (actionButtons) actionButtons.style.display = "none";

      if (remainingTimeSpan && status.remainingSeconds) {
        const minutes = Math.floor(status.remainingSeconds / 60);
        const seconds = status.remainingSeconds % 60;
        remainingTimeSpan.textContent = `${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`;
      }
    } else {
      // 显示设置状态
      if (statusDiv) statusDiv.style.display = "none";
      if (inputGroup) inputGroup.style.display = "block";
      if (presetButtons) presetButtons.style.display = "flex";
      if (actionButtons) actionButtons.style.display = "flex";
    }
  }

  /**
   * 切换输入模式
   */
  switchInputMode(mode) {
    if (!this.settingsContainer || this.isDestroyed) {
      return;
    }

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
      if (presetMode) presetMode.style.display = "block";
      if (customMode) customMode.style.display = "none";
      if (actionButtons) actionButtons.style.display = "none"; // 隐藏开始和取消按钮
    } else {
      if (presetMode) presetMode.style.display = "none";
      if (customMode) customMode.style.display = "block";
      if (actionButtons) actionButtons.style.display = "flex"; // 显示开始和取消按钮
      // 聚焦到分钟输入框
      setTimeout(() => {
        const minutesInput =
          this.settingsContainer?.querySelector("#timer-minutes");
        minutesInput?.focus();
      }, 100);
    }
  }

  /**
   * 启动计时器
   */
  startTimer() {
    if (this.isDestroyed || !this.settingsContainer) return;

    try {
      const hoursInput = this.settingsContainer.querySelector("#timer-hours");
      const minutesInput =
        this.settingsContainer.querySelector("#timer-minutes");

      if (!hoursInput || !minutesInput) {
        console.error("未找到计时器输入元素");
        return;
      }

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
    } catch (error) {
      console.error("启动计时器失败:", error);
      showToast("启动计时器失败，请重试！", "error");
    }
  }

  /**
   * 停止计时器
   */
  stopTimer() {
    if (this.isDestroyed) return;

    try {
      TimerHandler.stop();
      this.hide();
    } catch (error) {
      console.error("Failed to stop timer:", error);
      showToast("停止计时器失败，请重试！", "error");
    }
  }

  /**
   * 清理状态检查间隔
   */
  clearStatusInterval() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.isDestroyed) return;

    // 清理事件监听器
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler }) => {
        try {
          element.removeEventListener(event, handler);
        } catch (error) {
          // 静默处理移除事件监听器的错误
        }
      });
    });
    this.eventListeners.clear();

    // 清理全局键盘事件
    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }

    // 清理状态检查间隔
    this.clearStatusInterval();
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.isDestroyed = true;
    this.cleanup();

    if (this.settingsContainer) {
      try {
        this.settingsContainer.remove();
      } catch (error) {
        // 静默处理DOM移除错误
      }
      this.settingsContainer = null;
    }

    this.isVisible = false;
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
