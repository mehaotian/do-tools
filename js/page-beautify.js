/**
 * 页面美化功能管理器
 * 用于调整当前页面的样式和主题
 */

import { ChromeAPIManager } from "../modules/featureHandlers.js";
class PageBeautifyManager {
  constructor() {
    // 尝试获取目标页面的引用（父窗口或当前窗口）
    this.targetWindow = window.parent !== window ? window.parent : window;
    this.targetDocument = this.targetWindow.document;

    this.currentSettings = {
      // 导航栏毛玻璃效果设置
      navbar: {
        enabled: false,
        blur: 4,
        size: 4,
        transparent: 1,
        color: "#ffffff",
      },
      theme: "default",
      fontSize: 16,
      lineHeight: 1.5,
      fontFamily: "system",
      backgroundColor: "#ffffff",
      textColor: "#333333",
      linkColor: "#0066cc",
      pageWidth: 1200,
      centerContent: true,
      borderRadius: 8,
      enableShadow: true,
      enableAnimation: true,
      enableBlur: false,
    };

    this.targetSelectors = {
      body: "body",
      container: ".container, .main-content, #main, .content",
      text: "p, span, div, h1, h2, h3, h4, h5, h6",
      links: "a",
      cards: ".card, .feature-item, .item",
      navbar: ".d-header-wrap .d-header",
    };
    this.init();
  }

  /**
   * 初始化页面美化管理器
   */
  init() {
    this.bindEvents();
    this.checkNavbarElements();
  }

  /**
   * 检测目标页面中的导航栏元素
   */
  checkNavbarElements() {
    this.sendMessageToContentScript("CHECK_NAVBAR_ELEMENTS")
      .then((response) => {
        console.log("收到导航栏元素检测结果:", response);
        const hasNavbar = response && response.hasNavbar;
        this.updateNavbarStatus(hasNavbar);
        if (hasNavbar) {
          console.log(`找到导航栏元素`);
        } else {
          console.log("未找到导航栏元素");
        }
      })
      .catch((error) => {
        console.warn("无法检测导航栏元素:", error);
      });
  }

  /**
   * 更新导航栏状态指示器
   */
  updateNavbarStatus(hasNavbar) {
    const statusIndicator = document.querySelector(".navbar-status-indicator");
    if (statusIndicator) {
      statusIndicator.className = `navbar-status-indicator ${
        hasNavbar ? "available" : "unavailable"
      }`;
      statusIndicator.title = hasNavbar
        ? "检测到导航栏元素，可以应用效果"
        : "未检测到导航栏元素，无法应用效果";
    }

    // 禁用/启用导航栏相关控件
    const navbarToggle = document.getElementById("centerContentToggle");
    if (navbarToggle) {
      navbarToggle.style.opacity = hasNavbar ? "1" : "0.5";
      navbarToggle.style.pointerEvents = hasNavbar ? "auto" : "none";
    }
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    // 主题预设选择
    document.querySelectorAll(".theme-preset").forEach((preset) => {
      preset.addEventListener("click", (e) => {
        const theme = e.currentTarget.dataset.theme;
        // this.selectThemePreset(theme);
      });
    });

    // 导航栏毛玻璃效果开关
    const navbarToggle = document.getElementById("centerContentToggle");
    if (navbarToggle) {
      navbarToggle.addEventListener("click", () => {
        this.toggleNavbarGlassEffect();
      });
    }

    // 导航栏参数滑块
    const navbarParams = ["navbarBlur", "navbarSize", "navbarTransparent"];
    navbarParams.forEach((paramId) => {
      const slider = document.getElementById(paramId);
      if (slider) {
        slider.addEventListener("input", (e) => {
          const param = paramId.replace("navbar", "").toLowerCase();
          const value = parseFloat(e.target.value);
          this.updateNavbarGlassParam(param, value);
          this.updateRangeValue(paramId, value + "px");
        });
      }
    });

    // 导航栏颜色选择器
    const navbarColorPicker = document.getElementById("navbarColor");
    if (navbarColorPicker) {
      navbarColorPicker.addEventListener("input", (e) => {
        this.updateNavbarGlassParam("color", e.target.value);
      });
    }

    // 开关控件
    const toggles = [
      "centerContent",
      "enableShadow",
      "enableAnimation",
      "enableBlur",
    ];
    toggles.forEach((toggleType) => {
      const toggle = document.getElementById(toggleType + "Toggle");
      if (toggle) {
        toggle.addEventListener("click", () => {
          this.toggleSetting(toggleType);
        });
      }
    });
  }

  /**
   * 切换导航栏毛玻璃效果
   */
  toggleNavbarGlassEffect() {
    this.currentSettings.navbar.enabled = !this.currentSettings.navbar.enabled;

    this.sendMessageToContentScript("TOGGLE_NAVBAR_EFFECT", {
      enabled: this.currentSettings.navbar.enabled,
    }).catch((error) => {
      console.warn("切换导航栏效果失败:", error);
    });

    this.updateToggleState(
      "centerContentToggle",
      this.currentSettings.navbar.enabled
    );
    this.toggleNavbarSettings(this.currentSettings.navbar.enabled);
  }

  /**
   * 显示/隐藏导航栏参数设置
   */
  toggleNavbarSettings(show) {
    const settingIds = [
      "navbarBlurSettings",
      "navbarSizeSettings",
      "navbarTransparentSettings",
      "navbarColorSettings",
    ];
    settingIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = show ? "flex" : "none";
      }
    });
  }

  /**
   * 更新开关状态
   */
  updateToggleState(toggleId, isActive) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.classList.toggle("active", isActive);
    }
  }

  /**
   * 切换开关设置
   */
  toggleSetting(key) {
    this.currentSettings[key] = !this.currentSettings[key];
    this.updateToggleState(key + "Toggle", this.currentSettings[key]);
    this.applyCurrentSettings();
    // this.saveSettings();
  }

  /**
   * 应用当前设置
   */
  applyCurrentSettings() {
    this.applyNavbarGlassEffect();
  }

  /**
   * 应用导航栏毛玻璃效果
   */
  applyNavbarGlassEffect() {
    // 通过消息传递给内容脚本
    this.sendMessageToContentScript("APPLY_NAVBAR_EFFECT", {
      settings: this.currentSettings.navbar,
    })
      .then((response) => {
        if (response && response.success) {
          console.log("已应用导航栏毛玻璃效果到目标页面");
        } else {
          console.warn("应用导航栏效果失败");
        }
      })
      .catch((error) => {
        console.warn("无法与目标页面通信:", error);
      });
  }

  /**
   * 向内容脚本发送消息
   * @param {string} type - 消息类型
   * @param {Object} data - 消息数据
   * @returns {Promise} - 返回Promise处理响应
   */
  async sendMessageToContentScript(type, data = {}) {
    console.log("发送消息到内容脚本");
    try {
      const response = await ChromeAPIManager.sendMessage({
        action: "pageBeautify",
        type,
        data,
      });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || "消息发送失败");
      }
    } catch (error) {
      console.error("发送消息到内容脚本失败:", error);
      throw error;
    }
  }
}

// 当页面加载完成时初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.pageBeautifyManager = new PageBeautifyManager();
  });
} else {
  window.pageBeautifyManager = new PageBeautifyManager();
}
