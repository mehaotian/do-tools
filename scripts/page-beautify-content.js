/**
 * 页面美化内容脚本
 * 在目标网页中注入并应用美化效果
 */

// 预制主题定义（与page-beautify.js保持同步）
const PRESET_THEMES = [
  {
    id: "none",
    name: "无主题",
    description: "不应用任何样式修改",
    groups: [],
  },{
    "description": "深色护眼主题 ,建议主站切换为深色主题后应用",
    "groups": [
      {
        "description": "背景优化",
        "id": "id_k9kamnv9z_mbgbbtfg",
        "name": "背景",
        "rules": [
          {
            "properties": {
              "background-color": "rgba(26, 31, 46, 1)",
              "color": "rgba(232, 230, 227, 1)"
            },
            "selector": "body"
          }
        ]
      },
      {
        "description": "导航栏样式修改",
        "id": "id_qkawy559z_mbgd079w",
        "name": "导航栏",
        "rules": [
          {
            "properties": {
              "backdrop-filter": "saturate(50%) blur(4px)",
              "background-color": "transparent",
              "background-image": "radial-gradient(transparent 1px, #1a1f2e 1px)",
              "background-size": "4px 4px",
              "box-shadow": "0 0 0 1px #3a4553"
            },
            "selector": ".d-header-wrap .d-header"
          },
          {
            "properties": {
              "color": "rgba(74, 158, 255, 1)",
              "font-size": "18px"
            },
            "selector": ".ember-application div.extra-info-wrapper a.topic-link"
          }
        ]
      },
      {
        "description": "侧栏样式修改",
        "id": "id_gbk98ye33_mbgdnm3v",
        "name": "侧栏",
        "rules": [
          {
            "properties": {
              "background-color": "rgba(36, 43, 61, 1)",
              "border-radius": "8px",
              "height": "calc(100vh - 85px);",
              "margin": "10px"
            },
            "selector": "#main-outlet-wrapper .sidebar-wrapper"
          },
          {
            "properties": {
              "border": "1px solid #3a4553"
            },
            "selector": "#main-outlet-wrapper .sidebar-wrapper .sidebar-container"
          },
          {
            "properties": {
              "color": "rgba(184, 181, 178, 1)",
              "font-size": "14px"
            },
            "selector": "#main-outlet-wrapper .sidebar-section-link-wrapper .sidebar-section-link"
          },
          {
            "properties": {
              "border": "1px solid #3a4553",
              "border-radius": "5px",
              "margin": "5px 0"
            },
            "selector": "#main-outlet-wrapper .sidebar-section-wrapper"
          },
          {
            "properties": {
              "padding": "1rem 0.2rem 1rem 1rem"
            },
            "selector": "#main-outlet-wrapper .sidebar-wrapper .sidebar-sections"
          },
          {
            "properties": {
              "background-color": "rgba(74, 158, 255, 0.15)",
              "border-right": "3px solid #4a9eff",
              "color": "rgba(74, 158, 255, 1)"
            },
            "selector": "#main-outlet-wrapper li.sidebar-section-link-wrapper a.sidebar-section-link.active"
          },
          {
            "properties": {
              "background-color": "rgba(26, 31, 46, 1)"
            },
            "selector": "#main-outlet-wrapper li.sidebar-section-link-wrapper a.sidebar-section-link:hover"
          },
          {
            "properties": {
              "background-color": "rgba(36, 43, 61, 1)"
            },
            "selector": "#main-outlet-wrapper .sidebar-footer-wrapper"
          },
          {
            "properties": {
              "background": "linear-gradient(to bottom, transparent, #242b3d)"
            },
            "selector": "#main-outlet-wrapper .sidebar-footer-wrapper .sidebar-footer-container::before"
          },
          {
            "properties": {
              "background-color": "rgba(74, 158, 255, 1)",
              "color": "rgba(255, 255, 255, 1)"
            },
            "selector": "button.btn.btn-icon-text"
          },
          {
            "properties": {
              "color": "#fff"
            },
            "selector": "#d-sidebar .btn .d-icon, .d-modal.json-schema-editor-modal .je-ready button .d-icon"
          },
          {
            "properties": {
              "scrollbar-color": "rgba(26, 31, 46, 1) transparent"
            },
            "selector": "#main-outlet-wrapper .sidebar-wrapper .sidebar-sections:hover"
          }
        ]
      },
      {
        "description": "主内容区的条幅提醒，主要提醒等等的样式",
        "id": "id_w6nbkdj73_mbok6029",
        "name": "条幅装饰灯",
        "rules": [
          {
            "properties": {
              "background": "linear-gradient(135deg, rgba(74, 158, 255, 0.15) 0%, rgba(74, 158, 255, 0.05) 100%)",
              "border": "1px solid rgba(74, 158, 255, 0.3)",
              "border-radius": "8px",
              "color": "#fff",
              "font-size": "14px",
              "padding": "10px 20px"
            },
            "selector": ".global-notice .alert.alert-info"
          },
          {
            "properties": {
              "background": "linear-gradient(135deg, rgba(74, 158, 255, 1) 0%, rgba(74, 158, 255, 2) 100%)",
              "border-radius": "8px",
              "color": "#fff"
            },
            "selector": "#list-area .show-more .alert"
          },
          {
            "properties": {
              "animation": "gradient 10s ease infinite",
              "background-color": "rgba(0, 0, 0, 1)",
              "background-image": "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)",
              "background-size": "400% 400%",
              "border-radius": "8px",
              "color": "rgba(255, 255, 255, 1)"
            },
            "selector": ".house-creative>a>div"
          }
        ]
      },
      {
        "description": "内容卡片样式",
        "id": "id_g1k0ttfo3_mbou6ds4",
        "name": "内容卡片",
        "rules": [
          {
            "properties": {
              "display": "flex",
              "flex-direction": "column"
            },
            "selector": ".contents .topic-list"
          },
          {
            "properties": {
              "border": "none",
              "display": "flex",
              "flex-direction": "column"
            },
            "selector": ".contents .topic-list-body"
          },
          {
            "properties": {
              "background-color": "rgba(45, 53, 72, 1)",
              "border-bottom": "1px #3a4553 solid",
              "cursor": "pointer",
              "padding": "8px 0"
            },
            "selector": "tr.topic-list-item"
          },
          {
            "properties": {
              "color": "#e8e6e3",
              "font-size": "16px"
            },
            "selector": ".topic-list-item td.topic-list-data   a.title"
          },
          {
            "properties": {
              "color": "#9ca3af",
              "font-size": "14px"
            },
            "selector": ".topic-list-item td.topic-list-data   a.topic-excerpt"
          },
          {
            "properties": {
              "color": "#b8b5b2",
              "font-size": "12px"
            },
            "selector": ".badge-category__wrapper .badge-category__name"
          },
          {
            "properties": {
              "background-color": "rgba(250, 173, 20, 0.1)",
              "border-radius": "20px",
              "color": "#faad14",
              "font-size": "13px",
              "padding": "5px 8px"
            },
            "selector": "a.badge-notification.unread-posts"
          },
          {
            "properties": {
              "background": "rgba(74, 158, 255, 0.1)",
              "border-radius": "12px",
              "color": "#4a9eff",
              "font-size": "12px",
              "padding": "2px 8px"
            },
            "selector": ".topic-list .link-bottom-line a.discourse-tag.box"
          },
          {
            "properties": {
              "background-color": "#34405a"
            },
            "selector": "tr.topic-list-item:hover"
          }
        ]
      },
      {
        "description": "内容卡片上面的tab样式",
        "id": "id_qmgvt4so9_mbov0ynw",
        "name": "内容卡片tab",
        "rules": [
          {
            "properties": {
              "background": "#242b3d"
            },
            "selector": ".navigation-container"
          },
          {
            "properties": {
              "color": "rgba(184, 181, 178, 1)",
              "font-size": "16px"
            },
            "selector": "ul.nav-pills>li.ember-view>a"
          },
          {
            "properties": {
              "color": "rgba(74, 158, 255, 1)",
              "font-size": "16px"
            },
            "selector": "ul.nav-pills>li.active.ember-view>a"
          },
          {
            "properties": {
              "border-bottom-color": "#4a9eff"
            },
            "selector": "ul.nav-pills>li a.active::after"
          },
          {
            "properties": {
              "background-color": "#4a9eff",
              "font-size": "14px"
            },
            "selector": "button.btn.btn-icon-text"
          },
          {
            "properties": {
              "color": "#fff"
            },
            "selector": ".btn svg.d-icon"
          },
          {
            "properties": {
              "margin": "10px"
            },
            "selector": "ol.category-breadcrumb"
          },
          {
            "properties": {
              "margin-bottom": "0"
            },
            "selector": "ul#navigation-bar"
          },
          {
            "properties": {
              "margin-bottom": "0"
            },
            "selector": "div.navigation-controls"
          }
        ]
      },
      {
        "description": "类别，标签筛选器",
        "id": "id_zjvzw1l35_mbovjxlr",
        "name": "筛选器",
        "rules": [
          {
            "properties": {
              "background-color": "rgba(250, 173, 20, 0.1)",
              "border": "2px #fff solid",
              "border-radius": "8px",
              "color": "rgba(255, 255, 255, 1)"
            },
            "selector": ".list-controls details.combo-box summary.combo-box-header"
          },
          {
            "properties": {
              "color": "rgba(255, 255, 255, 1)",
              "font-size": "14px"
            },
            "selector": ".select-kit.combo-box.tag-drop .selected-name .name"
          },
          {
            "properties": {
              "color": "rgba(255, 255, 255, 1)",
              "font-size": "14px"
            },
            "selector": ".select-kit .select-kit-header .selected-name .name"
          },
          {
            "properties": {
              "color": "rgba(255, 255, 255, 1)"
            },
            "selector": ".select-kit.combo-box.category-drop svg.caret-icon"
          },
          {
            "properties": {
              "color": "#fff"
            },
            "selector": ".select-kit.combo-box.tag-drop svg.caret-icon"
          }
        ]
      },
      {
        "description": "详情样式修改",
        "id": "id_yxhs9cwro_mboxetzi",
        "name": "文章详情",
        "rules": [
          {
            "properties": {
              "color": "rgba(232, 230, 227, 1)"
            },
            "selector": "nav.post-controls .btn.show-replies .d-button-label"
          }
        ]
      }
    ],
    "id": "modern-dark",
    "isCustom": true,
    "name": "深色主题",
    "urlPatterns": [
      {
        "enabled": true,
        "pattern": "*://linux.do/*",
        "type": "wildcard"
      },
      {
        "enabled": true,
        "pattern": "*://www.linux.do/*",
        "type": "wildcard"
      }
    ]
  }
];

class PageBeautifyContent {
  constructor() {
    this.appliedStyles = new Map();
    // 存储预览样式的映射：selector -> { property -> originalValue }
    this.previewStyles = new Map();
    // 存储页面真正的原始状态（按需记录）
    this.originalPageState = new Map();

    // CSS注入管理
    this.injectedStyles = new Map(); // styleId -> HTMLStyleElement
    this.currentThemeCSS = null; // 当前主题的CSS内容
    this.currentThemeId = null; // 当前主题ID
    this.init();
  }

  async init() {
    // 自动加载并应用保存的主题（按需记录原始状态）
    await this.loadAndApplyStoredTheme();
  }

  /**
   * 记录特定元素的原始状态
   * 按需记录，只在实际需要应用样式时才记录相关元素的原始状态
   * @param {Element} element - 需要记录原始状态的元素
   * @param {Array} properties - 需要记录的CSS属性列表
   */
  recordElementOriginalState(element, properties) {
    if (!element || this.originalPageState.has(element)) {
      return; // 元素无效或已记录过
    }

    const computedStyle = getComputedStyle(element);
    const elementOriginalStyles = new Map();

    properties.forEach((property) => {
      const value = computedStyle.getPropertyValue(property);
      if (value) {
        elementOriginalStyles.set(property, value);
      }
    });

    if (elementOriginalStyles.size > 0) {
      this.originalPageState.set(element, elementOriginalStyles);
    }
  }

  /**
   * 批量记录元素的原始状态
   * @param {NodeList|Array} elements - 元素列表
   * @param {Array} properties - 需要记录的CSS属性列表
   */
  recordElementsOriginalState(elements, properties) {
    elements.forEach((element) => {
      this.recordElementOriginalState(element, properties);
    });
  }

  /**
   * 加载并应用存储的主题
   */
  async loadAndApplyStoredTheme() {
    try {
      // 获取当前页面URL
      const currentUrl = window.location.href;

      // 从chrome.storage.sync获取应用的主题ID（与页面应用保持一致）
      const result = await chrome.storage.sync.get([
        "appliedThemeId",
        "customThemes",
      ]);

      const appliedThemeId = result.appliedThemeId;

      if (!appliedThemeId) {
        return;
      }

      // 如果是无主题，不需要应用任何样式
      if (appliedThemeId === "none" || appliedThemeId === "default") {
        return;
      }

      // 尝试获取主题数据
      let themeData = null;

      // 首先检查自定义主题
      const customThemes = result.customThemes;

      if (customThemes && Array.isArray(customThemes)) {
        themeData = customThemes.find((theme) => theme.id === appliedThemeId);
      }

      // 如果没有找到自定义主题，检查预制主题
      if (!themeData) {
        themeData = PRESET_THEMES.find((theme) => theme.id === appliedThemeId);
      }

      // 如果仍然没有找到主题数据
      if (!themeData) {
        return;
      }

      // 检查主题是否匹配当前URL
      const isUrlMatch = this.isThemeMatchUrl(themeData, currentUrl);

      if (!isUrlMatch) {
        return;
      }

      // 应用找到的主题
      this.applyTheme(themeData);
    } catch (error) {
      console.error("[Content Script] 加载存储主题失败:", error);
      console.error("[Content Script] 错误详情:", error.message, error.stack);
    }
  }

  /**
   * 检查主题是否匹配当前URL
   * @param {Object} theme - 主题数据
   * @param {string} currentUrl - 当前页面URL
   * @returns {boolean} 是否匹配
   */
  isThemeMatchUrl(theme, currentUrl) {
    if (!theme || !currentUrl) {
      return false;
    }

    // 如果没有urlPatterns或为空数组，则不匹配任何URL（新的行为）
    if (
      !theme.urlPatterns ||
      !Array.isArray(theme.urlPatterns) ||
      theme.urlPatterns.length === 0
    ) {
      return false;
    }

    // 检查是否有任何启用的模式匹配当前URL
    const matchResult = theme.urlPatterns.some((urlPattern) => {
      if (!urlPattern.enabled) {
        return false;
      }

      const isMatch = this.matchUrlPattern(
        currentUrl,
        urlPattern.pattern,
        urlPattern.type || "wildcard"
      );
      return isMatch;
    });

    return matchResult;
  }

  /**
   * 检查URL是否匹配指定模式
   * @param {string} url - 要检查的URL
   * @param {string} pattern - 匹配模式
   * @param {string} type - 模式类型
   * @returns {boolean} 是否匹配
   */
  matchUrlPattern(url, pattern, type = "wildcard") {
    if (!url || !pattern) {
      return false;
    }

    try {
      switch (type) {
        case "exact":
          return url === pattern;

        case "regex":
          const regex = new RegExp(pattern);
          return regex.test(url);

        case "wildcard":
        default:
          return this.wildcardMatch(url, pattern);
      }
    } catch (error) {
      console.warn("[Content Script] URL匹配失败:", error);
      return false;
    }
  }

  /**
   * 通配符匹配
   * @param {string} url - 要检查的URL
   * @param {string} pattern - 通配符模式
   * @returns {boolean} 是否匹配
   */
  wildcardMatch(url, pattern) {
    if (pattern === "*") {
      return true;
    }

    // 将通配符模式转换为正则表达式
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&") // 转义特殊字符
      .replace(/\*/g, ".*") // * 转换为 .*
      .replace(/\?/g, "."); // ? 转换为 .

    const regex = new RegExp(`^${regexPattern}$`, "i");
    return regex.test(url);
  }

  /**
   * 处理URL变化事件
   * 当页面URL发生变化时，重新检查和应用主题
   * @param {string} newUrl - 新的URL地址
   */
  async handleUrlChange(newUrl) {
    try {
      // 清除当前应用的样式
      this.clearAllStyles();

      // 清除原始状态记录（因为URL变化可能导致页面内容变化）
      this.originalPageState.clear();

      // 重新加载并应用匹配的主题
      await this.loadAndApplyStoredTheme();

      // 通知页面美化应用更新插件状态（如果存在）
      this.notifyPluginStatusUpdate(newUrl);
    } catch (error) {
      console.error("[Content Script] 处理URL变化失败:", error);
    }
  }

  /**
   * 处理标签页激活事件
   * 当用户切换到当前标签页时，重新检查和应用主题
   * @param {string} currentUrl - 当前URL地址
   */
  async handleTabActivation(currentUrl) {
    try {
      // 检查当前是否有应用的主题
      const hasAppliedStyles = this.appliedStyles.size > 0;

      if (!hasAppliedStyles) {
        // 如果没有应用的样式，重新加载并应用主题
        await this.loadAndApplyStoredTheme();
      }

      // 通知页面美化应用更新插件状态（如果存在）
      this.notifyPluginStatusUpdate(currentUrl);
    } catch (error) {
      console.error("[Content Script] 处理标签页激活失败:", error);
    }
  }

  /**
   * 通知页面美化应用更新插件状态
   * 向页面中的美化应用发送消息，更新插件状态显示
   * @param {string} currentUrl - 当前URL地址
   */
  notifyPluginStatusUpdate(currentUrl) {
    try {
      // 查找页面中的美化应用iframe或窗口
      const beautifyFrame = document.querySelector(
        'iframe[src*="page-beautify.html"]'
      );

      if (beautifyFrame && beautifyFrame.contentWindow) {
        // 向美化应用发送URL更新消息
        beautifyFrame.contentWindow.postMessage(
          {
            type: "urlChanged",
            url: currentUrl,
            timestamp: Date.now(),
          },
          "*"
        );
      }

      // 也可以通过自定义事件通知页面
      const event = new CustomEvent("pageBeautifyUrlChanged", {
        detail: {
          url: currentUrl,
          hasAppliedStyles: this.appliedStyles.size > 0,
          timestamp: Date.now(),
        },
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.debug("[Content Script] 通知插件状态更新失败:", error);
    }
  }

  /**
   * 清除所有应用的样式
   */
  clearAllStyles() {
    try {
      // 重置所有样式到原始状态
      this.resetAllStyles();

      // 清除预览样式
      this.clearAllPreview();
    } catch (error) {
      console.error("[Content Script] 清除样式失败:", error);
    }
  }

  /**
   * 处理页面美化相关消息
   * @param {Object} request - 请求对象
   * @param {Function} sendResponse - 响应函数
   */
  async handlePageBeautifyMessage(request, sendResponse) {
    try {
      switch (request.type) {
        case "APPLY_THEME":
          // 统一使用data字段，保持向后兼容
          const themeData = request.data || request.theme;

          // 检查主题是否匹配当前URL
          const currentUrl = window.location.href;
          const isUrlMatch = this.isThemeMatchUrl(themeData, currentUrl);

          if (isUrlMatch) {
            this.applyTheme(themeData);
            sendResponse({ success: true });
          } else {
            // 清除现有样式，因为当前页面不应该有这个主题的样式
            this.resetAllStyles();
            sendResponse({ success: false, reason: "URL不匹配" });
          }
          break;

        case "RESET_STYLES":
        case "CLEAR_STYLES":
          this.resetAllStyles();
          this.clearAllInjectedStyles();
          sendResponse({ success: true });
          break;

        case "CHECK_NAVBAR_ELEMENTS":
          const result = this.checkNavbarElements();
          sendResponse({ success: true, data: result });
          break;

        case "CLEAR_SELECTOR_HIGHLIGHT":
          this.clearSelectorHighlight();
          sendResponse({ success: true, data: { message: "高亮已清除" } });
          break;

        case "PREVIEW_STYLE":
          this.previewStyle(
            request.data.selector,
            request.data.property,
            request.data.value
          );
          sendResponse({ success: true });
          break;

        case "CLEAR_PREVIEW_PROPERTY":
          this.clearPreviewProperty(
            request.data.selector,
            request.data.property
          );
          sendResponse({ success: true });
          break;

        case "CLEAR_ALL_PREVIEW":
          this.clearAllPreview();
          sendResponse({ success: true });
          break;

        case "APPLY_CSS":
          this.applyCSSToPage(request.data.css, request.data.styleId);
          sendResponse({ success: true });
          break;

        case "VALIDATE_SELECTOR":
          const selectorValidation = this.validateSelectorAndCount(
            request.data.selector
          );
          sendResponse({
            success: true,
            elementCount: selectorValidation.count,
            isValid: selectorValidation.isValid,
          });
          break;

        case "HIGHLIGHT_ELEMENTS":
          this.highlightElements(request.data.selector);
          sendResponse({ success: true });
          break;

        case "REMOVE_HIGHLIGHT":
          this.removeHighlight();
          sendResponse({ success: true });
          break;

        case "SIMULATE_PSEUDO_CLASS":
          this.simulatePseudoClass(
            request.data.selector,
            request.data.pseudoClass
          );
          sendResponse({ success: true });
          break;

        case "CLEAR_PSEUDO_CLASS_SIMULATION":
          this.clearPseudoClassSimulation();
          sendResponse({ success: true });
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

    // 先清除现有的行内样式和注入的CSS
    this.resetAllStyles();
    this.clearAllInjectedStyles();

    // 生成CSS并注入到页面
    const css = this.generateThemeCSS(themeData);
    if (css && css.trim()) {
      this.applyCSSToPage(css, themeData.id || "theme");
    }
  }

  /**
   * 生成主题CSS代码
   * @param {Object} theme - 主题对象
   * @returns {string} CSS代码
   */
  generateThemeCSS(theme) {
    if (!theme || !theme.groups || !Array.isArray(theme.groups)) {
      return "";
    }

    const cssRules = [];

    theme.groups.forEach((group) => {
      if (!group.rules || !Array.isArray(group.rules)) {
        return;
      }

      group.rules.forEach((rule) => {
        if (!rule.selector || !rule.properties) {
          return;
        }

        // 验证选择器
        if (!this.isValidSelector(rule.selector)) {
          console.warn("[CSS生成] 无效的CSS选择器:", rule.selector);
          return;
        }

        // 生成CSS属性
        const properties = this.generateCSSProperties(rule.properties);
        if (properties.trim()) {
          cssRules.push(`${rule.selector} {\n${properties}\n}`);
        }
      });
    });

    return cssRules.join("\n\n");
  }

  /**
   * 生成CSS属性字符串
   * @param {Object} properties - CSS属性对象
   * @returns {string} CSS属性字符串
   */
  generateCSSProperties(properties) {
    if (!properties || typeof properties !== "object") {
      return "";
    }

    const cssProps = [];

    Object.entries(properties).forEach(([prop, value]) => {
      if (this.isValidCSSProperty(prop, value)) {
        // 确保属性名使用kebab-case
        const kebabProp = this.toKebabCase(prop);
        cssProps.push(`  ${kebabProp}: ${value};`);
      }
    });

    return cssProps.join("\n");
  }

  /**
   * 验证CSS选择器
   * @param {string} selector - CSS选择器
   * @returns {boolean} 是否有效
   */
  isValidSelector(selector) {
    if (!selector || typeof selector !== "string") {
      return false;
    }

    try {
      document.querySelector(selector);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证CSS属性
   * @param {string} property - CSS属性名
   * @param {string} value - CSS属性值
   * @returns {boolean} 是否有效
   */
  isValidCSSProperty(property, value) {
    if (
      !property ||
      !value ||
      typeof property !== "string" ||
      typeof value !== "string"
    ) {
      return false;
    }

    // 基本的CSS属性名验证
    if (!/^[a-zA-Z-]+$/.test(property)) {
      return false;
    }

    return true;
  }

  /**
   * 将camelCase转换为kebab-case
   * @param {string} str - 输入字符串
   * @returns {string} kebab-case字符串
   */
  toKebabCase(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
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
      const properties = Object.keys(rule.properties);

      // 先记录这些元素的原始状态（按需记录）
      this.recordElementsOriginalState(elements, properties);

      elements.forEach((element) => {
        // 保存原始样式到appliedStyles（用于重置）
        if (!this.appliedStyles.has(element)) {
          this.appliedStyles.set(element, new Map());
        }

        const elementStyles = this.appliedStyles.get(element);

        Object.entries(rule.properties).forEach(([property, value]) => {
          // 保存原始值
          if (!elementStyles.has(property)) {
            let originalValue = "";

            // 优先从记录的原始页面状态中获取真正的原始值
            if (this.originalPageState.has(element)) {
              const elementOriginalStyles = this.originalPageState.get(element);
              if (elementOriginalStyles.has(property)) {
                originalValue = elementOriginalStyles.get(property);
              }
            }

            // 如果没有记录的原始值，则使用当前值作为回退
            if (!originalValue) {
              originalValue =
                element.style.getPropertyValue(property) ||
                getComputedStyle(element).getPropertyValue(property);
            }

            elementStyles.set(property, originalValue);
          }

          // 应用新样式
          element.style.setProperty(property, value);
        });
      });
    } catch (error) {
      console.error("应用CSS规则失败:", error, rule);
    }
  }

  /**
   * 重置所有应用的样式
   */
  resetAllStyles() {
    // 首先清除所有内联样式
    this.appliedStyles.forEach((elementStyles, element) => {
      elementStyles.forEach((originalValue, property) => {
        element.style.removeProperty(property);
      });
    });

    // 然后恢复到真正的原始状态（如果有记录的话）
    if (this.originalPageState.size > 0) {
      this.originalPageState.forEach((elementStyles, element) => {
        // 检查元素是否还在DOM中
        if (document.contains(element)) {
          elementStyles.forEach((originalValue, property) => {
            if (
              originalValue &&
              originalValue !== "initial" &&
              originalValue !== "inherit"
            ) {
              element.style.setProperty(property, originalValue);
            }
          });
        }
      });
    } else {
      // 没有记录的原始状态是正常情况，通常发生在页面刷新或首次清除时
      if (typeof ErrorHandler !== 'undefined') {
        ErrorHandler.info('没有记录的原始状态，仅清除了内联样式');
      } else if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
        console.info('[Debug] 没有记录的原始状态，仅清除了内联样式');
      }
    }

    this.appliedStyles.clear();

    // 清除所有注入的CSS样式
    this.clearAllInjectedStyles();
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
      // 清除之前的高亮
      this.clearSelectorHighlight();

      if (!selector || !selector.trim()) {
        return {
          isValid: false,
          elementCount: 0,
          message: "请输入CSS选择器",
        };
      }

      const elements = document.querySelectorAll(selector);

      if (elements.length > 0) {
        // 为匹配的元素添加高亮边框
        this.highlightSelectedElements(elements);
      }

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

  /**
   * 为选中的元素添加高亮边框
   * @param {NodeList} elements 匹配的元素列表
   */
  highlightSelectedElements(elements) {
    elements.forEach((element) => {
      // 保存原始样式
      const originalOutline = element.style.outline;
      const originalOutlineOffset = element.style.outlineOffset;
      const originalBoxShadow = element.style.boxShadow;
      const originalPosition = element.style.position;
      const originalZIndex = element.style.zIndex;

      // 添加高亮样式
      element.style.outline = "3px dashed #3b82f6";
      element.style.outlineOffset = "3px";
      element.style.transition = "outline 0.3s ease, box-shadow 0.3s ease";
      element.style.boxShadow =
        "0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)";
      element.style.position = "relative";
      element.style.zIndex = "9999";

      // 标记为已高亮的元素
      element.setAttribute("data-page-beautify-highlighted", "true");
      element.setAttribute("data-original-outline", originalOutline);
      element.setAttribute(
        "data-original-outline-offset",
        originalOutlineOffset
      );
      element.setAttribute("data-original-box-shadow", originalBoxShadow);
      element.setAttribute("data-original-position", originalPosition);
      element.setAttribute("data-original-z-index", originalZIndex);
    });

    // 5秒后自动清除高亮
    setTimeout(() => {
      this.clearSelectorHighlight();
    }, 5000);
  }

  /**
   * 清除选择器高亮效果
   */
  /**
   * 模拟伪类效果
   * @param {string} selector - 基础选择器
   * @param {string} pseudoClass - 伪类
   */
  simulatePseudoClass(selector, pseudoClass) {
    try {
      // 先清除之前的模拟效果
      this.clearPseudoClassSimulation();
      
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn("未找到匹配的元素:", selector);
        return;
      }

      elements.forEach((element) => {
        // 标记为伪类模拟元素
        element.setAttribute("data-pseudo-simulation", pseudoClass);
        
        switch (pseudoClass) {
          case ":hover":
             // 模拟hover状态
             element.classList.add("page-beautify-pseudo-hover");
             // 强制触发hover样式 - 通过添加特殊属性来模拟hover
             element.setAttribute("data-force-hover", "true");
             // 手动触发mouseenter事件来激活hover样式
             const mouseEnterEvent = new MouseEvent('mouseenter', {
               bubbles: true,
               cancelable: true,
               view: window
             });
             element.dispatchEvent(mouseEnterEvent);
             break;
            
          case ":focus":
            // 模拟focus状态
            element.classList.add("page-beautify-pseudo-focus");
            element.focus();
            break;
            
          case ":active":
            // 模拟active状态
            element.classList.add("page-beautify-pseudo-active");
            break;
            
          case ":visited":
            // 模拟visited状态（仅对链接有效）
            if (element.tagName.toLowerCase() === "a") {
              element.classList.add("page-beautify-pseudo-visited");
            }
            break;
            
          case "::before":
          case "::after":
          case "::first-line":
          case "::first-letter":
            // 伪元素通常不需要特殊模拟，CSS会自动处理
            element.classList.add(`page-beautify-pseudo${pseudoClass.replace(":", "-")}`);
            break;
            
          default:
            console.warn("不支持的伪类:", pseudoClass);
        }
      });
      
      console.log(`已为 ${elements.length} 个元素模拟 ${pseudoClass} 效果`);
    } catch (error) {
      console.error("模拟伪类效果失败:", error);
    }
  }

  /**
   * 清除伪类模拟效果
   */
  clearPseudoClassSimulation() {
    try {
      // 查找所有带有伪类模拟标记的元素
      const simulatedElements = document.querySelectorAll("[data-pseudo-simulation]");
      
      simulatedElements.forEach((element) => {
        const pseudoClass = element.getAttribute("data-pseudo-simulation");
        
        // 移除相关的类名
        element.classList.remove(
          "page-beautify-pseudo-hover",
          "page-beautify-pseudo-focus", 
          "page-beautify-pseudo-active",
          "page-beautify-pseudo-visited",
          "page-beautify-pseudo--before",
          "page-beautify-pseudo--after",
          "page-beautify-pseudo--first-line",
          "page-beautify-pseudo--first-letter"
        );
        
        // 移除自定义属性和强制hover属性
         element.style.removeProperty("--pseudo-hover");
         element.removeAttribute("data-force-hover");
         
         // 如果是hover状态，触发mouseleave事件来清除hover效果
         if (pseudoClass === ":hover") {
           const mouseLeaveEvent = new MouseEvent('mouseleave', {
             bubbles: true,
             cancelable: true,
             view: window
           });
           element.dispatchEvent(mouseLeaveEvent);
         }
         
         // 如果是focus状态，取消焦点
         if (pseudoClass === ":focus" && document.activeElement === element) {
           element.blur();
         }
        
        // 移除标记属性
        element.removeAttribute("data-pseudo-simulation");
      });
      
      console.log(`已清除 ${simulatedElements.length} 个元素的伪类模拟效果`);
    } catch (error) {
      console.error("清除伪类模拟效果失败:", error);
    }
  }

  /**
   * 清除选择器高亮效果
   */
  clearSelectorHighlight() {
    // 直接调用removeHighlight方法来清除高亮
    this.removeHighlight();
  }

  /**
   * 实时预览样式效果
   * @param {string} selector - CSS选择器
   * @param {string} property - CSS属性名
   * @param {string} value - CSS属性值
   */
  previewStyle(selector, property, value) {
    try {
      const elements = document.querySelectorAll(selector);

      if (elements.length === 0) {
        console.warn("未找到匹配的元素:", selector);
        return;
      }

      // 初始化选择器的预览样式映射
      if (!this.previewStyles.has(selector)) {
        this.previewStyles.set(selector, new Map());
      }

      const selectorPreview = this.previewStyles.get(selector);

      elements.forEach((element) => {
        // 如果是第一次预览这个属性，保存原始值
        if (!selectorPreview.has(property)) {
          const originalValue = element.style[property] || "";
          selectorPreview.set(property, originalValue);
        }

        // 应用预览样式
        element.style[property] = value;
      });
    } catch (error) {
      console.error("预览样式失败:", error);
    }
  }

  /**
   * 清除特定属性的预览效果
   * @param {string} selector - CSS选择器
   * @param {string} property - CSS属性名
   */
  clearPreviewProperty(selector, property) {
    try {
      const elements = document.querySelectorAll(selector);
      const selectorPreview = this.previewStyles.get(selector);

      if (!selectorPreview || !selectorPreview.has(property)) {
        return;
      }

      const originalValue = selectorPreview.get(property);

      elements.forEach((element) => {
        element.style[property] = originalValue;
      });

      // 移除预览记录
      selectorPreview.delete(property);

      // 如果该选择器没有其他预览属性，移除整个选择器记录
      if (selectorPreview.size === 0) {
        this.previewStyles.delete(selector);
      }
    } catch (error) {
      console.error("清除预览属性失败:", error);
    }
  }

  /**
   * 清除所有预览效果
   */
  clearAllPreview() {
    try {
      this.previewStyles.forEach((selectorPreview, selector) => {
        const elements = document.querySelectorAll(selector);

        selectorPreview.forEach((originalValue, property) => {
          elements.forEach((element) => {
            element.style[property] = originalValue;
          });
        });
      });

      // 清空预览样式映射
      this.previewStyles.clear();
    } catch (error) {
      console.error("清除所有预览失败:", error);
    }
  }

  /**
   * 通过CSS注入方式应用样式到页面
   * @param {string} css - CSS代码
   * @param {string} styleId - 样式ID
   */
  applyCSSToPage(css, styleId) {
    try {
      // 移除旧的样式
      if (this.injectedStyles.has(styleId)) {
        const oldStyleElement = this.injectedStyles.get(styleId);
        if (oldStyleElement && oldStyleElement.parentNode) {
          oldStyleElement.parentNode.removeChild(oldStyleElement);
        }
        this.injectedStyles.delete(styleId);
      }

      // 如果CSS为空，只清除不注入
      if (!css || !css.trim()) {
        return;
      }

      // 创建新的style元素
      const styleElement = document.createElement("style");
      styleElement.type = "text/css";
      styleElement.setAttribute("data-page-beautify-id", styleId);
      styleElement.setAttribute("data-page-beautify-type", "theme");

      // 添加CSS内容
      if (styleElement.styleSheet) {
        // IE支持
        styleElement.styleSheet.cssText = css;
      } else {
        styleElement.appendChild(document.createTextNode(css));
      }

      // 注入到页面头部
      const head = document.head || document.getElementsByTagName("head")[0];
      head.appendChild(styleElement);

      // 记录注入的样式
      this.injectedStyles.set(styleId, styleElement);
      this.currentThemeCSS = css;
      this.currentThemeId = styleId;
    } catch (error) {
      console.error("[CSS注入] 注入失败:", error);
    }
  }

  /**
   * 清除所有注入的CSS样式
   */
  clearAllInjectedStyles() {
    try {
      this.injectedStyles.forEach((styleElement, styleId) => {
        if (styleElement && styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      });

      this.injectedStyles.clear();
      this.currentThemeCSS = null;
      this.currentThemeId = null;
    } catch (error) {
      console.error("[CSS注入] 清除失败:", error);
    }
  }

  /**
   * 获取当前注入的CSS内容
   * @returns {string|null} 当前CSS内容
   */
  getCurrentInjectedCSS() {
    return this.currentThemeCSS;
  }

  /**
   * 获取当前主题ID
   * @returns {string|null} 当前主题ID
   */
  getCurrentThemeId() {
    return this.currentThemeId;
  }

  /**
   * 验证选择器并返回匹配元素数量
   * @param {string} selector - CSS选择器
   * @returns {Object} 验证结果
   */
  validateSelectorAndCount(selector) {
    try {
      const elements = document.querySelectorAll(selector);
      return {
        isValid: true,
        count: elements.length,
      };
    } catch (error) {
      console.error("选择器验证失败:", error);
      return {
        isValid: false,
        count: 0,
      };
    }
  }

  /**
   * 高亮页面元素
   * @param {string} selector - CSS选择器
   */
  highlightElements(selector) {
    try {
      // 先移除之前的高亮
      this.removeHighlight();

      const elements = document.querySelectorAll(selector);
      elements.forEach((element, index) => {
        // 获取元素当前的定位方式
        const computedStyle = window.getComputedStyle(element);
        const currentPosition = computedStyle.position;

        // 记录原始定位属性
        element.setAttribute("data-original-position", currentPosition);

        // 如果是静态定位，临时设置为相对定位
        let needsPositionFix = false;
        if (currentPosition === "static") {
          element.style.position = "relative";
          needsPositionFix = true;
          element.setAttribute("data-needs-position-fix", "true");
        }

        // 创建绝对定位的虚框元素
        const highlight = document.createElement("div");
        highlight.className = "page-beautify-highlight";
        highlight.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px dashed #3b82f6;
          background: rgba(59, 130, 246, 0.05);
          pointer-events: none;
          z-index: 2147483647;
          box-sizing: border-box;
          border-radius: 4px;
          transition: all 0.2s ease;
        `;

        // 将虚框添加到目标元素内部
        element.appendChild(highlight);

        // 标记元素已被高亮
        element.classList.add("page-beautify-highlighted");
      });
    } catch (error) {
      console.error("高亮元素失败:", error);
    }
  }

  /**
   * 移除所有高亮效果
   */
  removeHighlight() {
    try {
      // 移除所有高亮虚框元素
      const highlights = document.querySelectorAll(".page-beautify-highlight");
      highlights.forEach((highlight) => {
        highlight.remove();
      });

      // 恢复被高亮元素的原始状态
      const highlightedElements = document.querySelectorAll(
        ".page-beautify-highlighted"
      );
      highlightedElements.forEach((element) => {
        // 恢复原始定位属性
        const originalPosition = element.getAttribute("data-original-position");
        const needsPositionFix = element.getAttribute(
          "data-needs-position-fix"
        );

        if (needsPositionFix === "true" && originalPosition) {
          // 恢复为原始的静态定位
          element.style.position = originalPosition;
        }

        // 清理标记属性
        element.removeAttribute("data-original-position");
        element.removeAttribute("data-needs-position-fix");
        element.classList.remove("page-beautify-highlighted");
      });

      // 移除旧版本的高亮元素（向后兼容）
      const oldHighlightedElements = document.querySelectorAll(
        "[data-original-box-shadow], [data-original-outline]"
      );
      oldHighlightedElements.forEach((element) => {
        // 恢复原始样式
        const originalBoxShadow = element.getAttribute(
          "data-original-box-shadow"
        );
        const originalOutline = element.getAttribute("data-original-outline");
        const originalPosition = element.getAttribute("data-original-position");

        if (originalBoxShadow !== null) {
          element.style.boxShadow = originalBoxShadow || "";
        }
        if (originalOutline !== null) {
          element.style.outline = originalOutline || "";
        }
        element.style.outlineOffset = "";

        // 恢复原始定位
        if (originalPosition === "static") {
          element.style.position = "";
          element.removeAttribute("data-original-position");
        }

        // 移除数据属性
        element.removeAttribute("data-original-box-shadow");
        element.removeAttribute("data-original-outline");
        element.classList.remove("page-beautify-highlighted");

        // 移除覆盖层
        const overlays = element.querySelectorAll(
          ".page-beautify-highlight-overlay"
        );
        overlays.forEach((overlay) => overlay.remove());
      });
    } catch (error) {
      console.error("移除高亮失败:", error);
    }
  }
}
let pageBeautifyContent = null;

function initializePageBeautify() {
  // 创建PageBeautifyContent实例
  pageBeautifyContent = new PageBeautifyContent();
  // 监听来自background script的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "pageBeautify") {
      pageBeautifyContent.handlePageBeautifyMessage(request, sendResponse);
      return true; // 保持消息通道开放
    } else if (request.action === "urlChanged") {
      // URL变化时重新检查和应用主题
      pageBeautifyContent.handleUrlChange(request.url);
    } else if (request.action === "tabActivated") {
      // 标签页激活时重新检查和应用主题
      pageBeautifyContent.handleTabActivation(request.url);
    }
  });
}

// 页面加载完成后初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePageBeautify);
} else {
  initializePageBeautify();
}
