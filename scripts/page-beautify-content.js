/**
 * 页面美化内容脚本
 * 在目标网页中注入并应用美化效果
 */

// 预制主题定义（与page-beautify.js保持同步）
const PRESET_THEMES = [
  {
    id: 'none',
    name: '无主题',
    description: '不应用任何样式修改',
    groups: []
  },
  {
    id: 'modern-light',
    name: '现代浅色',
    description: '简洁现代的浅色主题',
    groups: [
      {
        id: 'navbar',
        name: '导航栏美化',
        description: '为导航栏添加现代化样式',
        rules: [
          {
            selector: 'nav, .navbar, header',
            properties: {
              'background-color': 'rgba(255, 255, 255, 0.9)',
              'backdrop-filter': 'blur(10px)',
              'border-bottom': '1px solid rgba(0, 0, 0, 0.1)',
              'box-shadow': '0 2px 10px rgba(0, 0, 0, 0.1)'
            }
          }
        ]
      },
      {
        id: 'content',
        name: '内容区域',
        description: '优化内容区域的显示效果',
        rules: [
          {
            selector: 'main, .main-content, .content',
            properties: {
              'background-color': '#ffffff',
              'border-radius': '8px',
              'box-shadow': '0 1px 3px rgba(0, 0, 0, 0.1)',
              'padding': '20px'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'modern-dark',
    name: '现代深色',
    description: '优雅的深色主题',
    groups: [
      {
        id: 'global',
        name: '全局样式',
        description: '深色主题的全局样式',
        rules: [
          {
            selector: 'body',
            properties: {
              'background-color': '#1a1a1a',
              'color': '#ffffff'
            }
          }
        ]
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
    this.init();
  }

  async init() {
    console.log("页面美化内容脚本初始化完成");
    
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
    
    properties.forEach(property => {
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
    elements.forEach(element => {
      this.recordElementOriginalState(element, properties);
    });
  }

  /**
   * 加载并应用存储的主题
   */
  async loadAndApplyStoredTheme() {
    try {
      console.log('[Content Script] 开始加载存储的主题');
      
      // 获取当前页面URL
      const currentUrl = window.location.href;
      console.log('[Content Script] 当前页面URL:', currentUrl);
      
      // 从chrome.storage.sync获取应用的主题ID（与页面应用保持一致）
      const result = await chrome.storage.sync.get(['appliedThemeId', 'customThemes']);
      console.log('[Content Script] 使用存储类型: chrome.storage.sync');
      console.log('[Content Script] 从存储中获取的完整结果:', result);
      
      const appliedThemeId = result.appliedThemeId;
      console.log('[Content Script] 解析出的主题ID:', appliedThemeId, '类型:', typeof appliedThemeId);
      
      if (!appliedThemeId) {
        console.log('[Content Script] 没有找到已应用的主题，主题ID为空或undefined');
        return;
      }

      console.log('[Content Script] 找到已应用的主题ID:', appliedThemeId);

      // 如果是无主题，不需要应用任何样式
      if (appliedThemeId === 'none' || appliedThemeId === 'default') {
        console.log('[Content Script] 应用无主题（无样式）');
        return;
      }

      // 尝试获取主题数据
      let themeData = null;
      
      // 首先检查自定义主题
      const customThemes = result.customThemes;
      console.log('[Content Script] 自定义主题数据:', customThemes);
      
      if (customThemes && Array.isArray(customThemes)) {
        themeData = customThemes.find(theme => theme.id === appliedThemeId);
        console.log('[Content Script] 在自定义主题中查找结果:', themeData ? '找到' : '未找到');
      }

      // 如果没有找到自定义主题，检查预制主题
      if (!themeData) {
        console.log('[Content Script] 在预制主题中查找，预制主题数量:', PRESET_THEMES.length);
        themeData = PRESET_THEMES.find(theme => theme.id === appliedThemeId);
        console.log('[Content Script] 在预制主题中查找结果:', themeData ? '找到' : '未找到');
      }

      // 如果仍然没有找到主题数据
      if (!themeData) {
        console.log('[Content Script] 未找到对应的主题数据，主题ID:', appliedThemeId);
        console.log('[Content Script] 可用的预制主题ID:', PRESET_THEMES.map(t => t.id));
        return;
      }

      // 检查主题是否匹配当前URL
      const isUrlMatch = this.isThemeMatchUrl(themeData, currentUrl);
      console.log('[Content Script] URL匹配检查结果:', isUrlMatch);
      
      if (!isUrlMatch) {
        console.log('[Content Script] 主题不匹配当前URL，不应用主题');
        return;
      }

      // 应用找到的主题
      console.log('[Content Script] URL匹配成功，自动应用主题:', themeData.name);
      this.applyTheme(themeData);
      
    } catch (error) {
      console.error('[Content Script] 加载存储主题失败:', error);
      console.error('[Content Script] 错误详情:', error.message, error.stack);
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
    if (!theme.urlPatterns || !Array.isArray(theme.urlPatterns) || theme.urlPatterns.length === 0) {
      console.log('[Content Script] 主题没有配置URL模式，不匹配');
      return false;
    }

    // 检查是否有任何启用的模式匹配当前URL
    const matchResult = theme.urlPatterns.some(urlPattern => {
      if (!urlPattern.enabled) {
        return false;
      }

      const isMatch = this.matchUrlPattern(currentUrl, urlPattern.pattern, urlPattern.type || 'wildcard');
      console.log(`[Content Script] 检查模式 "${urlPattern.pattern}" (${urlPattern.type || 'wildcard'}):`, isMatch);
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
  matchUrlPattern(url, pattern, type = 'wildcard') {
    if (!url || !pattern) {
      return false;
    }

    try {
      switch (type) {
        case 'exact':
          return url === pattern;
          
        case 'regex':
          const regex = new RegExp(pattern);
          return regex.test(url);
          
        case 'wildcard':
        default:
          return this.wildcardMatch(url, pattern);
      }
    } catch (error) {
      console.warn('[Content Script] URL匹配失败:', error);
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
    if (pattern === '*') {
      return true;
    }
    
    // 将通配符模式转换为正则表达式
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
      .replace(/\*/g, '.*') // * 转换为 .*
      .replace(/\?/g, '.'); // ? 转换为 .
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(url);
  }

  /**
   * 处理URL变化事件
   * 当页面URL发生变化时，重新检查和应用主题
   * @param {string} newUrl - 新的URL地址
   */
  async handleUrlChange(newUrl) {
    try {
      console.log('[Content Script] 处理URL变化事件:', newUrl);
      
      // 清除当前应用的样式
      this.clearAllStyles();
      
      // 清除原始状态记录（因为URL变化可能导致页面内容变化）
      this.originalPageState.clear();
      
      // 重新加载并应用匹配的主题
      await this.loadAndApplyStoredTheme();
      
      // 通知页面美化应用更新插件状态（如果存在）
      this.notifyPluginStatusUpdate(newUrl);
      
    } catch (error) {
      console.error('[Content Script] 处理URL变化失败:', error);
    }
  }

  /**
   * 处理标签页激活事件
   * 当用户切换到当前标签页时，重新检查和应用主题
   * @param {string} currentUrl - 当前URL地址
   */
  async handleTabActivation(currentUrl) {
    try {
      console.log('[Content Script] 处理标签页激活事件:', currentUrl);
      
      // 检查当前是否有应用的主题
      const hasAppliedStyles = this.appliedStyles.size > 0;
      
      if (!hasAppliedStyles) {
        // 如果没有应用的样式，重新加载并应用主题
        console.log('[Content Script] 标签页激活时未检测到应用的样式，重新加载主题');
        await this.loadAndApplyStoredTheme();
      } else {
        console.log('[Content Script] 标签页激活时检测到已有应用的样式，保持当前状态');
      }
      
      // 通知页面美化应用更新插件状态（如果存在）
      this.notifyPluginStatusUpdate(currentUrl);
      
    } catch (error) {
      console.error('[Content Script] 处理标签页激活失败:', error);
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
      const beautifyFrame = document.querySelector('iframe[src*="page-beautify.html"]');
      
      if (beautifyFrame && beautifyFrame.contentWindow) {
        // 向美化应用发送URL更新消息
        beautifyFrame.contentWindow.postMessage({
          type: 'urlChanged',
          url: currentUrl,
          timestamp: Date.now()
        }, '*');
        console.log('[Content Script] 已通知美化应用URL变化:', currentUrl);
      }
      
      // 也可以通过自定义事件通知页面
      const event = new CustomEvent('pageBeautifyUrlChanged', {
        detail: {
          url: currentUrl,
          hasAppliedStyles: this.appliedStyles.size > 0,
          timestamp: Date.now()
        }
      });
      document.dispatchEvent(event);
      
    } catch (error) {
      console.debug('[Content Script] 通知插件状态更新失败:', error);
    }
  }

  /**
   * 清除所有应用的样式
   */
  clearAllStyles() {
    try {
      console.log('[Content Script] 清除所有应用的样式');
      
      // 重置所有样式到原始状态
      this.resetAllStyles();
      
      // 清除预览样式
      this.clearAllPreview();
      
      console.log('[Content Script] 所有样式已清除');
      
    } catch (error) {
      console.error('[Content Script] 清除样式失败:', error);
    }
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
          // 统一使用data字段，保持向后兼容
          const themeData = request.data || request.theme;
          
          // 检查主题是否匹配当前URL
          const currentUrl = window.location.href;
          const isUrlMatch = this.isThemeMatchUrl(themeData, currentUrl);
          console.log('[Content Script] APPLY_THEME URL匹配检查结果:', isUrlMatch, '当前URL:', currentUrl);
          
          if (isUrlMatch) {
            this.applyTheme(themeData);
            console.log('[Content Script] 主题已应用:', themeData.name || '未命名主题');
            sendResponse({ success: true });
          } else {
            console.log('[Content Script] 主题不匹配当前URL，不应用主题');
            // 清除现有样式，因为当前页面不应该有这个主题的样式
            this.resetAllStyles();
            sendResponse({ success: false, reason: 'URL不匹配' });
          }
          break;

        case "RESET_STYLES":
        case "CLEAR_STYLES":
          this.resetAllStyles();
          sendResponse({ success: true });
          break;

        case "CHECK_NAVBAR_ELEMENTS":
          const result = this.checkNavbarElements();
          sendResponse({ success: true, data: result });
          break;

        case "CLEAR_SELECTOR_HIGHLIGHT":
          this.clearSelectorHighlight();
          sendResponse({ success: true, data: { message: '高亮已清除' } });
          break;

        case "PREVIEW_STYLE":
          this.previewStyle(request.data.selector, request.data.property, request.data.value);
          sendResponse({ success: true });
          break;

        case "CLEAR_PREVIEW_PROPERTY":
          this.clearPreviewProperty(request.data.selector, request.data.property);
          sendResponse({ success: true });
          break;

        case "CLEAR_ALL_PREVIEW":
          this.clearAllPreview();
          sendResponse({ success: true });
          break;

        case "VALIDATE_SELECTOR":
          const selectorValidation = this.validateSelectorAndCount(request.data.selector);
          sendResponse({ success: true, elementCount: selectorValidation.count, isValid: selectorValidation.isValid });
          break;

        case "HIGHLIGHT_ELEMENTS":
          this.highlightElements(request.data.selector);
          sendResponse({ success: true });
          break;

        case "REMOVE_HIGHLIGHT":
          this.removeHighlight();
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
            let originalValue = '';
            
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

      console.log(`已应用规则 [${groupId}]: ${rule.selector}`);
    } catch (error) {
      console.error("应用CSS规则失败:", error, rule);
    }
  }

  /**
   * 重置所有应用的样式
   */
  resetAllStyles() {
    console.log('[Content Script] 开始重置所有样式到原始状态');
    
    // 首先清除所有内联样式
    this.appliedStyles.forEach((elementStyles, element) => {
      elementStyles.forEach((originalValue, property) => {
        element.style.removeProperty(property);
      });
    });
    
    // 然后恢复到真正的原始状态（如果有记录的话）
    if (this.originalPageState.size > 0) {
      console.log('[Content Script] 使用记录的原始页面状态进行恢复');
      
      this.originalPageState.forEach((elementStyles, element) => {
        // 检查元素是否还在DOM中
        if (document.contains(element)) {
          elementStyles.forEach((originalValue, property) => {
            if (originalValue && originalValue !== 'initial' && originalValue !== 'inherit') {
              element.style.setProperty(property, originalValue);
            }
          });
        }
      });
      
      console.log('[Content Script] 已恢复到页面原始状态');
    } else {
      console.log('[Content Script] 没有记录的原始状态，仅清除了内联样式');
    }

    this.appliedStyles.clear();
    console.log('[Content Script] 所有样式已重置');
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
    elements.forEach(element => {
      // 保存原始样式
       const originalOutline = element.style.outline;
       const originalOutlineOffset = element.style.outlineOffset;
       const originalBoxShadow = element.style.boxShadow;
       const originalPosition = element.style.position;
       const originalZIndex = element.style.zIndex;
       
       // 添加高亮样式
        element.style.outline = '3px dashed #3b82f6';
        element.style.outlineOffset = '3px';
        element.style.transition = 'outline 0.3s ease, box-shadow 0.3s ease';
        element.style.boxShadow = '0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)';
        element.style.position = 'relative';
        element.style.zIndex = '9999';
       
       // 标记为已高亮的元素
       element.setAttribute('data-page-beautify-highlighted', 'true');
       element.setAttribute('data-original-outline', originalOutline);
       element.setAttribute('data-original-outline-offset', originalOutlineOffset);
       element.setAttribute('data-original-box-shadow', originalBoxShadow);
       element.setAttribute('data-original-position', originalPosition);
       element.setAttribute('data-original-z-index', originalZIndex);
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
        console.warn('未找到匹配的元素:', selector);
        return;
      }

      // 初始化选择器的预览样式映射
      if (!this.previewStyles.has(selector)) {
        this.previewStyles.set(selector, new Map());
      }
      
      const selectorPreview = this.previewStyles.get(selector);
      
      elements.forEach(element => {
        // 如果是第一次预览这个属性，保存原始值
        if (!selectorPreview.has(property)) {
          const originalValue = element.style[property] || '';
          selectorPreview.set(property, originalValue);
        }
        
        // 应用预览样式
        element.style[property] = value;
      });
      
      console.log(`预览样式应用成功: ${selector} { ${property}: ${value} }`);
    } catch (error) {
      console.error('预览样式失败:', error);
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
      
      elements.forEach(element => {
        element.style[property] = originalValue;
      });
      
      // 移除预览记录
      selectorPreview.delete(property);
      
      // 如果该选择器没有其他预览属性，移除整个选择器记录
      if (selectorPreview.size === 0) {
        this.previewStyles.delete(selector);
      }
      
      console.log(`清除预览属性: ${selector} { ${property} }`);
    } catch (error) {
      console.error('清除预览属性失败:', error);
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
          elements.forEach(element => {
            element.style[property] = originalValue;
          });
        });
      });
      
      // 清空预览样式映射
      this.previewStyles.clear();
      
      console.log('已清除所有预览效果');
    } catch (error) {
      console.error('清除所有预览失败:', error);
    }
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
        count: elements.length
      };
    } catch (error) {
      console.error('选择器验证失败:', error);
      return {
        isValid: false,
        count: 0
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
        element.setAttribute('data-original-position', currentPosition);
        
        // 如果是静态定位，临时设置为相对定位
        let needsPositionFix = false;
        if (currentPosition === 'static') {
          element.style.position = 'relative';
          needsPositionFix = true;
          element.setAttribute('data-needs-position-fix', 'true');
        }
        
        // 创建绝对定位的虚框元素
        const highlight = document.createElement('div');
        highlight.className = 'page-beautify-highlight';
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
        element.classList.add('page-beautify-highlighted');
      });
      
      console.log(`已高亮 ${elements.length} 个元素`);
    } catch (error) {
      console.error('高亮元素失败:', error);
    }
  }

  /**
   * 移除所有高亮效果
   */
  removeHighlight() {
    try {
      // 移除所有高亮虚框元素
      const highlights = document.querySelectorAll('.page-beautify-highlight');
      highlights.forEach(highlight => {
        highlight.remove();
      });
      
      // 恢复被高亮元素的原始状态
      const highlightedElements = document.querySelectorAll('.page-beautify-highlighted');
      highlightedElements.forEach(element => {
        // 恢复原始定位属性
        const originalPosition = element.getAttribute('data-original-position');
        const needsPositionFix = element.getAttribute('data-needs-position-fix');
        
        if (needsPositionFix === 'true' && originalPosition) {
          // 恢复为原始的静态定位
          element.style.position = originalPosition;
        }
        
        // 清理标记属性
        element.removeAttribute('data-original-position');
        element.removeAttribute('data-needs-position-fix');
        element.classList.remove('page-beautify-highlighted');
      });
      
      // 移除旧版本的高亮元素（向后兼容）
      const oldHighlightedElements = document.querySelectorAll('[data-original-box-shadow], [data-original-outline]');
      oldHighlightedElements.forEach(element => {
        // 恢复原始样式
        const originalBoxShadow = element.getAttribute('data-original-box-shadow');
        const originalOutline = element.getAttribute('data-original-outline');
        const originalPosition = element.getAttribute('data-original-position');
        
        if (originalBoxShadow !== null) {
          element.style.boxShadow = originalBoxShadow || '';
        }
        if (originalOutline !== null) {
          element.style.outline = originalOutline || '';
        }
        element.style.outlineOffset = '';
        
        // 恢复原始定位
        if (originalPosition === 'static') {
          element.style.position = '';
          element.removeAttribute('data-original-position');
        }
        
        // 移除数据属性
        element.removeAttribute('data-original-box-shadow');
        element.removeAttribute('data-original-outline');
        element.classList.remove('page-beautify-highlighted');
        
        // 移除覆盖层
        const overlays = element.querySelectorAll('.page-beautify-highlight-overlay');
        overlays.forEach(overlay => overlay.remove());
      });
    } catch (error) {
      console.error('移除高亮失败:', error);
    }
  }
}
let pageBeautifyContent = null;

function initializePageBeautify() {
  // 创建PageBeautifyContent实例
  pageBeautifyContent = new PageBeautifyContent();
  console.log('页面美化内容脚本初始化完成');
  
  // 监听来自background script的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到来自background script的消息', request);
    
    if (request.action === "pageBeautify") {
      pageBeautifyContent.handlePageBeautifyMessage(request, sendResponse);
      return true; // 保持消息通道开放
    } else if (request.action === "urlChanged") {
      // URL变化时重新检查和应用主题
      console.log('[Content Script] URL已变化，重新检查主题应用:', request.url);
      pageBeautifyContent.handleUrlChange(request.url);
    } else if (request.action === "tabActivated") {
      // 标签页激活时重新检查和应用主题
      console.log('[Content Script] 标签页已激活，重新检查主题应用:', request.url);
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

console.log("页面美化内容脚本已加载");
