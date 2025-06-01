/**
 * 应用状态管理模块
 * 提供集中的状态管理和事件通知机制
 */

import { Utils } from './utils.js';
import { PRESET_THEMES } from './constants.js';
import { storageService } from '../services/storage.js';

/**
 * 应用状态管理类
 * 管理当前主题、自定义主题、预设主题等状态
 */
export class AppState {
  constructor() {
    // 当前编辑的主题
    this.currentTheme = null;
    
    // 自定义主题列表
    this.customThemes = [];
    
    // 预设主题列表
    this.presetThemes = [...PRESET_THEMES];
    
    // 当前应用的主题ID
    this.appliedThemeId = null;
    
    // 事件监听器
    this.listeners = new Map();
    
    // 初始化状态
    this.initialize();
  }

  /**
   * 初始化应用状态
   */
  async initialize() {
    try {
      // 加载自定义主题
      await this.loadCustomThemes();
      
      // 加载应用的主题ID
      await this.loadAppliedThemeId();
      
      // 触发初始化完成事件
      this.emit('initialized', {
        customThemes: this.customThemes,
        appliedThemeId: this.appliedThemeId
      });
    } catch (error) {
      console.error('应用状态初始化失败:', error);
      Utils.showToast('应用初始化失败: ' + error.message, 'error');
    }
  }

  /**
   * 设置当前编辑的主题
   * @param {Object|null} theme - 主题数据
   */
  setCurrentTheme(theme) {
    const oldTheme = this.currentTheme;
    this.currentTheme = theme ? Utils.deepClone(theme) : null;
    
    this.emit('currentThemeChanged', {
      oldTheme,
      newTheme: this.currentTheme
    });
  }

  /**
   * 获取当前编辑的主题
   * @returns {Object|null} 当前主题
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * 加载自定义主题列表
   */
  async loadCustomThemes() {
    try {
      this.customThemes = await storageService.getCustomThemes();
      this.emit('customThemesChanged', this.customThemes);
    } catch (error) {
      console.error('加载自定义主题失败:', error);
      this.customThemes = [];
    }
  }

  /**
   * 设置自定义主题列表
   * @param {Array} themes - 自定义主题数组
   */
  setCustomThemes(themes) {
    this.customThemes = themes || [];
    this.emit('customThemesChanged', this.customThemes);
  }

  /**
   * 保存自定义主题列表
   */
  async saveCustomThemes() {
    try {
      await storageService.saveCustomThemes(this.customThemes);
      this.emit('customThemesChanged', this.customThemes);
    } catch (error) {
      console.error('保存自定义主题失败:', error);
      throw error;
    }
  }

  /**
   * 添加自定义主题
   * @param {Object} theme - 主题数据
   */
  async addCustomTheme(theme) {
    try {
      if (!Utils.validateTheme(theme)) {
        throw new Error('主题数据格式无效');
      }

      // 检查是否已存在相同ID的主题
      const existingIndex = this.customThemes.findIndex(t => t.id === theme.id);
      if (existingIndex >= 0) {
        this.customThemes[existingIndex] = Utils.deepClone(theme);
      } else {
        this.customThemes.push(Utils.deepClone(theme));
      }

      await this.saveCustomThemes();
      
      this.emit('themeAdded', theme);
    } catch (error) {
      console.error('添加自定义主题失败:', error);
      throw error;
    }
  }

  /**
   * 更新自定义主题
   * @param {Object} theme - 主题数据
   */
  async updateCustomTheme(theme) {
    try {
      if (!Utils.validateTheme(theme)) {
        throw new Error('主题数据格式无效');
      }

      // 查找要更新的主题
      const themeIndex = this.customThemes.findIndex(t => t.id === theme.id);
      if (themeIndex === -1) {
        throw new Error('主题不存在');
      }

      // 更新主题数据
      this.customThemes[themeIndex] = Utils.deepClone(theme);

      await this.saveCustomThemes();
      
      // 如果更新的是当前编辑的主题，同步更新
      if (this.currentTheme && this.currentTheme.id === theme.id) {
        this.setCurrentTheme(theme);
      }

      this.emit('themeUpdated', theme);
    } catch (error) {
      console.error('更新自定义主题失败:', error);
      throw error;
    }
  }

  /**
   * 删除自定义主题
   * @param {string} themeId - 主题ID
   */
  async removeCustomTheme(themeId) {
    try {
      const themeIndex = this.customThemes.findIndex(t => t.id === themeId);
      if (themeIndex === -1) {
        throw new Error('主题不存在');
      }

      const removedTheme = this.customThemes[themeIndex];
      this.customThemes.splice(themeIndex, 1);

      await this.saveCustomThemes();
      
      // 如果删除的是当前编辑的主题，清空当前主题
      if (this.currentTheme && this.currentTheme.id === themeId) {
        this.setCurrentTheme(null);
      }
      
      // 如果删除的是当前应用的主题，清空应用状态
      if (this.appliedThemeId === themeId) {
        await this.setAppliedThemeId(null);
      }

      this.emit('themeRemoved', removedTheme);
    } catch (error) {
      console.error('删除自定义主题失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取主题
   * @param {string} themeId - 主题ID
   * @returns {Object|null} 主题数据
   */
  getThemeById(themeId) {
    // 先在预设主题中查找
    const presetTheme = this.presetThemes.find(t => t.id === themeId);
    if (presetTheme) {
      return Utils.deepClone(presetTheme);
    }

    // 再在自定义主题中查找
    const customTheme = this.customThemes.find(t => t.id === themeId);
    if (customTheme) {
      return Utils.deepClone(customTheme);
    }

    return null;
  }

  /**
   * 获取预设主题列表
   * @returns {Array} 预设主题列表
   */
  getPresetThemes() {
    return this.presetThemes;
  }

  /**
   * 获取自定义主题列表
   * @returns {Array} 自定义主题列表
   */
  getCustomThemes() {
    return this.customThemes;
  }

  /**
   * 获取所有主题列表
   * @returns {Array} 所有主题
   */
  getAllThemes() {
    return [
      ...this.presetThemes.map(t => ({ ...t, isPreset: true })),
      ...this.customThemes.map(t => ({ ...t, isPreset: false }))
    ];
  }

  /**
   * 加载应用的主题ID
   */
  async loadAppliedThemeId() {
    try {
      this.appliedThemeId = await storageService.getAppliedThemeId();
      this.emit('appliedThemeIdChanged', this.appliedThemeId);
    } catch (error) {
      console.error('加载应用主题ID失败:', error);
      this.appliedThemeId = null;
    }
  }

  /**
   * 设置应用的主题ID
   * @param {string|null} themeId - 主题ID
   */
  async setAppliedThemeId(themeId) {
    try {
      const oldThemeId = this.appliedThemeId;
      this.appliedThemeId = themeId;
      
      await storageService.saveAppliedThemeId(themeId);
      
      this.emit('appliedThemeIdChanged', {
        oldThemeId,
        newThemeId: themeId
      });
    } catch (error) {
      console.error('设置应用主题ID失败:', error);
      throw error;
    }
  }

  /**
   * 获取应用的主题ID
   * @returns {string|null} 应用的主题ID
   */
  getAppliedThemeId() {
    return this.appliedThemeId;
  }

  /**
   * 获取应用的主题
   * @returns {Object|null} 应用的主题数据
   */
  getAppliedTheme() {
    if (!this.appliedThemeId) {
      return null;
    }
    return this.getThemeById(this.appliedThemeId);
  }

  /**
   * 检查主题是否为当前应用的主题
   * @param {string} themeId - 主题ID
   * @returns {boolean} 是否为当前应用的主题
   */
  isThemeApplied(themeId) {
    return this.appliedThemeId === themeId;
  }

  /**
   * 检查主题名称是否已存在
   * @param {string} name - 主题名称
   * @param {string} excludeId - 排除的主题ID（用于编辑时检查）
   * @returns {boolean} 是否已存在
   */
  isThemeNameExists(name, excludeId = null) {
    const allThemes = this.getAllThemes();
    return allThemes.some(theme => 
      theme.name === name && theme.id !== excludeId
    );
  }

  /**
   * 生成唯一的主题名称
   * @param {string} baseName - 基础名称
   * @returns {string} 唯一名称
   */
  generateUniqueThemeName(baseName) {
    let name = baseName;
    let counter = 1;
    
    while (this.isThemeNameExists(name)) {
      name = `${baseName} (${counter})`;
      counter++;
    }
    
    return name;
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (!this.listeners.has(event)) {
      return;
    }
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      return;
    }
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`事件处理器执行失败 (${event}):`, error);
      }
    });
  }

  /**
   * 获取状态快照
   * @returns {Object} 状态快照
   */
  getSnapshot() {
    return {
      currentTheme: this.currentTheme ? Utils.deepClone(this.currentTheme) : null,
      customThemes: this.customThemes.map(t => Utils.deepClone(t)),
      presetThemes: this.presetThemes.map(t => Utils.deepClone(t)),
      appliedThemeId: this.appliedThemeId
    };
  }

  /**
   * 重置状态
   */
  reset() {
    this.currentTheme = null;
    this.customThemes = [];
    this.appliedThemeId = null;
    
    this.emit('reset');
  }
}