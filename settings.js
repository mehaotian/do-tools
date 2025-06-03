/**
 * 设置页面管理器
 */
class SettingsManager {
  constructor() {
    this.defaultSettings = {
      notifications: false,
      autoSave: true,
      theme: "auto",
      defaultTimerDuration: 25,
      soundEnabled: true,
      desktopNotifications: true,
      bookmarkFolder: "default",
      autoClassify: false,
    };

    this.currentSettings = { ...this.defaultSettings };
    this.init();
  }

  /**
   * 初始化设置管理器
   */
  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.updateUI();
  }

  /**
   * 加载设置
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get("doToolsSettings");
      if (result.doToolsSettings) {
        this.currentSettings = {
          ...this.defaultSettings,
          ...result.doToolsSettings,
        };
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  /**
   * 保存设置
   */
  async saveSettings() {
    try {
      await chrome.storage.sync.set({ doToolsSettings: this.currentSettings });
      this.showToast("设置已保存", "success");
    } catch (error) {
      console.error("Failed to save settings:", error);
      this.showToast("保存失败", "error");
    }
  }

  /**
   * 重置设置
   */
  async resetSettings() {
    if (confirm("确定要重置所有设置吗？")) {
      this.currentSettings = { ...this.defaultSettings };
      await this.saveSettings();
      this.updateUI();
      this.showToast("设置已重置", "success");
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 切换开关事件
    this.bindToggleEvents();

    // 输入框事件
    this.bindInputEvents();

    // 选择框事件
    this.bindSelectEvents();

    // 按钮事件
    document.getElementById("saveSettings").addEventListener("click", () => {
      this.collectSettings();
      this.saveSettings();
    });

    document.getElementById("resetSettings").addEventListener("click", () => {
      this.resetSettings();
    });
  }

  /**
   * 绑定切换开关事件
   */
  bindToggleEvents() {
    const toggles = [
      { id: "notificationToggle", setting: "notifications" },
      { id: "autoSaveToggle", setting: "autoSave" },
      { id: "soundToggle", setting: "soundEnabled" },
      { id: "desktopNotificationToggle", setting: "desktopNotifications" },
      { id: "autoClassifyToggle", setting: "autoClassify" },
    ];

    toggles.forEach(({ id, setting }) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("click", () => {
          element.classList.toggle("active");
          this.currentSettings[setting] = element.classList.contains("active");
        });
      }
    });
  }

  /**
   * 绑定输入框事件
   */
  bindInputEvents() {
    const defaultDuration = document.getElementById("defaultDuration");
    if (defaultDuration) {
      defaultDuration.addEventListener("change", (e) => {
        const value = parseInt(e.target.value);
        if (value >= 1 && value <= 120) {
          this.currentSettings.defaultTimerDuration = value;
        } else {
          e.target.value = this.currentSettings.defaultTimerDuration;
          this.showToast("请输入1-120之间的数值", "warning");
        }
      });
    }
  }

  /**
   * 绑定选择框事件
   */
  bindSelectEvents() {
    const themeSelect = document.getElementById("themeSelect");
    if (themeSelect) {
      themeSelect.addEventListener("change", (e) => {
        this.currentSettings.theme = e.target.value;
        this.applyTheme(e.target.value);
      });
    }

    const bookmarkFolderSelect = document.getElementById(
      "bookmarkFolderSelect"
    );
    if (bookmarkFolderSelect) {
      bookmarkFolderSelect.addEventListener("change", (e) => {
        this.currentSettings.bookmarkFolder = e.target.value;
      });
    }
  }

  /**
   * 收集当前UI设置
   */
  collectSettings() {
    // 切换开关
    const toggles = [
      { id: "notificationToggle", setting: "notifications" },
      { id: "autoSaveToggle", setting: "autoSave" },
      { id: "soundToggle", setting: "soundEnabled" },
      { id: "desktopNotificationToggle", setting: "desktopNotifications" },
      { id: "autoClassifyToggle", setting: "autoClassify" },
    ];

    toggles.forEach(({ id, setting }) => {
      const element = document.getElementById(id);
      if (element) {
        this.currentSettings[setting] = element.classList.contains("active");
      }
    });

    // 输入框
    const defaultDuration = document.getElementById("defaultDuration");
    if (defaultDuration) {
      this.currentSettings.defaultTimerDuration = parseInt(
        defaultDuration.value
      );
    }

    // 选择框
    const themeSelect = document.getElementById("themeSelect");
    if (themeSelect) {
      this.currentSettings.theme = themeSelect.value;
    }

    const bookmarkFolderSelect = document.getElementById(
      "bookmarkFolderSelect"
    );
    if (bookmarkFolderSelect) {
      this.currentSettings.bookmarkFolder = bookmarkFolderSelect.value;
    }
  }

  /**
   * 更新UI显示
   */
  updateUI() {
    // 更新切换开关
    const toggles = [
      { id: "notificationToggle", setting: "notifications" },
      { id: "autoSaveToggle", setting: "autoSave" },
      { id: "soundToggle", setting: "soundEnabled" },
      { id: "desktopNotificationToggle", setting: "desktopNotifications" },
      { id: "autoClassifyToggle", setting: "autoClassify" },
    ];

    toggles.forEach(({ id, setting }) => {
      const element = document.getElementById(id);
      if (element) {
        if (this.currentSettings[setting]) {
          element.classList.add("active");
        } else {
          element.classList.remove("active");
        }
      }
    });

    // 更新输入框
    const defaultDuration = document.getElementById("defaultDuration");
    if (defaultDuration) {
      defaultDuration.value = this.currentSettings.defaultTimerDuration;
    }

    // 更新选择框
    const themeSelect = document.getElementById("themeSelect");
    if (themeSelect) {
      themeSelect.value = this.currentSettings.theme;
    }

    const bookmarkFolderSelect = document.getElementById(
      "bookmarkFolderSelect"
    );
    if (bookmarkFolderSelect) {
      bookmarkFolderSelect.value = this.currentSettings.bookmarkFolder;
    }
  }

  /**
   * 应用主题
   */
  applyTheme(theme) {
    // TODO: 实现主题切换逻辑
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = "info") {
    // 简单的临时提示实现
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${
              type === "success"
                ? "#4CAF50"
                : type === "error"
                ? "#f44336"
                : "#2196F3"
            };
            color: white;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
        `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  /**
   * 获取设置值
   */
  getSetting(key) {
    return this.currentSettings[key];
  }

  /**
   * 设置值
   */
  setSetting(key, value) {
    this.currentSettings[key] = value;
  }

  /**
   * 获取所有设置
   */
  getAllSettings() {
    return { ...this.currentSettings };
  }
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
  window.settingsManager = new SettingsManager();
});

// 导出设置管理器类
if (typeof module !== "undefined" && module.exports) {
  module.exports = SettingsManager;
}
