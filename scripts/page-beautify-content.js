/**
 * 页面美化内容脚本
 * 在目标网页中注入并应用美化效果
 */

class PageBeautifyContent {
  constructor() {
    this.appliedStyles = new Map();
    this.init();
  }

  async init() {
    console.log("页面美化内容脚本初始化完成");
  }

  /**
   * 处理页面美化相关消息
   * @param {Object} request - 请求对象
   * @param {Function} sendResponse - 响应函数
   */
  async handlePageBeautifyMessage(request, sendResponse) {
    try {
      console.log("收到页面美化消息:", request);

      switch (request.type) {
        case "APPLY_THEME":
          this.applyTheme(request.theme || request.data);
          sendResponse({ success: true });
          break;

        case "RESET_STYLES":
          this.resetAllStyles();
          sendResponse({ success: true });
          break;

        case "CHECK_NAVBAR_ELEMENTS":
          const result = this.checkNavbarElements();
          sendResponse({ success: true, data: result });
          break;

        case "VALIDATE_SELECTOR":
          const validationResult = this.validateSelector(request.selector);
          console.log('验证结果',validationResult);
          
          sendResponse({ success: true, data: validationResult });
          break;

        default:
          console.warn("未知的消息类型:", request.type);
          sendResponse({ success: false, error: "未知的消息类型" });
      }
    } catch (error) {
      console.error("处理消息时发生错误:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * 应用主题样式
   * @param {Object} themeData - 主题数据
   */
  applyTheme(themeData) {
    if (!themeData || !themeData.groups) {
      console.warn("无效的主题数据");
      return;
    }

    // 先清除现有样式
    this.resetAllStyles();

    // 应用新主题的样式组
    themeData.groups.forEach((group) => {
      if (group.rules && Array.isArray(group.rules)) {
        group.rules.forEach((rule) => {
          this.applyRule(rule, group.id);
        });
      }
    });

    console.log("主题样式已应用:", themeData.name || "未命名主题");
  }

  /**
   * 应用单个CSS规则
   * @param {Object} rule - CSS规则
   * @param {string} groupId - 组ID
   */
  applyRule(rule, groupId) {
    if (!rule.selector || !rule.properties) {
      console.warn("无效的CSS规则:", rule);
      return;
    }

    try {
      const elements = document.querySelectorAll(rule.selector);

      elements.forEach((element) => {
        // 保存原始样式
        if (!this.appliedStyles.has(element)) {
          this.appliedStyles.set(element, new Map());
        }

        const elementStyles = this.appliedStyles.get(element);

        Object.entries(rule.properties).forEach(([property, value]) => {
          // 保存原始值
          if (!elementStyles.has(property)) {
            const originalValue =
              element.style.getPropertyValue(property) ||
              getComputedStyle(element).getPropertyValue(property);
            elementStyles.set(property, originalValue);
          }

          // 应用新样式
          element.style.setProperty(property, value);
        });
      });

      console.log(`已应用规则 [${groupId}]: ${rule.selector}`);
    } catch (error) {
      console.error("应用CSS规则失败:", error, rule);
    }
  }

  /**
   * 重置所有应用的样式
   */
  resetAllStyles() {
    this.appliedStyles.forEach((elementStyles, element) => {
      elementStyles.forEach((originalValue, property) => {
        if (originalValue) {
          element.style.setProperty(property, originalValue);
        } else {
          element.style.removeProperty(property);
        }
      });
    });

    this.appliedStyles.clear();
    console.log("所有样式已重置");
  }

  /**
   * 检查导航栏元素
   * @returns {Object} 检查结果
   */
  checkNavbarElements() {
    const navbarSelectors = [
      "nav",
      ".navbar",
      ".header",
      ".site-header",
      ".d-header-wrap .d-header",
      '[role="navigation"]',
    ];

    const foundElements = [];

    navbarSelectors.forEach((selector) => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundElements.push({
            selector,
            count: elements.length,
            elements: Array.from(elements).map((el) => ({
              tagName: el.tagName,
              className: el.className,
              id: el.id,
            })),
          });
        }
      } catch (error) {
        console.warn(`检查选择器失败: ${selector}`, error);
      }
    });

    return {
      hasNavbar: foundElements.length > 0,
      elements: foundElements,
    };
  }

  /**
   * 获取元素的计算样式
   * @param {string} selector - CSS选择器
   * @param {Array} properties - 要获取的属性列表
   * @returns {Object} 样式信息
   */
  getElementStyles(selector, properties = []) {
    try {
      const elements = document.querySelectorAll(selector);
      const results = [];

      elements.forEach((element, index) => {
        const computedStyle = getComputedStyle(element);
        const styles = {};

        if (properties.length > 0) {
          properties.forEach((prop) => {
            styles[prop] = computedStyle.getPropertyValue(prop);
          });
        } else {
          // 如果没有指定属性，返回一些常用属性
          const commonProps = [
            "background-color",
            "color",
            "font-size",
            "padding",
            "margin",
            "border",
            "border-radius",
            "box-shadow",
            "opacity",
          ];
          commonProps.forEach((prop) => {
            styles[prop] = computedStyle.getPropertyValue(prop);
          });
        }

        results.push({
          index,
          element: {
            tagName: element.tagName,
            className: element.className,
            id: element.id,
          },
          styles,
        });
      });

      return {
        selector,
        count: elements.length,
        elements: results,
      };
    } catch (error) {
      console.error("获取元素样式失败:", error);
      return {
        selector,
        count: 0,
        elements: [],
        error: error.message,
      };
    }
  }

  /**
   * 验证CSS选择器
   * @param {string} selector - CSS选择器
   * @returns {Object} 验证结果
   */
  validateSelector(selector) {
    try {
      if (!selector || !selector.trim()) {
        return {
          isValid: false,
          elementCount: 0,
          message: "请输入CSS选择器",
        };
      }
      
      const elements = document.querySelectorAll(selector);
      
      return {
        isValid: elements.length > 0,
        elementCount: elements.length,
        message: `找到 ${elements.length} 个匹配的元素`,
      };
    } catch (error) {
      return {
        isValid: false,
        elementCount: 0,
        message: "无效的CSS选择器",
      };
    }
  }
}
const pageBeautifyContent = new PageBeautifyContent();

function initializeTimerDisplay() {
  // 创建全局实例
  console.log('初始化全局实例 ok');
  
  // 监听来自background script的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到来自background script的消息',request);
    
    if (request.action === "pageBeautify") {
      pageBeautifyContent.handlePageBeautifyMessage(request, sendResponse);
      return true; // 保持消息通道开放
    }
  });
}

// 页面加载完成后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTimerDisplay);
} else {
  initializeTimerDisplay();
}

console.log("页面美化内容脚本已加载");
