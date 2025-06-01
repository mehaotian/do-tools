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
    this.init();
  }

  async init() {
    console.log("页面美化内容脚本初始化完成");
    
    // 自动加载并应用保存的主题
    await this.loadAndApplyStoredTheme();
  }

  /**
   * 加载并应用存储的主题
   */
  async loadAndApplyStoredTheme() {
    try {
      console.log('[Content Script] 开始加载存储的主题');
      
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

      // 应用找到的主题
      console.log('[Content Script] 自动应用主题:', themeData.name);
      this.applyTheme(themeData);
      
    } catch (error) {
      console.error('[Content Script] 加载存储主题失败:', error);
      console.error('[Content Script] 错误详情:', error.message, error.stack);
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
          this.applyTheme(themeData);
          sendResponse({ success: true });
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
  clearSelectorHighlight() {
     const highlightedElements = document.querySelectorAll('[data-page-beautify-highlighted="true"]');
     highlightedElements.forEach(element => {
       // 恢复原始样式
       const originalOutline = element.getAttribute('data-original-outline');
       const originalOutlineOffset = element.getAttribute('data-original-outline-offset');
       const originalBoxShadow = element.getAttribute('data-original-box-shadow');
       const originalPosition = element.getAttribute('data-original-position');
       const originalZIndex = element.getAttribute('data-original-z-index');
       
       element.style.outline = originalOutline || '';
       element.style.outlineOffset = originalOutlineOffset || '';
       element.style.boxShadow = originalBoxShadow || '';
       element.style.position = originalPosition || '';
       element.style.zIndex = originalZIndex || '';
       
       // 移除标记属性
       element.removeAttribute('data-page-beautify-highlighted');
       element.removeAttribute('data-original-outline');
       element.removeAttribute('data-original-outline-offset');
       element.removeAttribute('data-original-box-shadow');
       element.removeAttribute('data-original-position');
       element.removeAttribute('data-original-z-index');
     });
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
