/**
 * 存储服务模块
 * 统一管理Chrome存储API的调用，提供主题数据的持久化功能
 */

import { Utils } from '../core/utils.js';
import { APP_CONFIG } from '../core/constants.js';

/**
 * 存储服务类
 * 封装Chrome存储API，提供主题数据的增删改查功能
 */
export class StorageService {
  constructor() {
    // 使用 chrome.storage.sync 确保数据同步
    this.storage = chrome?.storage?.sync || null;
    this.isAvailable = !!this.storage;
    console.log('[StorageService] 初始化，使用存储类型:', this.storage ? 'chrome.storage.sync' : '不可用');
  }

  /**
   * 检查存储服务是否可用
   * @returns {boolean} 是否可用
   */
  isStorageAvailable() {
    return this.isAvailable;
  }

  /**
   * 获取存储数据
   * @param {string|Array<string>|null} keys - 要获取的键名
   * @returns {Promise<Object>} 存储的数据
   */
  async get(keys = null) {
    if (!this.isAvailable) {
      throw new Error('Chrome存储服务不可用');
    }

    return new Promise((resolve, reject) => {
      this.storage.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * 设置存储数据
   * @param {Object} data - 要存储的数据
   * @returns {Promise<void>}
   */
  async set(data) {
    if (!this.isAvailable) {
      throw new Error('Chrome存储服务不可用');
    }

    return new Promise((resolve, reject) => {
      this.storage.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 删除存储数据
   * @param {string|Array<string>} keys - 要删除的键名
   * @returns {Promise<void>}
   */
  async remove(keys) {
    if (!this.isAvailable) {
      throw new Error('Chrome存储服务不可用');
    }

    return new Promise((resolve, reject) => {
      this.storage.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 清空所有存储数据
   * @returns {Promise<void>}
   */
  async clear() {
    if (!this.isAvailable) {
      throw new Error('Chrome存储服务不可用');
    }

    return new Promise((resolve, reject) => {
      this.storage.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 获取所有自定义主题
   * @returns {Promise<Array>} 自定义主题列表
   */
  async getCustomThemes() {
    try {
      const result = await this.get(APP_CONFIG.STORAGE_KEYS.CUSTOM_THEMES);
      const themes = result[APP_CONFIG.STORAGE_KEYS.CUSTOM_THEMES] || [];
      
      // 验证主题数据格式
      return themes.filter(theme => Utils.validateTheme(theme));
    } catch (error) {
      console.error('获取自定义主题失败:', error);
      return [];
    }
  }

  /**
   * 保存自定义主题列表
   * @param {Array} themes - 主题列表
   * @returns {Promise<void>}
   */
  async saveCustomThemes(themes) {
    try {
      // 验证主题数据
      const validThemes = themes.filter(theme => {
        const isValid = Utils.validateTheme(theme);
        if (!isValid) {
          console.warn('无效的主题数据:', theme);
        }
        return isValid;
      });

      await this.set({
        [APP_CONFIG.STORAGE_KEYS.CUSTOM_THEMES]: validThemes
      });
    } catch (error) {
      console.error('保存自定义主题失败:', error);
      throw new Error('保存主题失败: ' + error.message);
    }
  }

  /**
   * 添加自定义主题
   * @param {Object} theme - 主题数据
   * @returns {Promise<void>}
   */
  async addCustomTheme(theme) {
    try {
      if (!Utils.validateTheme(theme)) {
        throw new Error('主题数据格式无效');
      }

      const themes = await this.getCustomThemes();
      
      // 检查是否已存在相同ID的主题
      const existingIndex = themes.findIndex(t => t.id === theme.id);
      if (existingIndex >= 0) {
        themes[existingIndex] = theme;
      } else {
        themes.push(theme);
      }

      await this.saveCustomThemes(themes);
    } catch (error) {
      console.error('添加自定义主题失败:', error);
      throw error;
    }
  }

  /**
   * 删除自定义主题
   * @param {string} themeId - 主题ID
   * @returns {Promise<void>}
   */
  async removeCustomTheme(themeId) {
    try {
      const themes = await this.getCustomThemes();
      const filteredThemes = themes.filter(theme => theme.id !== themeId);
      
      await this.saveCustomThemes(filteredThemes);
    } catch (error) {
      console.error('删除自定义主题失败:', error);
      throw new Error('删除主题失败: ' + error.message);
    }
  }

  /**
   * 获取应用的主题ID
   * @returns {Promise<string|null>} 主题ID
   */
  async getAppliedThemeId() {
    try {
      const result = await this.get(APP_CONFIG.STORAGE_KEYS.APPLIED_THEME_ID);
      const themeId = result[APP_CONFIG.STORAGE_KEYS.APPLIED_THEME_ID] || null;
      console.log('从存储中读取到的主题ID:', themeId);
      return themeId;
    } catch (error) {
      console.error('获取应用主题ID失败:', error);
      return null;
    }
  }

  /**
   * 保存应用的主题ID
   * @param {string|null} themeId - 主题ID
   * @returns {Promise<void>}
   */
  async saveAppliedThemeId(themeId) {
    try {
      console.log('准备保存主题ID到存储:', themeId);
      if (themeId === null) {
        await this.remove(APP_CONFIG.STORAGE_KEYS.APPLIED_THEME_ID);
        console.log('已从存储中移除主题ID');
      } else {
        await this.set({
          [APP_CONFIG.STORAGE_KEYS.APPLIED_THEME_ID]: themeId
        });
        console.log('主题ID已保存到存储:', themeId);
      }
    } catch (error) {
      console.error('保存应用主题ID失败:', error);
      throw new Error('保存主题状态失败: ' + error.message);
    }
  }

  /**
   * 获取存储使用情况
   * @returns {Promise<Object>} 存储使用情况
   */
  async getStorageUsage() {
    if (!this.isAvailable) {
      return { used: 0, total: 0, percentage: 0 };
    }

    try {
      return new Promise((resolve, reject) => {
        this.storage.getBytesInUse(null, (bytesInUse) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            // Chrome sync storage 限制为 100KB
            const total = 102400; // 100KB
            const percentage = (bytesInUse / total) * 100;
            
            resolve({
              used: bytesInUse,
              total: total,
              percentage: Math.round(percentage * 100) / 100,
              formattedUsed: Utils.formatFileSize(bytesInUse),
              formattedTotal: Utils.formatFileSize(total)
            });
          }
        });
      });
    } catch (error) {
      console.error('获取存储使用情况失败:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * 导出所有数据
   * @returns {Promise<Object>} 所有存储的数据
   */
  async exportAllData() {
    try {
      const allData = await this.get(null);
      return {
        exportTime: new Date().toISOString(),
        version: '1.0',
        data: allData
      };
    } catch (error) {
      console.error('导出数据失败:', error);
      throw new Error('导出数据失败: ' + error.message);
    }
  }

  /**
   * 导入数据
   * @param {Object} importData - 要导入的数据
   * @param {boolean} merge - 是否合并现有数据
   * @returns {Promise<void>}
   */
  async importData(importData, merge = true) {
    try {
      if (!importData || !importData.data) {
        throw new Error('导入数据格式无效');
      }

      if (merge) {
        // 合并模式：只导入自定义主题
        const customThemes = importData.data[APP_CONFIG.STORAGE_KEYS.CUSTOM_THEMES];
        if (customThemes && Array.isArray(customThemes)) {
          const existingThemes = await this.getCustomThemes();
          const mergedThemes = [...existingThemes];
          
          // 合并主题，相同ID的会被覆盖
          customThemes.forEach(importTheme => {
            if (Utils.validateTheme(importTheme)) {
              const existingIndex = mergedThemes.findIndex(t => t.id === importTheme.id);
              if (existingIndex >= 0) {
                mergedThemes[existingIndex] = importTheme;
              } else {
                mergedThemes.push(importTheme);
              }
            }
          });
          
          await this.saveCustomThemes(mergedThemes);
        }
      } else {
        // 覆盖模式：清空现有数据后导入
        await this.clear();
        await this.set(importData.data);
      }
    } catch (error) {
      console.error('导入数据失败:', error);
      throw new Error('导入数据失败: ' + error.message);
    }
  }

  /**
   * 监听存储变化
   * @param {Function} callback - 变化回调函数
   */
  onChanged(callback) {
    if (!this.isAvailable) {
      console.warn('Chrome存储服务不可用，无法监听变化');
      return;
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        callback(changes);
      }
    });
  }
}

// 创建单例实例
export const storageService = new StorageService();