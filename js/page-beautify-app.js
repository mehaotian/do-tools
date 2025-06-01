/**
 * 页面美化应用主入口
 * 整合所有模块，提供统一的应用管理
 */

import { AppState } from './core/app-state.js';
import { Utils } from './core/utils.js';
import { APP_CONFIG } from './core/constants.js';
import { storageService } from './services/storage.js';
import { chromeApi } from './services/chrome-api.js';
import { StyleApplier } from './services/style-applier.js';
import { ThemeManager } from './managers/theme-manager.js';
import { ModalManager } from './managers/modal-manager.js';

/**
 * 页面美化应用主类
 * 负责应用的初始化、模块协调和生命周期管理
 */
class PageBeautifyApp {
  constructor() {
    // 应用状态
    this.isInitialized = false;
    this.isExtensionEnvironment = false;
    
    // 核心服务
    this.appState = null;
    this.storageService = null;
    this.styleApplier = null;
    
    // 管理器
    this.themeManager = null;
    this.modalManager = null;
    
    // 错误处理
    this.errorHandler = this.createErrorHandler();
    
    // 绑定方法上下文
    this.handleUnload = this.handleUnload.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleStorageChange = this.handleStorageChange.bind(this);
  }

  /**
   * 初始化应用
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('应用已经初始化');
      return true;
    }

    try {
      console.log('开始初始化页面美化应用...');
      
      // 检查运行环境
      await this.checkEnvironment();
      
      // 初始化核心服务
      await this.initializeServices();
      
      // 初始化管理器
      await this.initializeManagers();
      
      // 设置事件监听
      this.setupEventListeners();
      
      // 设置UI事件绑定
      this.setupUIEvents();
      
      // 设置全局引用
      this.setupGlobalReferences();
      
      // 恢复应用状态
      await this.restoreApplicationState();
      
      this.isInitialized = true;
      console.log('页面美化应用初始化完成');
      
      // 显示初始化成功提示
      Utils.showToast('页面美化工具已就绪', 'success');
      
      return true;
    } catch (error) {
      console.error('应用初始化失败:', error);
      this.handleInitializationError(error);
      return false;
    }
  }

  /**
   * 检查运行环境
   */
  async checkEnvironment() {
    // 检查是否在Chrome扩展环境中
    this.isExtensionEnvironment = !!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
    
    if (!this.isExtensionEnvironment) {
      console.warn('不在Chrome扩展环境中运行，某些功能可能受限');
    }
    
    // 检查必要的DOM元素
    const requiredElements = [
      'presetThemes',
      'customThemesList',
      'addGroupModal',
      'addRuleModal',
      'propertySelectModal'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
      throw new Error(`缺少必要的DOM元素: ${missingElements.join(', ')}`);
    }
    
    console.log('环境检查通过');
  }

  /**
   * 初始化核心服务
   */
  async initializeServices() {
    console.log('初始化核心服务...');
    
    // 初始化应用状态
    this.appState = new AppState();
    await this.appState.initialize();
    
    // 初始化存储服务
    this.storageService = storageService;
    
    // 初始化样式应用器
    this.styleApplier = new StyleApplier();
    
    console.log('核心服务初始化完成');
  }

  /**
   * 初始化管理器
   */
  async initializeManagers() {
    console.log('初始化管理器...');
    
    // 初始化主题管理器
    this.themeManager = new ThemeManager(this.appState);
    await this.themeManager.initialize();
    
    // 初始化模态框管理器
    this.modalManager = new ModalManager();
    
    console.log('管理器初始化完成');
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    console.log('设置事件监听...');
    
    // 页面卸载事件
    window.addEventListener('beforeunload', this.handleUnload);
    window.addEventListener('unload', this.handleUnload);
    
    // 页面可见性变化事件
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // 存储变化事件（如果在扩展环境中）
    if (this.isExtensionEnvironment && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(this.handleStorageChange);
    }
    
    // 全局错误处理
    window.addEventListener('error', this.errorHandler);
    window.addEventListener('unhandledrejection', this.errorHandler);
    
    // 应用状态变化事件
    this.setupAppStateListeners();
    
    console.log('事件监听设置完成');
  }

  /**
   * 设置应用状态监听
   */
  setupAppStateListeners() {
    if (!this.appState) return;
    
    // 监听主题变化
    document.addEventListener('themeChanged', (event) => {
      console.log('主题已变化:', event.detail);
    });
    
    // 监听自定义主题变化
    document.addEventListener('customThemesChanged', (event) => {
      console.log('自定义主题已变化:', event.detail);
      // 自动保存到存储
      this.saveCustomThemes(event.detail.customThemes);
    });
    
    // 监听应用主题ID变化
    document.addEventListener('appliedThemeIdChanged', (event) => {
      console.log('应用主题ID已变化:', event.detail);
      // 自动保存到存储
      this.saveAppliedThemeId(event.detail.appliedThemeId);
    });
  }

  /**
   * 设置UI事件绑定
   */
  setupUIEvents() {
    console.log('设置UI事件绑定...');
    
    try {
      // 新建主题按钮
      const newThemeBtn = document.getElementById('newThemeBtn');
      if (newThemeBtn) {
        newThemeBtn.addEventListener('click', async () => {
          await this.themeManager.createNewTheme();
        });
      }
      
      // 导入主题按钮
      const importThemeBtn = document.getElementById('importThemeBtn');
      if (importThemeBtn) {
        importThemeBtn.addEventListener('click', () => {
          this.themeManager.importTheme();
        });
      }
      
      // 创建第一个主题按钮
      const createFirstTheme = document.getElementById('createFirstTheme');
      if (createFirstTheme) {
        createFirstTheme.addEventListener('click', async () => {
          await this.themeManager.createNewTheme();
        });
      }
      
      // 重置预览按钮
      const resetPreviewBtn = document.getElementById('resetPreviewBtn');
      if (resetPreviewBtn) {
        resetPreviewBtn.addEventListener('click', () => {
          this.themeManager.resetPreview();
        });
      }
      
      // 导出主题按钮
      const exportThemeBtn = document.getElementById('exportThemeBtn');
      if (exportThemeBtn) {
        exportThemeBtn.addEventListener('click', () => {
          this.themeManager.exportCurrentTheme();
        });
      }
      
      // 保存主题按钮
      const saveThemeBtn = document.getElementById('saveThemeBtn');
      if (saveThemeBtn) {
        saveThemeBtn.addEventListener('click', () => {
          this.themeManager.saveCurrentTheme();
        });
      }
      
      // 另存为按钮
      const saveAsThemeBtn = document.getElementById('saveAsThemeBtn');
      if (saveAsThemeBtn) {
        saveAsThemeBtn.addEventListener('click', () => {
          this.themeManager.saveAsNewTheme();
        });
      }
      
      // 添加组按钮
      const addGroupBtn = document.getElementById('addGroupBtn');
      if (addGroupBtn) {
        addGroupBtn.addEventListener('click', () => {
          this.modalManager.showAddGroupModal();
        });
      }
      
      // 模态框关闭按钮
      this.setupModalEvents();
      
      console.log('UI事件绑定完成');
    } catch (error) {
      console.error('UI事件绑定失败:', error);
    }
  }
  
  /**
   * 设置模态框事件
   */
  setupModalEvents() {
    // 添加组模态框
    const closeAddGroupModal = document.getElementById('closeAddGroupModal');
    if (closeAddGroupModal) {
      closeAddGroupModal.addEventListener('click', () => {
        this.modalManager.hideAddGroupModal();
      });
    }
    
    // confirmAddGroup按钮的事件已在modal-manager.js中绑定，避免重复绑定
    
    // 添加规则模态框
    const closeAddRuleModal = document.getElementById('closeAddRuleModal');
    if (closeAddRuleModal) {
      closeAddRuleModal.addEventListener('click', () => {
        this.modalManager.hideAddRuleModal();
      });
    }
    
    // confirmAddRule按钮的事件已在modal-manager.js中绑定，避免重复绑定
  }

  /**
   * 设置全局引用
   */
  setupGlobalReferences() {
    // 设置全局引用，方便其他模块访问
    window.appState = this.appState;
    window.themeManager = this.themeManager;
    window.modalManager = this.modalManager;
    window.styleApplier = this.styleApplier;
    window.pageBeautifyApp = this;
    
    console.log('全局引用设置完成');
  }

  /**
   * 恢复应用状态
   */
  async restoreApplicationState() {
    console.log('恢复应用状态...');
    
    try {
      // 加载自定义主题
      const customThemes = await this.storageService.getCustomThemes();
      if (customThemes && customThemes.length > 0) {
        this.appState.setCustomThemes(customThemes);
        console.log(`已加载 ${customThemes.length} 个自定义主题`);
      }
      
      // 加载应用的主题ID
      const appliedThemeId = await this.storageService.getAppliedThemeId();
      if (appliedThemeId) {
        this.appState.setAppliedThemeId(appliedThemeId);
        console.log('已恢复应用的主题ID:', appliedThemeId);
        
        // 恢复主题应用
        await this.themeManager.restoreAppliedTheme();
      }
      
      console.log('应用状态恢复完成');
    } catch (error) {
      console.error('恢复应用状态失败:', error);
      Utils.showToast('恢复应用状态失败，将使用默认设置', 'warning');
    }
  }

  /**
   * 保存自定义主题
   * @param {Array} customThemes - 自定义主题数组
   */
  async saveCustomThemes(customThemes) {
    try {
      await this.storageService.setCustomThemes(customThemes);
    } catch (error) {
      console.error('保存自定义主题失败:', error);
    }
  }

  /**
   * 保存应用的主题ID
   * @param {string} themeId - 主题ID
   */
  async saveAppliedThemeId(themeId) {
    try {
      await this.storageService.setAppliedThemeId(themeId);
    } catch (error) {
      console.error('保存应用主题ID失败:', error);
    }
  }

  /**
   * 处理页面卸载
   */
  handleUnload() {
    console.log('页面即将卸载，清理资源...');
    
    // 清理事件监听
    window.removeEventListener('beforeunload', this.handleUnload);
    window.removeEventListener('unload', this.handleUnload);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('error', this.errorHandler);
    window.removeEventListener('unhandledrejection', this.errorHandler);
    
    // 清理存储监听
    if (this.isExtensionEnvironment && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.removeListener(this.handleStorageChange);
    }
    
    // 清理全局引用
    delete window.appState;
    delete window.themeManager;
    delete window.modalManager;
    delete window.styleApplier;
    delete window.pageBeautifyApp;
  }

  /**
   * 处理页面可见性变化
   */
  handleVisibilityChange() {
    if (document.hidden) {
      console.log('页面已隐藏');
    } else {
      console.log('页面已显示');
      // 页面重新显示时，检查是否需要重新应用主题
      this.checkAndReapplyTheme();
    }
  }

  /**
   * 处理存储变化
   * @param {Object} changes - 存储变化对象
   * @param {string} namespace - 存储命名空间
   */
  handleStorageChange(changes, namespace) {
    if (namespace !== 'sync') return;
    
    console.log('存储发生变化:', changes);
    
    // 处理自定义主题变化
    if (changes.customThemes) {
      const newCustomThemes = changes.customThemes.newValue || [];
      this.appState.setCustomThemes(newCustomThemes);
      console.log('已同步自定义主题变化');
    }
    
    // 处理应用主题ID变化
    if (changes.appliedThemeId) {
      const newAppliedThemeId = changes.appliedThemeId.newValue;
      this.appState.setAppliedThemeId(newAppliedThemeId);
      console.log('已同步应用主题ID变化');
    }
  }

  /**
   * 检查并重新应用主题
   */
  async checkAndReapplyTheme() {
    const appliedThemeId = this.appState.getAppliedThemeId();
    if (appliedThemeId && this.themeManager) {
      try {
        await this.themeManager.restoreAppliedTheme();
        console.log('已重新应用主题');
      } catch (error) {
        console.error('重新应用主题失败:', error);
      }
    }
  }

  /**
   * 创建错误处理器
   * @returns {Function} 错误处理函数
   */
  createErrorHandler() {
    return (event) => {
      let error;
      let message;
      
      if (event.type === 'unhandledrejection') {
        error = event.reason;
        message = `未处理的Promise拒绝: ${error}`;
      } else {
        error = event.error || event;
        message = `未捕获的错误: ${error.message || error}`;
      }
      
      console.error(message, error);
      
      // 显示用户友好的错误提示
      if (this.isInitialized) {
        Utils.showToast('发生了一个错误，请刷新页面重试', 'error');
      }
    };
  }

  /**
   * 处理初始化错误
   * @param {Error} error - 错误对象
   */
  handleInitializationError(error) {
    const errorMessage = error.message || '未知错误';
    
    // 显示错误信息
    const container = document.getElementById('beautifyContainer');
    if (container) {
      container.innerHTML = `
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h3>初始化失败</h3>
          <p>页面美化工具初始化失败：${errorMessage}</p>
          <button onclick="location.reload()" class="retry-btn">重新加载</button>
        </div>
      `;
    }
    
    console.error('应用初始化失败，详细错误:', error);
  }

  /**
   * 获取应用信息
   * @returns {Object} 应用信息
   */
  getAppInfo() {
    return {
      version: APP_CONFIG.VERSION,
      isInitialized: this.isInitialized,
      isExtensionEnvironment: this.isExtensionEnvironment,
      modules: {
        appState: !!this.appState,
        storageService: !!this.storageService,
        styleApplier: !!this.styleApplier,
        themeManager: !!this.themeManager,
        modalManager: !!this.modalManager
      }
    };
  }

  /**
   * 重置应用
   * @returns {Promise<boolean>} 重置是否成功
   */
  async resetApp() {
    try {
      console.log('开始重置应用...');
      
      // 清除所有样式
      if (this.styleApplier) {
        await this.styleApplier.clearStyles();
      }
      
      // 清除存储数据
      if (this.storageService) {
        await this.storageService.clear();
      }
      
      // 重置应用状态
      if (this.appState) {
        this.appState.reset();
      }
      
      // 重新渲染界面
      if (this.themeManager) {
        this.themeManager.renderPresetThemes();
        this.themeManager.renderCustomThemes();
      }
      
      Utils.showToast('应用已重置', 'success');
      console.log('应用重置完成');
      
      return true;
    } catch (error) {
      console.error('重置应用失败:', error);
      Utils.showToast('重置失败，请刷新页面重试', 'error');
      return false;
    }
  }
}

// 创建应用实例
const app = new PageBeautifyApp();

// DOM加载完成后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.initialize();
  });
} else {
  // DOM已经加载完成
  app.initialize();
}

// 导出应用实例
export default app;