/**
 * 页面美化内容脚本
 * 负责在目标网页中应用美化效果
 */

class PageBeautifyContent {
  constructor() {
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
      navbar: ".d-header-wrap > .d-header",
    };
    console.log("contentjs 页面美化内容脚本已初始化");
    this.init();
  }

  /**
   * 初始化
   */
  init() {
    console.log("页面美化内容脚本已初始化 chrome",chrome);
    // 监听来自扩展的消息
    if (typeof chrome !== "undefined" && chrome.runtime) {
      console.log("页面美化内容脚本已初始化，开始监听");
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log(message, sender, sendResponse);
        this.handleMessage(message, sender, sendResponse);
        return true; // 保持消息通道开放
      });
    }

    // 监听来自页面的postMessage
    // window.addEventListener('message', (event) => {
    //     if (event.data && event.data.source === 'page-beautify') {
    //         this.handleMessage(event.data, null, (response) => {
    //             // 通过postMessage回复
    //             event.source.postMessage({
    //                 source: 'page-beautify-response',
    //                 ...response
    //             }, event.origin);
    //         });
    //     }
    // });

    // 页面加载完成后检查元素
    // if (document.readyState === 'loading') {
    //     document.addEventListener('DOMContentLoaded', () => {
    //         this.checkElements();
    //     });
    // } else {
    //     this.checkElements();
    // }

    console.log("页面美化内容脚本已初始化");
  }

  /**
   * 处理消息
   */
  handleMessage(message, sender, sendResponse) {
    console.log("收到消息:", message);
    return;
    switch (message.type) {
      case "CHECK_NAVBAR_ELEMENTS":
        const hasNavbar = this.checkNavbarElements();
        sendResponse({ hasNavbar });
        break;

      case "APPLY_NAVBAR_EFFECT":
        this.settings.navbar = { ...this.settings.navbar, ...message.settings };
        this.applyNavbarGlassEffect();
        sendResponse({ success: true });
        break;

      case "TOGGLE_NAVBAR_EFFECT":
        this.settings.navbar.enabled = message.enabled;
        this.applyNavbarGlassEffect();
        sendResponse({ success: true });
        break;

      case "UPDATE_NAVBAR_PARAM":
        if (message.param && message.value !== undefined) {
          this.settings.navbar[message.param] = message.value;
          if (this.settings.navbar.enabled) {
            this.applyNavbarGlassEffect();
          }
        }
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: "Unknown message type" });
    }
  }

  /**
   * 检查页面元素
   */
  checkElements() {
    // 通知页面美化工具当前页面的元素状态
    const hasNavbar = this.checkNavbarElements();

    // 发送消息给页面美化工具
    chrome.runtime
      .sendMessage({
        type: "ELEMENT_STATUS_UPDATE",
        hasNavbar: hasNavbar,
      })
      .catch(() => {
        // 忽略错误，可能是页面美化工具未打开
      });
  }

  /**
   * 检查导航栏元素是否存在
   */
  checkNavbarElements() {
    const navbarElements = document.querySelectorAll(
      this.targetSelectors.navbar
    );
    return navbarElements.length > 0;
  }

  /**
   * 应用导航栏毛玻璃效果
   */
  applyNavbarGlassEffect() {
    try {
      const navbarElements = document.querySelectorAll(
        this.targetSelectors.navbar
      );

      if (this.settings.navbar.enabled) {
        const { blur, size, transparent, color } = this.settings.navbar;

        const styles = {
          "background-image": `radial-gradient(transparent ${transparent}px, ${color} ${transparent}px)`,
          "background-size": `${size}px ${size}px`,
          "backdrop-filter": `saturate(50%) blur(${blur}px)`,
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
   * 移除所有美化效果
   */
  removeAllEffects() {
    try {
      // 移除导航栏效果
      const navbarElements = document.querySelectorAll(
        this.targetSelectors.navbar
      );
      navbarElements.forEach((element) => {
        element.style.removeProperty("background-image");
        element.style.removeProperty("background-size");
        element.style.removeProperty("backdrop-filter");
        element.style.removeProperty("transition");
        element.classList.remove("page-beautify-navbar");
      });

      console.log("已移除所有页面美化效果");
    } catch (error) {
      console.warn("移除美化效果时出错:", error);
    }
  }
}

// 创建页面美化内容实例
const pageBeautifyContent = new PageBeautifyContent();

// 页面卸载时清理
window.addEventListener("beforeunload", () => {
  if (pageBeautifyContent) {
    pageBeautifyContent.removeAllEffects();
  }
});
