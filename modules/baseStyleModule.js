/**
 * 基础样式模块
 * 所有样式模块都应该继承此类
 */

/**
 * 基础样式模块类
 * 所有样式模块都应该继承此类
 */
class BaseStyleModule {
  constructor(moduleId, selectors = []) {
    this.moduleId = moduleId;
    this.selectors = selectors;
    this.isApplied = false;
  }

  /**
   * 获取目标元素
   * @returns {Array<HTMLElement>} 目标元素数组
   */
  getTargetElements() {
    const elements = [];
    
    this.selectors.forEach(selector => {
      try {
        const found = document.querySelectorAll(selector);
        elements.push(...Array.from(found));
      } catch (error) {
        console.warn(`选择器 "${selector}" 无效:`, error);
      }
    });
    
    // 去重
    return [...new Set(elements)];
  }

  /**
   * 获取需要备份的样式属性
   * 子类应该重写此方法
   * @returns {Array<string>} 样式属性数组
   */
  getBackupProperties() {
    return [];
  }

  /**
   * 应用样式
   * 子类必须实现此方法
   * @param {Object} settings - 样式设置
   * @param {OriginalStyleCache} cache - 样式缓存
   */
  apply(settings, cache) {
    throw new Error('子类必须实现 apply 方法');
  }

  /**
   * 移除样式
   * 子类必须实现此方法
   * @param {OriginalStyleCache} cache - 样式缓存
   */
  remove(cache) {
    throw new Error('子类必须实现 remove 方法');
  }

  /**
   * 检查样式是否已应用
   * @returns {boolean} 是否已应用
   */
  getIsApplied() {
    return this.isApplied;
  }

  /**
   * 设置应用状态
   * @param {boolean} applied - 是否已应用
   */
  setIsApplied(applied) {
    this.isApplied = applied;
  }

  /**
   * 获取模块ID
   * @returns {string} 模块ID
   */
  getModuleId() {
    return this.moduleId;
  }

  /**
   * 获取选择器
   * @returns {Array<string>} 选择器数组
   */
  getSelectors() {
    return this.selectors;
  }

  /**
   * 添加选择器
   * @param {string|Array<string>} selectors - 选择器
   */
  addSelectors(selectors) {
    const newSelectors = Array.isArray(selectors) ? selectors : [selectors];
    this.selectors.push(...newSelectors);
  }

  /**
   * 移除选择器
   * @param {string} selector - 要移除的选择器
   */
  removeSelector(selector) {
    const index = this.selectors.indexOf(selector);
    if (index > -1) {
      this.selectors.splice(index, 1);
    }
  }

  /**
   * 清空选择器
   */
  clearSelectors() {
    this.selectors = [];
  }
}

export { BaseStyleModule };