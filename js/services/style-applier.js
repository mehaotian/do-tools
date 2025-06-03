/**
 * 样式应用器模块
 * 负责将主题样式应用到页面上，管理样式的注入和清除
 */

import { Utils } from '../core/utils.js';
import { APP_CONFIG } from '../core/constants.js';
import { chromeApi } from './chrome-api.js';

/**
 * 样式应用器类
 * 管理主题样式的应用和清除
 */
export class StyleApplier {
  constructor() {
    // 当前应用的样式ID
    this.currentStyleId = null;
    
    // 样式缓存
    this.styleCache = new Map();
    
    // 应用状态
    this.isApplying = false;
    
    // 错误重试配置
    this.retryConfig = {
      maxRetries: APP_CONFIG.RETRY.MAX_RETRIES,
      retryDelay: APP_CONFIG.RETRY.RETRY_DELAY
    };
  }

  /**
   * 应用主题样式
   * @param {Object} theme - 主题对象
   * @returns {Promise<boolean>} 应用是否成功
   */
  async applyTheme(theme) {
    if (!theme) {
      console.warn('主题对象为空，无法应用');
      return false;
    }

    // 防止重复应用
    if (this.isApplying) {
      return false;
    }

    this.isApplying = true;

    try {
      // 生成样式CSS
      const css = this.generateThemeCSS(theme);
      
      if (!css.trim()) {
        await this.clearStyles();
        return true;
      }

      // 应用样式
      const success = await this.applyCSS(css, theme.id);
      
      if (success) {
        this.currentStyleId = theme.id;
        // 缓存样式
        this.styleCache.set(theme.id, css);
      } else {
        console.error('主题应用失败:', theme.name || theme.id);
      }

      return success;
    } catch (error) {
      console.error('应用主题时发生错误:', error);
      Utils.showToast('应用主题失败，请重试', 'error');
      return false;
    } finally {
      this.isApplying = false;
    }
  }

  /**
   * 生成主题CSS代码
   * @param {Object} theme - 主题对象
   * @returns {string} CSS代码
   */
  generateThemeCSS(theme) {
    if (!theme || !theme.groups || !Array.isArray(theme.groups)) {
      return '';
    }

    const cssRules = [];
    
    theme.groups.forEach(group => {
      if (!group.rules || !Array.isArray(group.rules)) {
        return;
      }

      group.rules.forEach(rule => {
        if (!rule.selector || !rule.properties) {
          return;
        }

        // 验证选择器
        if (!this.isValidSelector(rule.selector)) {
          console.warn('无效的CSS选择器:', rule.selector);
          return;
        }

        // 生成CSS属性
        const properties = this.generateCSSProperties(rule.properties);
        if (properties.trim()) {
          cssRules.push(`${rule.selector} {\n${properties}\n}`);
        }
      });
    });

    return cssRules.join('\n\n');
  }

  /**
   * 生成CSS属性字符串
   * @param {Object} properties - CSS属性对象
   * @returns {string} CSS属性字符串
   */
  generateCSSProperties(properties) {
    if (!properties || typeof properties !== 'object') {
      return '';
    }

    const cssProps = [];
    
    Object.entries(properties).forEach(([prop, value]) => {
      if (this.isValidCSSProperty(prop, value)) {
        // 确保属性名使用kebab-case
        const kebabProp = this.toKebabCase(prop);
        cssProps.push(`  ${kebabProp}: ${value};`);
      }
    });

    return cssProps.join('\n');
  }

  /**
   * 验证CSS选择器
   * @param {string} selector - CSS选择器
   * @returns {boolean} 是否有效
   */
  isValidSelector(selector) {
    if (!selector || typeof selector !== 'string') {
      return false;
    }

    try {
      // 使用document.querySelector验证选择器语法
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
    if (!property || !value || typeof property !== 'string' || typeof value !== 'string') {
      return false;
    }

    // 基本验证：属性名不能包含特殊字符，值不能为空
    const propertyRegex = /^[a-zA-Z-]+$/;
    return propertyRegex.test(property) && value.trim().length > 0;
  }

  /**
   * 将驼峰命名转换为kebab-case
   * @param {string} str - 驼峰命名字符串
   * @returns {string} kebab-case字符串
   */
  toKebabCase(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * 应用CSS到页面
   * @param {string} css - CSS代码
   * @param {string} styleId - 样式ID
   * @returns {Promise<boolean>} 应用是否成功
   */
  async applyCSS(css, styleId) {
    let retries = 0;
    
    while (retries < this.retryConfig.maxRetries) {
      try {
        const result = await chromeApi.applyStyles(css, styleId);
        
        if (result && result.success) {
          return true;
        } else {
          console.warn(`应用CSS失败 (尝试 ${retries + 1}/${this.retryConfig.maxRetries}):`, result?.error);
        }
      } catch (error) {
        console.warn(`应用CSS时发生错误 (尝试 ${retries + 1}/${this.retryConfig.maxRetries}):`, error);
      }
      
      retries++;
      
      if (retries < this.retryConfig.maxRetries) {
        await Utils.delay(this.retryConfig.retryDelay * retries);
      }
    }
    
    return false;
  }

  /**
   * 清除所有样式
   * @returns {Promise<boolean>} 清除是否成功
   */
  async clearStyles() {
    try {
      const result = await chromeApi.clearStyles();
      
      if (result && result.success) {
        this.currentStyleId = null;
        this.styleCache.clear();
        return true;
      } else {
        console.warn('清除样式失败:', result?.error);
        return false;
      }
    } catch (error) {
      console.error('清除样式时发生错误:', error);
      return false;
    }
  }

  /**
   * 预览样式效果
   * @param {string} selector - CSS选择器
   * @param {string} property - CSS属性名
   * @param {string} value - CSS属性值
   * @returns {Promise<boolean>} 预览是否成功
   */
  async previewStyle(selector, property, value) {
    if (!this.isValidSelector(selector) || !this.isValidCSSProperty(property, value)) {
      return false;
    }

    try {
      const result = await chromeApi.previewStyle(selector, property, value);
      return result && result.success;
    } catch (error) {
      console.warn('预览样式失败:', error);
      return false;
    }
  }

  /**
   * 清除预览效果
   * @returns {Promise<boolean>} 清除是否成功
   */
  async clearPreview() {
    try {
      const result = await chromeApi.clearAllPreview();
      return result && result.success;
    } catch (error) {
      console.warn('清除预览失败:', error);
      return false;
    }
  }

  /**
   * 获取当前应用的样式ID
   * @returns {string|null} 当前样式ID
   */
  getCurrentStyleId() {
    return this.currentStyleId;
  }

  /**
   * 检查是否有样式正在应用
   * @returns {boolean} 是否正在应用
   */
  isApplyingStyles() {
    return this.isApplying;
  }

  /**
   * 获取样式缓存
   * @param {string} styleId - 样式ID
   * @returns {string|null} 缓存的CSS
   */
  getCachedStyle(styleId) {
    return this.styleCache.get(styleId) || null;
  }

  /**
   * 清除样式缓存
   * @param {string} styleId - 样式ID（可选，不传则清除所有）
   */
  clearStyleCache(styleId = null) {
    if (styleId) {
      this.styleCache.delete(styleId);
    } else {
      this.styleCache.clear();
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  getCacheStats() {
    return {
      size: this.styleCache.size,
      keys: Array.from(this.styleCache.keys())
    };
  }

  /**
   * 验证主题对象
   * @param {Object} theme - 主题对象
   * @returns {Object} 验证结果
   */
  validateTheme(theme) {
    const errors = [];
    const warnings = [];

    if (!theme) {
      errors.push('主题对象不能为空');
      return { isValid: false, errors, warnings };
    }

    if (!theme.id) {
      errors.push('主题必须有ID');
    }

    if (!theme.name) {
      warnings.push('主题没有名称');
    }

    if (!theme.groups || !Array.isArray(theme.groups)) {
      errors.push('主题必须包含groups数组');
      return { isValid: false, errors, warnings };
    }

    // 验证组和规则
    theme.groups.forEach((group, groupIndex) => {
      if (!group.id) {
        errors.push(`组 ${groupIndex} 缺少ID`);
      }

      if (!group.rules || !Array.isArray(group.rules)) {
        warnings.push(`组 ${groupIndex} 没有规则`);
        return;
      }

      group.rules.forEach((rule, ruleIndex) => {
        if (!rule.selector) {
          errors.push(`组 ${groupIndex} 规则 ${ruleIndex} 缺少选择器`);
        } else if (!this.isValidSelector(rule.selector)) {
          warnings.push(`组 ${groupIndex} 规则 ${ruleIndex} 选择器可能无效: ${rule.selector}`);
        }

        if (!rule.properties || typeof rule.properties !== 'object') {
          warnings.push(`组 ${groupIndex} 规则 ${ruleIndex} 没有CSS属性`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}