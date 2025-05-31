/**
 * 页面美化内容脚本
 * 负责在目标网页中应用美化效果
 */

class PageBeautifyContent {
  constructor() {
    this.isDestroyed = false; // 标记是否已销毁
    this.settings = {
      navbar: {
        enabled: false,
        blur: 4,
        size: 20,
        transparent: 10,
        color: "rgba(255, 255, 255, 0.1)",
      },
    };

    this.targetSelectors = {
      navbar: ".d-header-wrap .d-header",
    };
    console.log("contentjs 页面美化内容脚本已初始化");
    this.init();
  }

  /**
   * 初始化
   */
  init() {}

  /**
   * 应用导航栏毛玻璃效果
   */
  applyNavbarGlassEffect() {
    try {
      const navbarElements = document.querySelectorAll(
        this.targetSelectors.navbar
      );
      console.log("导航栏元素:", navbarElements, this.settings.navbar.enabled);
      if (this.settings.navbar.enabled) {
        const { blur, size, transparent, color } = this.settings.navbar;

        const styles = {
          "background-image": `radial-gradient(transparent ${transparent}px, ${color} ${transparent}px)`,
          "background-size": `${size}px ${size}px`,
          "backdrop-filter": `saturate(50%) blur(${blur}px)`,
          'background-color': 'transparent',
          transition: "all 0.3s ease",
          position: "relative",
          "z-index": "1000",
        };

        navbarElements.forEach((element) => {
          Object.assign(element.style, styles);
          element.classList.add("page-beautify-navbar");
        });

        console.log("已应用导航栏毛玻璃效果");
      } else {
        // 移除毛玻璃效果
        navbarElements.forEach((element) => {
          element.style.removeProperty("background-image");
          element.style.removeProperty("background-size");
          element.style.removeProperty("backdrop-filter");
          element.style.removeProperty("transition");
          element.classList.remove("page-beautify-navbar");
        });

        console.log("已移除导航栏毛玻璃效果");
      }
    } catch (error) {
      console.warn("应用导航栏效果时出错:", error);
    }
  }

  /**
   * 检查导航栏元素是否存在
   */
  checkNavbarElements() {
    const navbarElements = document.querySelectorAll(
      this.targetSelectors.navbar
    );
    console.log("导航栏元素:", navbarElements);
    console.log("导航栏元素选择器:", this.targetSelectors.navbar);
    return navbarElements.length > 0;
  }

  /**
   * 处理消息
   */
  handleMessage(message, sender, sendResponse) {
    console.log("收到消息:", message);
  }
}

// 创建全局时间实例
let globalPageDisplay = null;

// 初始化函数
function initializeTimerDisplay() {
  if (!globalPageDisplay) {
    globalPageDisplay = new PageBeautifyContent();

    // 监听来自background的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!globalPageDisplay) {
        return;
      }

      switch (request.type) {
        case "CHECK_NAVBAR_ELEMENTS":
          const hasNavbar = globalPageDisplay.checkNavbarElements();
          sendResponse({ hasNavbar });
          break;
        case "TOGGLE_NAVBAR_EFFECT":
          globalPageDisplay.settings.navbar.enabled = request.enabled;
          globalPageDisplay.applyNavbarGlassEffect();
          sendResponse({ success: true });
          break;
        case "APPLY_NAVBAR_EFFECT":
            globalPageDisplay.settings.navbar = { ...globalPageDisplay.settings.navbar, ...request.settings };
            globalPageDisplay.applyNavbarGlassEffect();
            sendResponse({ success: true });
            break;
        default:
          break;
      }
      console.log("收到消息:", request, sender, sendResponse);
    });
  }
}

// 页面加载完成后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTimerDisplay);
} else {
  initializeTimerDisplay();
}

/**
 * 检查扩展上下文是否有效
 * @returns {boolean} 扩展上下文是否有效
 */
function isExtensionContextValid() {
  try {
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch (error) {
    return false;
  }
}
