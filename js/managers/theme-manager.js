/**
 * 主题管理器模块
 * 负责主题的创建、编辑、删除、应用等核心功能
 */

import { Utils } from '../core/utils.js';
import { chromeApi } from '../services/chrome-api.js';
import { CSS_PROPERTIES, APP_CONFIG } from '../core/constants.js';

/**
 * 主题管理器类
 * 处理主题相关的所有业务逻辑
 */
export class ThemeManager {
  constructor(appState) {
    this.appState = appState;
    this.isInitialized = false;
    
    // 主题修改状态跟踪
    this.hasUnsavedChanges = false;
    this.originalThemeData = null;
    
    // 临时状态管理
    this.isInTemporaryMode = false;
    this.temporaryThemeState = null;
    this.lastSavedAppliedThemeId = null;
    
    // 防抖和节流定时器
    this.validateSelectorTimer = null;
    this.clearHighlightTimer = null;
    this.autoValidateTimer = null;
    
    // URL输入防抖处理
    this.debouncedUpdateUrlPattern = Utils.debounce(
      this.updateUrlPatternValue.bind(this),
      APP_CONFIG.UI.DEBOUNCE_DELAY
    );
    
    // URL校验节流处理
    this.throttledValidateUrl = Utils.throttle(
      async (inputElement, value) => {
        try {
          // 获取当前URL进行验证
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const currentUrl = tabs[0]?.url;
          if (currentUrl) {
            await this.validateUrlPattern(inputElement, value, currentUrl);
          }
        } catch (error) {
          console.error('URL验证失败:', error);
        }
      },
      500
    );
    
    // 绑定页面URL变化监听
    this.setupUrlChangeListener();
    
    // 预绑定事件处理器，避免重复绑定问题
    this.boundHandleThemeChange = this.handleThemeChange.bind(this);
    
    // 模态框管理属性 - 统一使用 modalManager 管理滚动锁定
    // 移除了 openModalCount、preventScrollHandler、preventKeyScrollHandler
    // 这些功能现在由 modalManager 统一处理
    
    // 绑定事件处理器
    this.bindEvents();
  }

  /**
   * 显示确认对话框
   * @param {string} message - 确认消息
   * @param {Object} options - 配置选项
   * @returns {Promise<boolean>} 用户选择结果
   */
  async showConfirmDialog(message, options = {}) {
    return await Utils.showConfirmDialog(message, options);
  }

  /**
   * 处理删除组操作
   * @param {string} groupId - 组ID
   */
  async handleDeleteGroup(groupId) {
    // 直接调用deleteGroup，确认逻辑在deleteGroup方法中处理
    await this.deleteGroup(groupId);
  }

  /**
   * 绑定应用状态事件
   */
  bindEvents() {
    this.appState.on('initialized', () => {
      this.initialize();
    });
    
    this.appState.on('customThemesChanged', () => {
      this.renderThemes();
    });
    
    this.appState.on('appliedThemeIdChanged', () => {
      this.updateThemeSelection();
    });
  }

  /**
   * 初始化主题管理器
   */
  async initialize() {
    try {
       // 初始化模态框
      this.initializeModals();
       // 初始化主题列表
      this.renderThemes();
       // 尝试恢复上次应用的主题
      await this.restoreAppliedTheme();
      
      // 初始化URL模式事件绑定（一次性绑定）
      this.bindUrlPatternEvents();
      
      // 初始化最后保存的应用主题ID
      this.lastSavedAppliedThemeId = this.appState.getAppliedThemeId();
      

      
      this.isInitialized = true;
    } catch (error) {
      console.error('主题管理器初始化失败:', error);
      Utils.showToast('主题管理器初始化失败', 'error');
    }
  }

  /**
   * 设置页面URL变化监听器
   * 监听来自content script的URL变化通知，更新插件状态
   */
  setupUrlChangeListener() {
    try {
      // 监听自定义事件（来自content script）
      document.addEventListener('pageBeautifyUrlChanged', (event) => {
        console.log('[ThemeManager] 收到URL变化事件:', event.detail);
        this.handleUrlChangeEvent(event.detail);
      });
      
      // 监听postMessage（来自iframe通信）
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'urlChanged') {
          console.log('[ThemeManager] 收到URL变化消息:', event.data);
          this.handleUrlChangeEvent({
            url: event.data.url,
            hasAppliedStyles: event.data.hasAppliedStyles,
            timestamp: event.data.timestamp
          });
        }
      });
      
      console.log('[ThemeManager] URL变化监听器已设置');
      
    } catch (error) {
      console.error('[ThemeManager] 设置URL变化监听器失败:', error);
    }
  }

  /**
   * 处理URL变化事件
   * 当页面URL发生变化时，更新所有URL模式的验证状态
   * @param {Object} eventData - 事件数据
   * @param {string} eventData.url - 新的URL地址
   * @param {boolean} eventData.hasAppliedStyles - 是否有应用的样式
   * @param {number} eventData.timestamp - 时间戳
   */
  async handleUrlChangeEvent(eventData) {
    const { url, hasAppliedStyles, timestamp } = eventData;
    
    console.log(`[ThemeManager] 处理URL变化: ${url}`);
    
    try {
      // 获取当前选中的主题
      const currentTheme = this.appState.getCurrentTheme();
      
      if (currentTheme) {
        console.log(`[ThemeManager] 当前主题: "${currentTheme.name}"`);
        
        // 检查主题是否配置了URL规则
        if (!currentTheme.urlPatterns || currentTheme.urlPatterns.length === 0) {
          console.log(`[ThemeManager] 主题 "${currentTheme.name}" 没有配置适用网站，清除样式`);
          await chromeApi.clearStyles();
        } else {
          // 检查URL是否匹配
          const isUrlMatch = Utils.isThemeMatchUrl(currentTheme, url);
          console.log(`[ThemeManager] URL匹配检查结果: ${isUrlMatch}`);
          
          if (isUrlMatch) {
            // URL匹配，应用主题
            console.log(`[ThemeManager] URL匹配，应用主题 "${currentTheme.name}"`);
            const success = await chromeApi.applyTheme(currentTheme);
            if (success) {
              console.log(`[ThemeManager] 主题 "${currentTheme.name}" 应用成功`);
            } else {
              console.error(`[ThemeManager] 主题 "${currentTheme.name}" 应用失败`);
            }
          } else {
            // URL不匹配，清除样式
            console.log(`[ThemeManager] URL不匹配，清除样式`);
            await chromeApi.clearStyles();
          }
        }
      } else {
        console.log(`[ThemeManager] 没有选中的主题，清除样式`);
        await chromeApi.clearStyles();
      }
      
    } catch (error) {
      console.error('[ThemeManager] 处理URL变化事件失败:', error);
    }
    
    // 无论主题应用是否成功，都要更新所有URL模式输入框的验证状态显示
    try {
      await this.updateAllUrlPatternValidation(url);
    } catch (updateError) {
      console.error('[ThemeManager] 更新URL匹配状态显示失败:', updateError);
    }
  }

  /**
   * 更新所有URL模式输入框的验证状态
   * @param {string} currentUrl - 当前页面URL
   */
  async updateAllUrlPatternValidation(currentUrl) {
    try {
      const urlInputs = document.querySelectorAll('.url-pattern-input');
      
      for (const input of urlInputs) {
        const pattern = input.value.trim();
        if (pattern) {
          // 重新验证每个URL模式
          await this.validateUrlPattern(input, pattern, currentUrl);
        }
      }
      
      console.log(`[ThemeManager] 已更新 ${urlInputs.length} 个URL模式的验证状态`);
      
    } catch (error) {
      console.error('[ThemeManager] 更新URL模式验证状态失败:', error);
    }
  }

  /**
   * 检查主题是否匹配当前URL
   * @param {Object} theme - 主题数据
   * @param {string} currentUrl - 当前URL
   * @returns {boolean} 是否匹配
   */
  isThemeMatchCurrentUrl(theme, currentUrl) {
    if (!theme || !currentUrl) {
      return false;
    }

    // 如果没有URL模式，则不匹配
    if (!theme.urlPatterns || !Array.isArray(theme.urlPatterns) || theme.urlPatterns.length === 0) {
      return false;
    }

    // 检查是否有任何启用的模式匹配当前URL
     return theme.urlPatterns.some(urlPattern => {
       if (!urlPattern.enabled) {
         return false;
       }
       return Utils.matchUrlPattern(currentUrl, urlPattern.pattern, urlPattern.type || 'wildcard');
     });
  }

  /**
   * 显示URL变化通知
   * @param {Object} theme - 当前主题
   * @param {string} newUrl - 新URL
   * @param {boolean} isMatch - 是否匹配
   * @param {boolean} hasAppliedStyles - 是否有应用的样式
   */
  showUrlChangeNotification(theme, newUrl, isMatch, hasAppliedStyles) {
    try {
      // 创建简单的状态提示
      const statusText = isMatch ? '匹配' : '不匹配';
      const styleText = hasAppliedStyles ? '已应用' : '未应用';
      
      console.log(`[ThemeManager] 主题状态: ${theme.name} - ${statusText}, 样式: ${styleText}`);
      
      // 可以在这里添加更丰富的UI提示，比如toast通知
      // 暂时只在控制台输出，避免过度打扰用户
      
    } catch (error) {
      console.error('[ThemeManager] 显示URL变化通知失败:', error);
    }
  }






 
   /**
   * 渲染所有主题
   */
  renderThemes() {
    this.renderPresetThemes();
    this.renderCustomThemes();
    this.updateThemeSelection();
    this.updateEmptyState();
  }

  /**
   * 渲染预设主题
   */
  renderPresetThemes() {
    const container = document.getElementById('presetThemes');
    if (!container) return;

    // 保留无主题，清空其他内容
    const noneTheme = container.querySelector('[data-theme-id="none"]');
    container.innerHTML = '';

    // 重新添加无主题
    if (noneTheme) {
      container.appendChild(noneTheme);
      // 添加无主题点击事件
      noneTheme.addEventListener('click', async () => {
        await this.selectNoneTheme();
      });
    }
    
    this.appState.presetThemes.forEach(theme => {
      // 跳过无主题，因为已经在HTML中定义
      if (theme.id === 'none') return;
      
      const card = this.createThemeCard(theme, true);
      container.appendChild(card);
    });
  }

  /**
   * 渲染自定义主题
   */
  renderCustomThemes() {
    const container = document.getElementById('customThemesList');
    if (!container) return;

    container.innerHTML = '';
    
    this.appState.customThemes.forEach(theme => {
      const card = this.createThemeCard(theme, false);
      container.appendChild(card);
    });
  }

  /**
   * 创建主题卡片
   * @param {Object} theme - 主题数据
   * @param {boolean} isPreset - 是否为预设主题
   * @returns {HTMLElement} 主题卡片元素
   */
  createThemeCard(theme, isPreset) {
    const card = document.createElement('div');
    card.className = isPreset ? 'preset-theme-card' : 'custom-theme-item';
    card.dataset.themeId = theme.id;
    
    const isApplied = this.appState.isThemeApplied(theme.id);
    if (isApplied) {
      card.classList.add('active');
    }

    if (isPreset) {
      // 预设主题使用简单布局
      card.innerHTML = `
        <h4 title="${Utils.escapeHtml(theme.name)}">${Utils.escapeHtml(theme.name)}</h4>
        <p title="${Utils.escapeHtml(theme.description || '')}">${Utils.escapeHtml(theme.description || '')}</p>
      `;
    } else {
      // 自定义主题使用简洁布局
      card.innerHTML = `
        <div class="custom-theme-info">
          <h5 title="${Utils.escapeHtml(theme.name)}">${Utils.escapeHtml(theme.name)}</h5>
          <p title="${Utils.escapeHtml(theme.description || '无描述')}">${Utils.escapeHtml(theme.description || '无描述')}</p>
        </div>
      `;
    }

    // 绑定事件
    this.bindThemeCardEvents(card, theme, isPreset);
    
    return card;
  }

  /**
   * 绑定主题卡片事件
   * @param {HTMLElement} card - 卡片元素
   * @param {Object} theme - 主题数据
   * @param {boolean} isPreset - 是否为预设主题
   */
  bindThemeCardEvents(card, theme, isPreset) {
    if (isPreset) {
      // 预设主题点击直接选择并应用
      card.addEventListener('click', async () => {
        await this.selectPresetTheme(theme);
      });
    } else {
      // 自定义主题点击选择
      card.addEventListener('click', async () => {
        await this.selectCustomTheme(theme);
      });


    }
  }

  /**
   * 获取当前正在编辑的主题ID
   * @returns {string|null} 主题ID
   */
  getCurrentEditingThemeId() {
    const currentTheme = this.appState.getCurrentTheme();
    return currentTheme ? currentTheme.id : null;
  }

  /**
   * 计算主题中的规则数量
   * @param {Object} theme - 主题数据
   * @returns {number} 规则数量
   */
  countThemeRules(theme) {
    if (!theme.groups || !Array.isArray(theme.groups)) {
      return 0;
    }
    
    return theme.groups.reduce((total, group) => {
      return total + (group.rules ? group.rules.length : 0);
    }, 0);
  }

  /**
   * 更新主题选择状态
   */
  updateThemeSelection() {
    // 移除所有active状态
    document.querySelectorAll('.preset-theme-card').forEach(card => {
      card.classList.remove('active');
    });
    document.querySelectorAll('.custom-theme-item').forEach(item => {
      item.classList.remove('active');
    });

    // 添加当前应用主题的active状态
    if (this.appState.appliedThemeId) {
      const activeCard = document.querySelector(`[data-theme-id="${this.appState.appliedThemeId}"]`);
      if (activeCard) {
        activeCard.classList.add('active');
      }
    } else {
      // 如果没有应用任何主题，选择无主题
      const noneElement = document.querySelector('[data-theme-id="none"]');
      if (noneElement) {
        noneElement.classList.add('active');
      }
    }
  }

  /**
   * 更新空状态显示
   */
  updateEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const themeInfoSection = document.getElementById('themeInfoSection');
    const groupsSection = document.getElementById('groupsSection');
    
    if (!emptyState) return;

    // 检查是否有当前编辑的主题
    const currentTheme = this.appState.getCurrentTheme();
    
    if (!currentTheme) {
      // 没有当前主题时显示空状态
      emptyState.style.display = 'flex';
      if (themeInfoSection) themeInfoSection.style.display = 'none';
      if (groupsSection) groupsSection.style.display = 'none';
    } else {
      // 有当前主题时隐藏空状态
      emptyState.style.display = 'none';
      if (themeInfoSection) themeInfoSection.style.display = 'block';
      if (groupsSection) groupsSection.style.display = 'block';
    }
  }

  /**
   * 选择预设主题
   * @param {Object} theme - 主题数据
   */
  async selectPresetTheme(theme) {
    // 检查是否有未保存的更改
    if (this.hasUnsavedChanges) {
      const confirmed = await this.showConfirmDialog(
        '当前主题有未保存的更改，切换主题将丢失这些更改。确定要继续吗？',
        {
          title: '未保存的更改',
          type: 'warning',
          confirmText: '继续切换',
          cancelText: '取消'
        }
      );
      
      if (!confirmed) {
        return; // 用户取消切换
      }
      
      // 用户确认丢弃更改，重置状态
      this.hasUnsavedChanges = false;
      this.updatePageTitle();
    }

    // 清除其他选中状态
    document.querySelectorAll('.preset-theme-card.active').forEach(card => {
      card.classList.remove('active');
    });
    document.querySelectorAll('.custom-theme-item.active').forEach(item => {
      item.classList.remove('active');
    });

    // 设置当前选中
    const card = document.querySelector(`[data-theme-id="${theme.id}"]`);
    if (card) card.classList.add('active');

    // 如果是"无主题"，清空当前主题
    if (theme.id === 'none') {
      await this.selectNoneTheme();
    } else {
      // 创建主题副本用于编辑
      const editableTheme = Utils.deepClone(theme);
      editableTheme.id = Utils.generateId();
      editableTheme.isCustom = true;
      editableTheme.originalId = theme.id; // 保存原始主题ID

      this.appState.setCurrentTheme(editableTheme);
      this.showThemeEditor(editableTheme);
      // 自动应用选中的主题
      this.applyCurrentTheme();
    }
  }

  /**
   * 选择自定义主题
   * @param {Object} theme - 主题数据
   */
  async selectCustomTheme(theme) {
    // 检查是否有未保存的更改
    if (this.hasUnsavedChanges) {
      const confirmed = await this.showConfirmDialog(
        '当前主题有未保存的更改，切换主题将丢失这些更改。确定要继续吗？',
        {
          title: '未保存的更改',
          type: 'warning',
          confirmText: '继续切换',
          cancelText: '取消'
        }
      );
      
      if (!confirmed) {
        return; // 用户取消切换
      }
      
      // 用户确认丢弃更改，重置状态
      this.hasUnsavedChanges = false;
      this.updatePageTitle();
    }

    // 清除其他选中状态
    document.querySelectorAll('.preset-theme-card.active').forEach(card => {
      card.classList.remove('active');
    });
    document.querySelectorAll('.custom-theme-item.active').forEach(item => {
      item.classList.remove('active');
    });

    // 设置当前选中
    const item = document.querySelector(`[data-theme-id="${theme.id}"]`);
    if (item) item.classList.add('active');

    this.appState.setCurrentTheme(theme);
    this.showThemeEditor(theme);
    // 自动应用选中的主题
    this.applyCurrentTheme();
  }

  /**
   * 选择无主题
    * @param {boolean} applyTheme - 是否实际应用主题（默认为true）
   */
  async selectNoneTheme(applyTheme = true) {
    // 检查是否有未保存的更改
    if (this.hasUnsavedChanges) {
      const confirmed = await this.showConfirmDialog(
        '当前主题有未保存的更改，切换主题将丢失这些更改。确定要继续吗？',
        {
          title: '未保存的更改',
          type: 'warning',
          confirmText: '继续切换',
          cancelText: '取消'
        }
      );
      
      if (!confirmed) {
        return; // 用户取消切换
      }
      
      // 用户确认丢弃更改，重置状态
      this.hasUnsavedChanges = false;
      this.updatePageTitle();
    }

    // 清除其他选中状态
    document.querySelectorAll('.preset-theme-card.active').forEach(card => {
      card.classList.remove('active');
    });
    document.querySelectorAll('.custom-theme-item.active').forEach(item => {
      item.classList.remove('active');
    });

    // 设置无主题为选中
    const noneElement = document.querySelector('[data-theme-id="none"]');
    if (noneElement) {
      noneElement.classList.add('active');
    }

    if (applyTheme) {
      // 应用无主题（清除所有样式）
      chromeApi.resetStyles().then(() => {
        this.appState.setAppliedThemeId('none');
        Utils.showToast('已应用无主题', 'success');
      }).catch(error => {
        Utils.showToast('重置样式失败: ' + error.message, 'error');
      });
    }

    // 清空当前主题并隐藏编辑器
    this.appState.setCurrentTheme(null);
    this.hideThemeEditor();
  }

  /**
   * 应用当前主题
   */
  async applyCurrentTheme() {
    const currentTheme = this.appState.getCurrentTheme();
    if (currentTheme) {
      console.log('准备应用主题:', currentTheme.name, '主题ID:', currentTheme.id, '原始ID:', currentTheme.originalId);
      

      // 检查主题是否配置了URL规则
      if (!currentTheme.urlPatterns || currentTheme.urlPatterns.length === 0) {
        // 没有配置URL规则时清除当前样式
        const clearSuccess = await chromeApi.clearStyles();
        if (clearSuccess) {
          Utils.showToast(`主题 "${currentTheme.name}" 没有配置适用网站，已清除样式`, 'warning');
        } else {
          Utils.showToast(`主题 "${currentTheme.name}" 没有配置适用网站，无法应用`, 'warning');
        }
        return;
      }
      
      // 获取当前活动标签页的URL进行匹配检查
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = tabs[0]?.url;
        
        if (currentUrl) {
          const isUrlMatch = Utils.isThemeMatchUrl(currentTheme, currentUrl);
          console.log('URL匹配检查结果:', isUrlMatch, '当前URL:', currentUrl);
          
          if (!isUrlMatch) {
            // URL不匹配时清除当前样式
            const clearSuccess = await chromeApi.clearStyles();
            if (clearSuccess) {
              Utils.showToast(`主题 "${currentTheme.name}" 不适用于当前网站，已清除样式`, 'warning');
            } else {
              Utils.showToast(`主题 "${currentTheme.name}" 不适用于当前网站`, 'warning');
            }
            return;
          }
        }
      } catch (error) {
        console.warn('获取当前标签页URL失败:', error);
        // 如果无法获取URL，继续应用主题（向后兼容）
      }
      
      // 应用主题样式
      const success = await chromeApi.applyTheme(currentTheme);
      if (success) {
        // 保存当前主题ID（不使用originalId，确保保存的是当前编辑的主题）
        const themeIdToSave = currentTheme.id;
        console.log('准备保存的主题ID:', themeIdToSave);
        await this.appState.setAppliedThemeId(themeIdToSave);
        Utils.showToast(`主题 "${currentTheme.name}" 已应用`, 'success');
      } else {
        Utils.showToast('应用主题失败', 'error');
      }
    }
  }

  /**
   * 编辑自定义主题
   * @param {string} themeId - 主题ID
   */
  async editCustomTheme(themeId) {
    // 检查是否有未保存的更改
    if (this.hasUnsavedChanges) {
      const confirmed = await this.showConfirmDialog(
        '当前主题有未保存的更改，切换主题将丢失这些更改。确定要继续吗？',
        {
          title: '未保存的更改',
          type: 'warning',
          confirmText: '继续切换',
          cancelText: '取消'
        }
      );
      
      if (!confirmed) {
        return; // 用户取消切换
      }
      
      // 用户确认丢弃更改，重置状态
      this.hasUnsavedChanges = false;
      this.updatePageTitle();
    }

    const theme = this.appState.customThemes.find(t => t.id === themeId);
    if (theme) {
      this.appState.setCurrentTheme(theme);
      this.showThemeEditor(theme);
    }
  }

  /**
   * 删除自定义主题
   * @param {string} themeId - 主题ID
   */
  async deleteCustomTheme(themeId) {
    const theme = this.appState.customThemes.find(t => t.id === themeId);
    if (!theme) {
      return;
    }

    // 检查是否正在编辑该主题且有未保存的更改
    const isEditingThisTheme = this.appState.currentTheme && this.appState.currentTheme.id === themeId;
    if (isEditingThisTheme && this.hasUnsavedChanges) {
      const discardConfirmed = await this.showConfirmDialog(
        `主题 "${theme.name}" 有未保存的更改，删除后这些更改将丢失。确定要删除吗？`,
        {
          title: '删除主题',
          type: 'danger',
          confirmText: '删除',
          cancelText: '取消'
        }
      );
      
      if (!discardConfirmed) {
        return;
      }
    } else {
      // 普通删除确认
      const confirmed = await this.showConfirmDialog(`确定要删除主题 "${theme.name}" 吗？`, {
        title: '删除主题',
        type: 'danger',
        confirmText: '删除',
        cancelText: '取消'
      });
      
      if (!confirmed) {
        return;
      }
    }

    // 执行删除操作
    const wasAppliedTheme = this.appState.appliedThemeId === themeId;
    await this.appState.removeCustomTheme(themeId);
  
    // 如果删除的是当前主题，清空编辑器并重置未保存状态
    if (isEditingThisTheme) {
      this.appState.setCurrentTheme(null);
      this.hasUnsavedChanges = false;
      this.hideThemeEditor();
    }
    
    // 删除任何自定义主题后都切换到无主题
    await this.selectNoneTheme(true);
    
    Utils.showToast(`主题 "${theme.name}" 已删除`, 'success');
  }

  /**
   * 应用主题
   * @param {string} themeId - 主题ID
   */
  async applyTheme(themeId) {
    try {
      const theme = this.appState.getThemeById(themeId);
      if (!theme) {
        throw new Error('主题不存在');
      }

      const success = await chromeApi.applyTheme(theme);
      if (success) {
        await this.appState.setAppliedThemeId(themeId);
        Utils.showToast(`主题 "${theme.name}" 已应用`, 'success');
      } else {
        throw new Error('主题应用失败');
      }
    } catch (error) {
      console.error('应用主题失败:', error);
      Utils.showToast('应用主题失败: ' + error.message, 'error');
    }
  }

  /**
   * 恢复应用的主题
   */
  async restoreAppliedTheme() {
    const appliedThemeId = this.appState.getAppliedThemeId();
    console.log('从应用状态中获取的主题ID:', appliedThemeId);
    if (!appliedThemeId) {
      console.log('没有找到已应用的主题ID，自动选择无主题');
      await this.selectNoneTheme(false);
      return;
    }

    console.log('开始恢复主题:', appliedThemeId);

    // 查找并选中对应的主题（恢复UI状态和显示内容，但不重新应用主题）
    if (appliedThemeId === 'none' || appliedThemeId === 'default') {
      // 恢复无主题选中状态（兼容旧的default值）
      await this.selectNoneTheme(false);
    } else {
      // 查找预制主题
      const presetTheme = this.appState.getPresetThemes().find(
        (theme) => theme.id === appliedThemeId
      );
      if (presetTheme) {
        // 手动设置UI状态和显示内容，但不应用主题
        this.restoreThemeUIState(presetTheme, 'preset');
        return;
      }

      // 查找自定义主题
      const customTheme = this.appState.getCustomThemes().find(
        (theme) => theme.id === appliedThemeId
      );
      if (customTheme) {
        // 手动设置UI状态和显示内容，但不应用主题
        this.restoreThemeUIState(customTheme, 'custom');
        return;
      }
    }
  }

  /**
   * 恢复主题UI状态（仅用于页面初始化时恢复状态）
   * @param {Object} theme - 主题数据
   * @param {string} type - 主题类型 ('preset' 或 'custom')
   */
  restoreThemeUIState(theme, type) {
    // 清除其他选中状态
    document.querySelectorAll('.preset-theme-card.active').forEach((card) => {
      card.classList.remove('active');
    });
    document.querySelectorAll('.custom-theme-item.active').forEach((item) => {
      item.classList.remove('active');
    });

    // 设置当前主题为选中状态
    const element = document.querySelector(`[data-theme-id="${theme.id}"]`);
    if (element) {
      element.classList.add('active');
    }

    if (type === 'preset') {
      // 对于预制主题，创建可编辑副本
      const editableTheme = Utils.deepClone(theme);
      editableTheme.id = Utils.generateId();
      editableTheme.isCustom = true;
      editableTheme.originalId = theme.id; // 保存原始主题ID
      this.appState.setCurrentTheme(editableTheme);
      this.showThemeEditor(editableTheme);
    } else if (type === 'custom') {
      // 对于自定义主题，直接设置
      this.appState.setCurrentTheme(theme);
      this.showThemeEditor(theme);
    }
  }

  /**
   * 创建新主题
   */
  async createNewTheme() {
    const newTheme = {
      id: Utils.generateId(),
      name: this.appState.generateUniqueThemeName('新主题'),
      description: '自定义主题',
      groups: [],
      isCustom: true
    };

    try {
      // 立即添加到自定义主题列表中
      await this.appState.addCustomTheme(newTheme);
      
      // 设置为当前主题并自动应用
      this.appState.setCurrentTheme(newTheme);
      this.appState.setAppliedThemeId(newTheme.id);
      
      // 显示主题编辑器
      this.showThemeEditor(newTheme);
      
      // 更新主题选择状态和按钮显示
      this.updateThemeSelection();
      this.updateThemeActions(newTheme);
      
      Utils.showToast(`已创建新主题 "${newTheme.name}"`, 'success');
    } catch (error) {
      console.error('创建主题失败:', error);
      Utils.showToast('创建主题失败: ' + error.message, 'error');
    }
  }



  /**
   * 保存当前主题
   */
  async saveCurrentTheme() {
    try {
      const currentTheme = this.getCurrentThemeFromEditor();
      if (!currentTheme) {
        Utils.showToast('没有要保存的主题', 'warning');
        return;
      }

      // 更新当前主题数据
      this.appState.setCurrentTheme(currentTheme);
      
      await this.appState.addCustomTheme(currentTheme);
      
      // 保存应用主题ID并记录为最后保存的状态
      await this.appState.setAppliedThemeId(currentTheme.id);
      this.lastSavedAppliedThemeId = currentTheme.id;
      
      // 重置修改状态和临时状态
      this.originalThemeData = Utils.deepClone(currentTheme);
      this.hasUnsavedChanges = false;
      this.clearTemporaryState();
      
      // 更新UI状态
      this.renderCustomThemes(); // 重新渲染自定义主题列表，确保主题状态正确
      this.updateThemeSelection();
      this.updateSaveButtonState();
      this.updatePageTitle();
      
      Utils.showToast(`主题 "${currentTheme.name}" 已保存`, 'success');
      
      // 保存后立即校验URL匹配并应用主题
      setTimeout(() => {
        this.applyCurrentTheme();
      }, 100);
    } catch (error) {
      console.error('保存主题失败:', error);
      Utils.showToast('保存主题失败: ' + error.message, 'error');
    }
  }

  /**
   * 另存为新主题
   */
  async saveAsNewTheme() {
    try {
      const currentTheme = this.appState.getCurrentTheme();
      if (!currentTheme) {
        Utils.showToast('没有要保存的主题', 'warning');
        return;
      }

      // 判断当前主题是否已存在于自定义主题中
      const existingTheme = this.appState.customThemes.find(t => t.id === currentTheme.id);
      const isExistingCustomTheme = existingTheme && currentTheme.isCustom;
      
      let defaultName;
      let dialogTitle;
      
      if (isExistingCustomTheme) {
        // 已存在的自定义主题 - 另存为
        defaultName = currentTheme.name + ' 副本';
        dialogTitle = '另存为新主题';
      } else {
        // 新主题或预设主题 - 保存
        defaultName = currentTheme.name;
        dialogTitle = '保存主题';
      }

      const newName = await Utils.showInputDialog(
        '请输入主题名称:',
        {
          title: dialogTitle,
          placeholder: '主题名称',
          defaultValue: defaultName,
          confirmText: '保存',
          cancelText: '取消',
          type: 'info'
        }
      );
      
      if (!newName) {
        return; // 用户取消
      }

      const newTheme = {
        ...Utils.deepClone(currentTheme),
        id: Utils.generateId(),
        name: newName,
        isCustom: true,
        originalId: undefined // 移除originalId，确保不被识别为预制主题
      };
      
      // 删除originalId属性
      delete newTheme.originalId;

      // 保存新主题
      await this.appState.addCustomTheme(newTheme);
      
      // 设置为当前主题并应用
      this.appState.setCurrentTheme(newTheme);
      await this.appState.setAppliedThemeId(newTheme.id);
      this.lastSavedAppliedThemeId = newTheme.id;
      
      // 重置修改状态和临时状态
      this.originalThemeData = Utils.deepClone(newTheme);
      this.hasUnsavedChanges = false;
      this.clearTemporaryState();
      
      // 更新编辑器界面显示新主题信息
      const themeName = document.getElementById('themeName');
      if (themeName) {
        themeName.value = newTheme.name || '';
      }
      const themeDescription = document.getElementById('themeDescription');
      if (themeDescription) {
        themeDescription.value = newTheme.description || '';
      }
      
      // 重新渲染编辑器内容
      this.renderGroups(newTheme);
      this.renderUrlPatterns(newTheme);
      
      // 更新UI状态
      this.renderCustomThemes(); // 重新渲染自定义主题列表，确保新主题显示
      this.updateThemeSelection();
      this.updateThemeActions(newTheme);
      this.updateSaveButtonState();
      this.updatePageTitle();
      
      Utils.showToast(`主题 "${newTheme.name}" 已保存`, 'success');
      
      // 保存后立即校验URL匹配并应用主题
      setTimeout(() => {
        this.applyCurrentTheme();
      }, 100);
    } catch (error) {
      console.error('另存为失败:', error);
      Utils.showToast('另存为失败: ' + error.message, 'error');
    }
  }

  /**
   * 导出当前主题
   */
  async exportCurrentTheme() {
    const currentTheme = this.appState.getCurrentTheme();
    if (!currentTheme) {
      Utils.showToast('没有要导出的主题', 'warning');
      return;
    }

    const filename = `${currentTheme.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_theme.json`;
    await Utils.exportJSON(currentTheme, filename);
  }

  /**
   * 进入临时编辑模式
   */
  enterTemporaryMode() {
    if (!this.isInTemporaryMode) {
      this.isInTemporaryMode = true;
      // 保存当前编辑状态作为临时状态
      this.temporaryThemeState = this.getCurrentThemeFromEditor();
      console.log('进入临时编辑模式');
    }
  }

  /**
   * 清空临时状态
   */
  clearTemporaryState() {
    this.isInTemporaryMode = false;
    this.temporaryThemeState = null;
    console.log('清空临时状态');
  }

  /**
   * 恢复到上次保存的状态
   */
  async restoreToLastSavedState() {
    try {
      if (this.lastSavedAppliedThemeId) {
        // 恢复到上次保存的应用主题
        await this.appState.setAppliedThemeId(this.lastSavedAppliedThemeId);
        
        // 重新应用上次保存的主题
        const savedTheme = this.appState.getThemeById(this.lastSavedAppliedThemeId);
        if (savedTheme) {
          await chromeApi.applyTheme(savedTheme);
          console.log('已恢复到上次保存的主题状态');
        }
      } else {
        // 如果没有保存的状态，清除所有应用的主题
        await chromeApi.clearAllPreview();
        await this.appState.setAppliedThemeId(null);
        console.log('已清除所有主题应用');
      }
    } catch (error) {
      console.error('恢复到上次保存状态失败:', error);
    }
  }

  /**
   * 导入主题
   * @param {File} file - 主题文件
   */
  async importTheme(file = null) {
    try {
      const themeData = await Utils.importJSON(file);
      
      if (!Utils.validateTheme(themeData)) {
        throw new Error('主题文件格式无效');
      }

      // 生成新的ID和唯一名称
      themeData.id = Utils.generateId();
      themeData.name = this.appState.generateUniqueThemeName(themeData.name);

      await this.appState.addCustomTheme(themeData);
      
      // 设置为当前编辑的主题
      this.appState.setCurrentTheme(themeData);
      
      // 检查是否需要应用主题（URL匹配检查）
      let shouldApplyTheme = true;
      let urlMatchMessage = '';
      
      // 如果主题配置了URL模式，需要检查是否匹配当前页面
      if (themeData.urlPatterns && Array.isArray(themeData.urlPatterns) && themeData.urlPatterns.length > 0) {
        try {
          // 获取当前活动标签页的URL
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const currentUrl = tabs[0]?.url;
          
          if (currentUrl) {
            const isUrlMatch = Utils.isThemeMatchUrl(themeData, currentUrl);
            console.log('导入主题URL匹配检查结果:', isUrlMatch, '当前URL:', currentUrl);
            
            if (!isUrlMatch) {
              shouldApplyTheme = false;
              const domain = Utils.extractDomain(currentUrl);
              urlMatchMessage = ` (当前网站 ${domain || '此页面'} 不在适用范围内)`;
            }
          } else {
            // 无法获取当前URL时，不应用主题
            shouldApplyTheme = false;
            urlMatchMessage = ' (无法获取当前页面信息)';
          }
        } catch (error) {
          console.warn('获取当前标签页URL失败:', error);
          shouldApplyTheme = false;
          urlMatchMessage = ' (无法检查页面匹配)';
        }
      }
      
      if (shouldApplyTheme) {
        // URL匹配或没有配置URL模式，应用主题
        await this.appState.setAppliedThemeId(themeData.id);
        
        const success = await chromeApi.applyTheme(themeData);
        if (success) {
          Utils.showToast(`主题 "${themeData.name}" 导入成功并已应用`, 'success');
        } else {
          // 应用失败但不抛出错误，可能是URL不匹配导致的
          Utils.showToast(`主题 "${themeData.name}" 导入成功，但当前页面不适用`, 'warning');
        }
      } else {
        // URL不匹配，不应用主题但显示导入成功
        Utils.showToast(`主题 "${themeData.name}" 导入成功${urlMatchMessage}`, 'success');
      }
      
      this.showThemeEditor(themeData);
    } catch (error) {
      console.error('导入主题失败:', error);
      Utils.showToast('导入主题失败: ' + error.message, 'error');
    }
  }

  /**
   * 显示主题编辑器
   * @param {Object} theme - 主题数据（可选，如果不传则使用当前主题）
   */
  showThemeEditor(theme = null) {
    const targetTheme = theme || this.appState.getCurrentTheme();
    if (!targetTheme) {
      return;
    }

    // 只有在切换到不同主题时才更新原始数据
    // 但是如果当前正在编辑模式且目标主题就是当前主题，则不重置状态
    const currentTheme = this.appState.getCurrentTheme();
    const isSameTheme = currentTheme && currentTheme.id === targetTheme.id;
    
    if (!this.originalThemeData || (this.originalThemeData.id !== targetTheme.id && !isSameTheme)) {
      // 切换主题时清空临时状态
      this.clearTemporaryState();
      this.originalThemeData = Utils.deepClone(targetTheme);
      this.hasUnsavedChanges = false;
    }

    // 隐藏空状态
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
      emptyState.style.display = 'none';
    }

    // 显示主题信息编辑区
    const themeInfoSection = document.getElementById('themeInfoSection');
    if (themeInfoSection) {
      themeInfoSection.style.display = 'block';
    }

    // 显示组编辑区
    const groupsSection = document.getElementById('groupsSection');
    if (groupsSection) {
      groupsSection.style.display = 'block';
    }

    // 填充主题信息
    const themeName = document.getElementById('themeName');
    if (themeName) {
      themeName.value = targetTheme.name || '';
      // 监听主题名称变化
      themeName.removeEventListener('input', this.boundHandleThemeChange);
      themeName.addEventListener('input', this.boundHandleThemeChange);
    }

    const themeDescription = document.getElementById('themeDescription');
    if (themeDescription) {
      themeDescription.value = targetTheme.description || '';
      // 监听主题描述变化
      themeDescription.removeEventListener('input', this.boundHandleThemeChange);
      themeDescription.addEventListener('input', this.boundHandleThemeChange);
    }

    // 渲染URL配置
    this.renderUrlPatterns(targetTheme);

    // 根据主题类型显示不同的按钮
    this.updateThemeActions(targetTheme);

    // 渲染主题组
    this.renderGroups(targetTheme);

    // 验证主题选择器
    setTimeout(() => {
      this.validateThemeSelectors(targetTheme);
    }, 100);
  }

  /**
   * 处理主题变化
   */
  handleThemeChange() {
    // 进入临时编辑模式
    this.enterTemporaryMode();
    this.checkForChanges();
    this.updateSaveButtonState();
  }

  /**
   * 检查主题是否有修改
   */
  checkForChanges() {
    const currentTheme = this.getCurrentThemeFromEditor();
    if (!this.originalThemeData || !currentTheme) {
      this.hasUnsavedChanges = false;
      return;
    }

    // 比较主题数据
    const hasChanges = JSON.stringify(currentTheme) !== JSON.stringify(this.originalThemeData);
    this.hasUnsavedChanges = hasChanges;
    
    // 更新页面标题显示未保存状态
    this.updatePageTitle();
  }

  /**
   * 从编辑器获取当前主题数据
   */
  getCurrentThemeFromEditor() {
    const currentTheme = this.appState.getCurrentTheme();
    if (!currentTheme) return null;

    const themeName = document.getElementById('themeName');
    const themeDescription = document.getElementById('themeDescription');

    // 获取当前编辑器中的所有数据
    const editorTheme = {
      ...Utils.deepClone(currentTheme),
      name: themeName ? themeName.value : currentTheme.name,
      description: themeDescription ? themeDescription.value : currentTheme.description
    };

    // 收集URL模式数据
    const urlPatterns = [];
    const urlPatternItems = document.querySelectorAll('.url-pattern-item');
    urlPatternItems.forEach(item => {
      const input = item.querySelector('.url-pattern-input');
      const select = item.querySelector('.url-pattern-type');
      const toggle = item.querySelector('.url-pattern-toggle');
      
      if (input && select && toggle) {
        const pattern = input.value.trim();
        if (pattern) {
          urlPatterns.push({
            pattern: pattern,
            type: select.value,
            enabled: toggle.classList.contains('enabled')
          });
        }
      }
    });
    
    editorTheme.urlPatterns = urlPatterns;

    // 收集所有属性编辑器的值
    const propertyInputs = document.querySelectorAll('.property-value');
    propertyInputs.forEach(input => {
      const property = input.dataset.property;
      const groupIndex = parseInt(input.dataset.groupIndex);
      const ruleIndex = parseInt(input.dataset.ruleIndex);
      
      if (property && !isNaN(groupIndex) && !isNaN(ruleIndex)) {
        if (editorTheme.groups[groupIndex] && editorTheme.groups[groupIndex].rules[ruleIndex]) {
          if (!editorTheme.groups[groupIndex].rules[ruleIndex].properties) {
            editorTheme.groups[groupIndex].rules[ruleIndex].properties = {};
          }
          editorTheme.groups[groupIndex].rules[ruleIndex].properties[property] = input.value;
        }
      }
    });

    return editorTheme;
  }

  /**
   * 更新页面标题显示未保存状态
   */
  updatePageTitle() {
    const titleElement = document.querySelector('h1');
    if (!titleElement) return;

    const baseTitle = '页面美化 - 可视化CSS编辑器';
    if (this.hasUnsavedChanges) {
      titleElement.textContent = baseTitle + ' *';
      titleElement.style.color = '#f59e0b'; // 橙色表示未保存
    } else {
      titleElement.textContent = baseTitle;
      titleElement.style.color = '';
    }
  }

  /**
   * 更新保存按钮状态
   */
  updateSaveButtonState() {
    const saveBtn = document.getElementById('saveThemeBtn');
    if (!saveBtn) return;

    const currentTheme = this.appState.getCurrentTheme();
    const existingTheme = this.appState.customThemes.find((t) => t.id === currentTheme?.id);
    const isExistingCustomTheme = existingTheme && currentTheme?.isCustom;

    if (isExistingCustomTheme) {
      if (this.hasUnsavedChanges) {
        // 有修改 - 启用并高亮
        saveBtn.disabled = false;
        saveBtn.classList.remove('btn-outline');
        saveBtn.classList.add('btn-primary');
        saveBtn.style.backgroundColor = '#3b82f6';
        saveBtn.style.borderColor = '#3b82f6';
        saveBtn.style.color = 'white';
      } else {
        // 无修改 - 禁用
        saveBtn.disabled = true;
        saveBtn.classList.remove('btn-primary');
        saveBtn.classList.add('btn-outline');
        saveBtn.style.backgroundColor = '';
        saveBtn.style.borderColor = '';
        saveBtn.style.color = '';
        saveBtn.style.opacity = '0.5';
      }
    }
  }

  /**
   * 更新主题操作按钮
   * @param {Object} theme - 主题数据
   */
  updateThemeActions(theme) {
    const saveBtn = document.getElementById('saveThemeBtn');
    const saveAsBtn = document.getElementById('saveAsThemeBtn');
    const deleteBtn = document.getElementById('deleteThemeBtn');
    const resetBtn = document.getElementById('resetPreviewBtn');
    const exportBtn = document.getElementById('exportThemeBtn');

    if (!saveBtn || !saveAsBtn || !deleteBtn) return;

    // 检查是否为预制主题（通过originalId判断）
    const isPresetTheme = theme.originalId && this.appState.getPresetThemes().some(t => t.id === theme.originalId);
    
    if (isPresetTheme) {
      // 预制主题 - 只显示另存为按钮，隐藏其他所有按钮
      saveBtn.style.display = 'none';
      saveAsBtn.style.display = 'inline-block';
      deleteBtn.style.display = 'none';
      if (resetBtn) resetBtn.style.display = 'none';
      if (exportBtn) exportBtn.style.display = 'none';
      
      // 禁用编辑功能
      this.setThemeEditorReadOnly(true);
    } else {
      // 检查当前主题是否已存在于自定义主题中
      const existingTheme = this.appState.customThemes.find((t) => t.id === theme.id);
      const isExistingCustomTheme = existingTheme && theme.isCustom;

      if (isExistingCustomTheme) {
        // 已存在的自定义主题 - 显示保存按钮，显示另存为按钮，显示删除按钮
        saveBtn.style.display = 'inline-block';
        saveAsBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'inline-block';
        if (resetBtn) resetBtn.style.display = 'inline-block';
        if (exportBtn) exportBtn.style.display = 'inline-block';
        
        // 初始化保存按钮状态
        this.updateSaveButtonState();
      } else {
        // 新主题 - 隐藏保存按钮，显示另存为按钮，隐藏删除按钮
        saveBtn.style.display = 'none';
        saveAsBtn.style.display = 'inline-block';
        deleteBtn.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'inline-block';
        if (exportBtn) exportBtn.style.display = 'inline-block';
      }
      
      // 启用编辑功能
      this.setThemeEditorReadOnly(false);
    }
  }

  /**
   * 隐藏主题编辑器
   */
  hideThemeEditor() {
    // 显示空状态
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
      emptyState.style.display = 'flex';
    }

    // 隐藏主题信息编辑区
    const themeInfoSection = document.getElementById('themeInfoSection');
    if (themeInfoSection) {
      themeInfoSection.style.display = 'none';
    }

    // 隐藏组编辑区
    const groupsSection = document.getElementById('groupsSection');
    if (groupsSection) {
      groupsSection.style.display = 'none';
    }
  }

  /**
   * 渲染主题组
   * @param {Object} theme - 主题数据
   */
  renderGroups(theme) {
    const container = document.getElementById('groupsList');
    if (!container) return;

    container.innerHTML = '';
    
    if (!theme.groups || theme.groups.length === 0) {
      container.innerHTML = `
        <div class="empty-groups">
          <p>暂无样式组，点击右上角按钮添加第一个组</p>
        </div>
      `;
      return;
    }

    theme.groups.forEach((group) => {
      const groupCard = this.createGroupCard(group);
      container.appendChild(groupCard);
    });
  }

  /**
   * 创建修改组卡片
   * @param {Object} group - 组数据
   * @returns {HTMLElement} 组卡片元素
   */
  createGroupCard(group) {
    const card = document.createElement('div');
    card.className = 'group-card';
    
    // 检查当前主题是否为预制主题
    const currentTheme = this.appState.getCurrentTheme();
    const isPresetTheme = currentTheme && currentTheme.originalId && this.appState.getPresetThemes().some(t => t.id === currentTheme.originalId);
    
    // 根据是否为预制主题决定是否显示编辑按钮
    const actionButtons = isPresetTheme ? '' : `
      <button class="btn btn-sm btn-outline" data-action="add-rule" data-group-id="${
        group.id
      }">添加规则</button>
      <button class="btn btn-sm btn-outline" data-action="delete-group" data-group-id="${
        group.id
      }">删除组</button>`;
    
    card.innerHTML = `
      <div class="group-header" data-group-id="${group.id}">
        <div>
          <div class="group-title">${Utils.escapeHtml(group.name)}</div>
          <div class="group-description">${Utils.escapeHtml(group.description || '')}</div>
        </div>
        <div class="group-actions">
          ${actionButtons}
          <span class="group-toggle">▼</span>
        </div>
      </div>
      <div class="group-content" id="group-content-${group.id}">
        <div class="css-rules-list" id="rules-list-${group.id}">
          ${this.renderCSSRules(group.rules, group.id, isPresetTheme)}
        </div>
      </div>
    `;

    // 添加事件监听
    this.attachGroupEvents(card, group);

    return card;
  }

  /**
   * 渲染CSS规则
   * @param {Array} rules - CSS规则数组
   * @param {string} groupId - 组ID
   * @param {boolean} isPresetTheme - 是否为预制主题
   * @returns {string} 规则HTML字符串
   */
  renderCSSRules(rules, groupId, isPresetTheme = false) {
    if (!rules || rules.length === 0) {
      const emptyMessage = isPresetTheme ? '暂无CSS规则' : '暂无CSS规则，点击"添加规则"开始添加';
      return `<div class="empty-rules">${emptyMessage}</div>`;
    }

    return rules.map((rule, index) => {
      const propertiesHtml = Object.entries(rule.properties || {})
        .map(([prop, value]) => {
          // 查找CSS属性的中文名称
          let displayName = prop;
          for (const category in CSS_PROPERTIES) {
            if (CSS_PROPERTIES[category].properties[prop]) {
              displayName = CSS_PROPERTIES[category].properties[prop].name;
              break;
            }
          }
          
          return `
            <div class="css-property">
              <span class="css-property-name">${Utils.escapeHtml(displayName)}:</span>
              <span class="css-property-value">${Utils.escapeHtml(value)};</span>
            </div>
          `;
        })
        .join('');

      // 根据是否为预制主题决定是否显示编辑按钮
      const ruleActions = isPresetTheme ? '' : `
        <div class="css-rule-actions">
          <button class="btn-icon edit-rule-btn" title="修改规则" data-rule-index="${index}" data-group-id="${groupId}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon delete-rule-btn" title="删除规则" data-rule-index="${index}" data-group-id="${groupId}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>`;
      
      return `
        <div class="css-rule-item" data-rule-selector="${Utils.escapeHtml(rule.selector)}" data-rule-index="${index}" data-group-id="${groupId}">
          <div class="css-rule-header">
            <div class="css-rule-selector">
              <span class="selector-text">${Utils.escapeHtml(rule.selector)}</span>
              <span class="selector-status" data-status="unknown">●</span>
            </div>
            ${ruleActions}
          </div>
          <div class="css-rule-properties">
            ${propertiesHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * 为组卡片添加事件监听
   * @param {HTMLElement} card - 组卡片元素
   * @param {Object} group - 组数据
   */
  attachGroupEvents(card, group) {
    // 组展开/收起功能
    const header = card.querySelector('.group-header');
    const content = card.querySelector('.group-content');
    const toggle = card.querySelector('.group-toggle');
    
    if (header && content && toggle) {
      header.addEventListener('click', (e) => {
        // 如果点击的是按钮，不触发展开/收起
        if (e.target.closest('button')) return;
        
        // 检查组切换是否被禁用
        if (toggle.style.pointerEvents === 'none') {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
        const isExpanded = content.classList.contains('expanded');
        content.classList.toggle('expanded');
        header.classList.toggle('expanded', !isExpanded);
        toggle.textContent = content.classList.contains('expanded') ? '▲' : '▼';
      });
    }

    // 默认展开第一个组
    if (document.querySelectorAll('.group-card').length === 0) {
      content.classList.add('expanded');
      header.classList.add('expanded');
      toggle.textContent = '▲';
    }

    // 事件委托处理按钮点击
    card.addEventListener('click', (e) => {
      // 获取实际的按钮元素
      const button = e.target.closest('button[data-action]');
      if (!button) return;
      
      // 检查是否为只读模式
      if (button.disabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const action = button.dataset.action;
      const groupId = button.dataset.groupId;
      const ruleIndex = button.dataset.ruleIndex;

      switch (action) {
        case 'add-rule':
          this.showAddRuleModal(groupId);
          break;
        case 'delete-group':
          this.handleDeleteGroup(groupId);
          break;
      }
    });

    // 处理规则编辑和删除按钮
    card.addEventListener('click', async (e) => {
      if (e.target.closest('.edit-rule-btn')) {
        const btn = e.target.closest('.edit-rule-btn');
        // 检查是否为只读模式
        if (btn.disabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const ruleIndex = parseInt(btn.dataset.ruleIndex);
        const groupId = btn.dataset.groupId;
        // 移除高亮效果
        this.removeElementHighlight();
        this.editRule(groupId, ruleIndex);
      } else if (e.target.closest('.delete-rule-btn')) {
        const btn = e.target.closest('.delete-rule-btn');
        // 检查是否为只读模式
        if (btn.disabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        const ruleIndex = parseInt(btn.dataset.ruleIndex);
        const groupId = btn.dataset.groupId;
        // 移除高亮效果
        this.removeElementHighlight();
        await this.deleteRule(groupId, ruleIndex);
      }
    });

    // 为规则块添加悬浮事件
    this.attachRuleHoverEvents(card);
  }

  /**
   * 为规则块添加悬浮事件
   * @param {HTMLElement} card - 组卡片元素
   */
  attachRuleHoverEvents(card) {
    const ruleItems = card.querySelectorAll('.css-rule-item');

    ruleItems.forEach((ruleItem) => {
      const selector = ruleItem.dataset.ruleSelector;
      const statusDot = ruleItem.querySelector('.selector-status');

      // 鼠标进入规则块
      ruleItem.addEventListener('mouseenter', () => {
        this.validateAndHighlightSelector(selector, statusDot);
      });

      // 鼠标离开规则块
      ruleItem.addEventListener('mouseleave', () => {
        this.removeElementHighlight();
      });
    });
  }

  /**
   * 验证选择器并高亮元素
   * @param {string} selector - CSS选择器
   * @param {HTMLElement} statusDot - 状态指示点
   */
  validateAndHighlightSelector(selector, statusDot) {
    // 向内容脚本发送消息验证选择器
    chrome.runtime.sendMessage(
      {
        action: 'pageBeautify',
        type: 'VALIDATE_SELECTOR',
        data: { selector },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          // 验证失败
          statusDot.setAttribute('data-status', 'invalid');
          return;
        }

        if (response && response.success && response.elementCount > 0) {
          // 验证成功，高亮元素
          statusDot.setAttribute('data-status', 'valid');
          this.highlightElements(selector);
        } else {
          // 选择器无效或没有匹配元素
          statusDot.setAttribute('data-status', 'invalid');
        }
      }
    );
  }

  /**
   * 高亮页面元素
   * @param {string} selector - CSS选择器
   */
  highlightElements(selector) {
    chrome.runtime.sendMessage({
      action: 'pageBeautify',
      type: 'HIGHLIGHT_ELEMENTS',
      data: { selector },
    });
  }

  /**
   * 移除元素高亮
   */
  removeElementHighlight() {
    chrome.runtime.sendMessage({
      action: 'pageBeautify',
      type: 'REMOVE_HIGHLIGHT',
    });
  }

  /**
   * 验证主题中所有选择器
   * @param {Object} theme - 主题数据
   */
  validateThemeSelectors(theme) {
    if (!theme || !theme.groups) return;

    theme.groups.forEach((group) => {
      group.rules.forEach((rule, ruleIndex) => {
        const ruleItem = document.querySelector(
          `[data-rule-selector="${rule.selector}"][data-rule-index="${ruleIndex}"]`
        );
        if (ruleItem) {
          const statusDot = ruleItem.querySelector('.selector-status');
          this.validateSelector(rule.selector, statusDot);
        }
      });
    });
  }

  /**
   * 验证单个选择器
   * @param {string} selector - CSS选择器
   * @param {HTMLElement} statusDot - 状态指示点
   */
  validateSelector(selector, statusDot) {
    chrome.runtime.sendMessage(
      {
        action: 'pageBeautify',
        type: 'VALIDATE_SELECTOR',
        data: { selector },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          statusDot.setAttribute('data-status', 'invalid');
          return;
        }

        if (response && response.success && response.elementCount > 0) {
          statusDot.setAttribute('data-status', 'valid');
        } else {
          statusDot.setAttribute('data-status', 'invalid');
        }
      }
    );
  }

  /**
   * 删除组
   * @param {string} groupId - 组ID
   */
  async deleteGroup(groupId) {
    const currentTheme = this.appState.getCurrentTheme();
    if (!currentTheme || !currentTheme.groups) {
      return;
    }

    // 通过ID查找组索引
    const groupIndex = currentTheme.groups.findIndex(group => group.id === groupId);
    if (groupIndex === -1) {
      Utils.showToast('未找到要删除的组', 'error');
      return;
    }

    const group = currentTheme.groups[groupIndex];
    const confirmed = await this.showConfirmDialog(`确定要删除组 "${group.name}" 吗？`, {
      title: '删除确认',
      type: 'danger',
      confirmText: '删除',
      cancelText: '取消'
    });
    
    if (!confirmed) {
      return;
    }

    currentTheme.groups.splice(groupIndex, 1);
    this.appState.setCurrentTheme(currentTheme);
    this.renderGroups(currentTheme);
    
    // 检测修改并更新按钮状态（进入临时编辑模式）
    this.handleThemeChange();
    
    // 重新应用主题以清除被删除组的样式
    this.clearAllPreview();
    setTimeout(() => {
      this.applyCurrentTheme();
    }, 100);
    
    Utils.showToast('组已删除（临时预览）', 'success');
  }

  /**
   * 删除规则
   * @param {number} groupIndex - 组索引
   * @param {number} ruleIndex - 规则索引
   */
  async deleteRule(groupIndex, ruleIndex) {
    const currentTheme = this.appState.getCurrentTheme();
    if (!currentTheme || !currentTheme.groups[groupIndex] || !currentTheme.groups[groupIndex].rules[ruleIndex]) {
      return;
    }

    const rule = currentTheme.groups[groupIndex].rules[ruleIndex];
    const confirmed = await this.showConfirmDialog(`确定要删除规则 "${rule.selector}" 吗？`, {
      title: '删除确认',
      type: 'danger',
      confirmText: '删除',
      cancelText: '取消'
    });
    
    if (!confirmed) {
      return;
    }

    currentTheme.groups[groupIndex].rules.splice(ruleIndex, 1);
    this.appState.setCurrentTheme(currentTheme);
    this.renderGroups(currentTheme);
    
    // 检测修改并更新按钮状态
    this.handleThemeChange();
    
    // 重新应用主题以清除被删除规则的样式
    const success = await chromeApi.applyTheme(currentTheme);
    if (!success) {
      Utils.showToast('删除规则成功，但重新应用主题失败', 'warning');
    }
    
    Utils.showToast('规则已删除', 'success');
  }

  /**
   * 重置预览 - 清除所有实时预览效果并重新应用当前编辑的主题
   */
  async resetPreview() {
    try {
      // 先清除所有预览效果
      await chromeApi.clearAllPreview();
      
      // 延迟一下，然后重新应用当前编辑的主题
      setTimeout(async () => {
        const currentTheme = this.getCurrentThemeFromEditor();
        if (currentTheme) {
          // 直接应用当前编辑的主题，确保页面显示与编辑器一致
          try {
            const success = await chromeApi.applyTheme(currentTheme);
            if (success) {
              // 重置预览不保存appliedThemeId，只是临时预览
              Utils.showToast('预览已重置，当前编辑主题已应用', 'success');
            } else {
              Utils.showToast('重置预览失败', 'error');
            }
          } catch (error) {
            console.error('重新应用主题失败:', error);
            Utils.showToast('重置预览失败: ' + error.message, 'error');
          }
        } else {
          Utils.showToast('没有当前编辑的主题', 'warning');
        }
      }, 100);
    } catch (error) {
      console.error('重置预览失败:', error);
      Utils.showToast('重置预览失败: ' + error.message, 'error');
    }
  }

  /**
   * 导出当前主题
   */
  async exportCurrentTheme() {
    const currentTheme = this.appState.getCurrentTheme();
    if (!currentTheme) {
      Utils.showToast('没有要导出的主题', 'warning');
      return;
    }

    const filename = `${currentTheme.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_theme.json`;
    await Utils.exportJSON(currentTheme, filename);
  }

  /**
   * 显示添加规则模态框
   * @param {string} groupId - 组ID
   */
  showAddRuleModal(groupId) {
    this.currentGroupId = groupId;
    this.currentRuleIndex = null; // 清除编辑模式
    // 重置模态框状态
    this.resetAddRuleModalState();
    this.showModal('addRuleModal');
  }

  /**
   * 编辑规则
   * @param {string} groupId - 组ID
   * @param {number} ruleIndex - 规则索引
   */
  editRule(groupId, ruleIndex) {
    const theme = this.appState.getCurrentTheme();
    if (!theme) return;

    const group = theme.groups.find((g) => g.id === groupId);
    if (!group || !group.rules[ruleIndex]) {
      Utils.showToast("无法找到要编辑的规则", "error");
      return;
    }

    const rule = group.rules[ruleIndex];

    // 设置编辑模式并填充数据
    this.showEditRuleModal(groupId, ruleIndex, rule);
  }

  /**
   * 删除规则
   * @param {string} groupId - 组ID
   * @param {number} ruleIndex - 规则索引
   */
  async deleteRule(groupId, ruleIndex) {
    const confirmed = await this.showConfirmDialog("确定要删除这个CSS规则吗？", {
      title: '删除确认',
      type: 'danger',
      confirmText: '删除',
      cancelText: '取消'
    });
    
    if (!confirmed) return;

    const theme = this.appState.getCurrentTheme();
    if (!theme) return;

    const group = theme.groups.find((g) => g.id === groupId);
    if (!group || !group.rules[ruleIndex]) {
      Utils.showToast("无法找到要删除的规则", "error");
      return;
    }

    // 从组中移除规则
    group.rules.splice(ruleIndex, 1);

    // 更新当前主题数据（仅在内存中，不保存）
    this.appState.setCurrentTheme(theme);

    // 重新渲染主题编辑器内容
    this.renderGroups(theme);

    // 检测修改并更新按钮状态（进入临时编辑模式）
    this.handleThemeChange();

    // 重新应用主题
    this.clearAllPreview();
    setTimeout(() => {
      this.applyCurrentTheme();
    }, 100);

    Utils.showToast("CSS规则已删除（临时预览）", "success");
  }

  /**
   * 显示编辑规则模态框
   * @param {string} groupId - 组ID
   * @param {number} ruleIndex - 规则索引
   * @param {Object} rule - 规则对象
   */
  showEditRuleModal(groupId, ruleIndex, rule) {
    this.currentGroupId = groupId;
    this.currentRuleIndex = ruleIndex;

    // 重置模态框状态
    this.resetAddRuleModalState();

    // 填充现有数据
    const selectorInput = document.getElementById('cssSelector');
    const propertiesContainer = document.getElementById('cssProperties');
    const modalTitle = document.querySelector('#addRuleModal .modal-title');
    const confirmBtn = document.getElementById('confirmAddRule');

    if (modalTitle) {
      modalTitle.textContent = '编辑CSS规则';
    }

    if (confirmBtn) {
      confirmBtn.textContent = '保存修改';
    }

    if (selectorInput) {
      selectorInput.value = rule.selector;
    }

    // 填充CSS属性
    if (propertiesContainer && rule.properties) {
      Object.entries(rule.properties).forEach(([prop, value]) => {
        // 查找属性配置
        let propertyConfig = null;
        for (const category in CSS_PROPERTIES) {
          if (CSS_PROPERTIES[category].properties[prop]) {
            propertyConfig = CSS_PROPERTIES[category].properties[prop];
            break;
          }
        }

        // 如果找到配置则添加属性编辑器，否则使用默认配置
        if (propertyConfig) {
          this.addPropertyEditor(prop, propertyConfig);
        } else {
          this.addPropertyEditor(prop, { type: 'text', name: prop });
        }

        // 设置属性值
        const propertyInput = propertiesContainer.querySelector(
          `[data-property="${prop}"]`
        );
        if (propertyInput) {
          propertyInput.value = value;
        }
      });
    }

    this.showModal('addRuleModal');
  }

  /**
   * 重置添加规则模态框状态
   */
  resetAddRuleModalState() {
    // 清空输入框
    const selectorInput = document.getElementById('cssSelector');
    const propertiesContainer = document.getElementById('cssProperties');
    const indicator = document.getElementById('selectorStatusIndicator');
    const suggestions = document.getElementById('selectorSuggestions');
    const modalTitle = document.querySelector('#addRuleModal .modal-title');
    const confirmBtn = document.getElementById('confirmAddRule');

    if (selectorInput) {
      selectorInput.value = '';
    }

    if (propertiesContainer) {
      propertiesContainer.innerHTML = '';
    }

    // 重置模态框标题和按钮文本
    if (modalTitle) {
      modalTitle.textContent = '添加CSS规则';
    }

    if (confirmBtn) {
      confirmBtn.textContent = '添加规则';
    }

    // 重置选择器状态指示器
    if (indicator) {
      indicator.className = 'selector-status-indicator';
    }

    // 重置建议文本
    if (suggestions) {
      // 添加隐藏动画
      if (suggestions.classList.contains('show')) {
        suggestions.className = 'selector-suggestions hide';
        setTimeout(() => {
          suggestions.textContent = '';
          suggestions.className = 'selector-suggestions';
          suggestions.style.display = 'none';
        }, 200); // 等待动画完成
      } else {
        suggestions.textContent = '';
        suggestions.className = 'selector-suggestions';
        suggestions.style.display = 'none';
      }
    }
  }

  /**
   * 显示模态框
   * @param {string} modalId - 模态框ID
   */
  showModal(modalId) {
    if (window.modalManager) {
      window.modalManager.showModal(modalId);
    }
  }

  /**
   * 隐藏模态框
   * @param {string} modalId - 模态框ID
   * @param {boolean} immediate - 是否立即隐藏，跳过动画
   */
  hideModal(modalId, immediate = false) {
    if (window.modalManager) {
      window.modalManager.hideModal(modalId, immediate);
    }
  }

  /**
   * 添加属性编辑器
   * @param {string} property - CSS属性名
   * @param {Object} config - 属性配置
   */
  addPropertyEditor(property, config) {
    const container = document.getElementById('cssProperties');
    if (!container) return;

    // 检查是否已存在该属性
    const existing = container.querySelector(`[data-property="${property}"]`);
    if (existing) {
      existing.focus();
      return;
    }

    const editor = document.createElement('div');
    editor.className = 'css-property-item';

    // 获取当前编辑的规则信息
    const currentSelector = document.getElementById('cssSelector')?.value || '';
    const currentTheme = this.appState.getCurrentTheme();
    let groupIndex = -1;
    let ruleIndex = -1;
    
    if (currentTheme && currentSelector) {
      // 查找当前选择器对应的组和规则索引
      for (let gIndex = 0; gIndex < currentTheme.groups.length; gIndex++) {
        const group = currentTheme.groups[gIndex];
        for (let rIndex = 0; rIndex < group.rules.length; rIndex++) {
          if (group.rules[rIndex].selector === currentSelector) {
            groupIndex = gIndex;
            ruleIndex = rIndex;
            break;
          }
        }
        if (groupIndex !== -1) break;
      }
    }

    const dataAttributes = `data-property="${property}" data-group-index="${groupIndex}" data-rule-index="${ruleIndex}"`;
    
    let inputHtml = '';
    switch (config.type) {
      case 'color':
        inputHtml = `<input type="color" class="form-input property-value" ${dataAttributes}>`;
        break;
      case 'range':
        inputHtml = `<input type="range" class="form-input property-value" ${dataAttributes} min="${config.min || 0}" max="${config.max || 100}" step="${config.step || 1}">`;
        break;
      case 'select':
        inputHtml = `<select class="form-input property-value" ${dataAttributes}>
          ${config.options
            .map((option) => `<option value="${option}">${option}</option>`)
            .join('')}
        </select>`;
        break;
      default:
        inputHtml = `<input type="text" class="form-input property-value" ${dataAttributes} placeholder="输入${config.name}">`;
    }

    editor.innerHTML = `
      <input type="text" class="form-input property-name" value="${property}" readonly>
      ${inputHtml}
      <button type="button" class="property-remove">×</button>
    `;

    // 添加删除事件
    editor.querySelector('.property-remove').addEventListener('click', () => {
      editor.remove();
      // 删除属性时也要清除预览效果
      this.clearPreviewForProperty(property);
      // 检测修改并更新按钮状态
      this.handleThemeChange();
    });

    // 添加实时预览事件
    const propertyInput = editor.querySelector('.property-value');
    propertyInput.addEventListener('input', (e) => {
      this.previewStyle(property, e.target.value);
      // 检测修改并更新按钮状态
      this.handleThemeChange();
    });

    // 对于select类型，也要监听change事件
    if (config.type === 'select') {
      propertyInput.addEventListener('change', (e) => {
        this.previewStyle(property, e.target.value);
        // 检测修改并更新按钮状态
        this.handleThemeChange();
      });
    }

    container.appendChild(editor);
  }

  /**
   * 实时预览样式效果
   * @param {string} property - CSS属性名
   * @param {string} value - CSS属性值
   */
  async previewStyle(property, value) {
    const selector = document.getElementById('cssSelector').value;

    if (!selector || !property || !value) {
      return;
    }

    try {
      // 通过background层路由转发消息到content script进行实时预览
      await chrome.runtime.sendMessage({
        action: 'pageBeautify',
        type: 'PREVIEW_STYLE',
        data: {
          selector: selector,
          property: property,
          value: value,
        },
      });
    } catch (error) {
      console.warn('实时预览失败:', error);
    }
  }

  /**
   * 清除特定属性的预览效果
   * @param {string} property - CSS属性名
   */
  async clearPreviewForProperty(property) {
    const selector = document.getElementById('cssSelector').value;

    if (!selector || !property) {
      return;
    }

    try {
      await chrome.runtime.sendMessage({
        action: 'pageBeautify',
        type: 'CLEAR_PREVIEW_PROPERTY',
        data: {
          selector: selector,
          property: property,
        },
      });
    } catch (error) {
      console.warn('清除预览失败:', error);
    }
  }

  /**
   * 验证CSS选择器
   */
  async validateSelector() {
    const selector = document.getElementById('cssSelector').value;
    const indicator = document.getElementById('selectorStatusIndicator');
    const suggestions = document.getElementById('selectorSuggestions');

    // 清除之前的高亮效果
    this.clearSelectorHighlight();

    if (!selector.trim()) {
      indicator.className = 'selector-status-indicator invalid animate-in';
      suggestions.textContent = '请输入CSS选择器，例如：nav, .navbar, #header';
      suggestions.className = 'selector-suggestions error';
      suggestions.style.display = 'block';
      return;
    }

    console.log('开始验证选择器:', selector);

    try {
      // 通过background层路由转发消息到content script
      const response = await chrome.runtime.sendMessage({
        action: 'pageBeautify',
        type: 'VALIDATE_SELECTOR',
        data: { selector: selector },
      });

      console.log('验证选择器结果:', response);

      if (response && response.success) {
        if (response.isValid && response.elementCount > 0) {
          indicator.className = 'selector-status-indicator valid animate-in';
          suggestions.textContent = `找到 ${response.elementCount} 个匹配元素`;
          suggestions.className = 'selector-suggestions success show';
          suggestions.style.display = 'block';
          
          // 高亮匹配的元素
          this.highlightElements(selector);
          
          // 3秒后自动清除高亮
          setTimeout(() => {
            this.clearSelectorHighlight();
          }, 3000);
        } else {
          indicator.className = 'selector-status-indicator invalid animate-in';
          suggestions.textContent =
            response.elementCount === 0 ? '未找到匹配元素' : '选择器语法错误';
          suggestions.className = 'selector-suggestions error show';
          suggestions.style.display = 'block';
          
          // 验证失败时立即清除高亮
          this.clearSelectorHighlight();
        }
      } else {
        indicator.className = 'selector-status-indicator invalid animate-in';
        suggestions.textContent = '无法连接到页面，请确保页面已加载';
        suggestions.className = 'selector-suggestions error show';
        suggestions.style.display = 'block';
        
        // 连接失败时立即清除高亮
        this.clearSelectorHighlight();
      }
    } catch (error) {
      console.error('验证选择器时发生错误:', error);
      indicator.className = 'selector-status-indicator invalid animate-in';
      suggestions.textContent = '验证失败，请确保页面已加载并刷新后重试';
      suggestions.className = 'selector-suggestions error show';
      suggestions.style.display = 'block';
      
      // 异常时立即清除高亮
      this.clearSelectorHighlight();
    }
  }

  /**
   * 清除选择器高亮效果
   */
  async clearSelectorHighlight() {
    try {
      await chrome.runtime.sendMessage({
        action: 'pageBeautify',
        type: 'CLEAR_SELECTOR_HIGHLIGHT',
        data: {},
      });
    } catch (error) {
      console.log('清除高亮失败:', error);
    }
  }

  /**
   * 添加组
   * @param {string} name - 组名
   * @param {string} description - 组描述
   */
  addGroup(name, description) {
    const theme = this.appState.getCurrentTheme();
    if (!theme) return;

    const newGroup = {
      id: Utils.generateId(),
      name,
      description,
      rules: [],
    };

    theme.groups.push(newGroup);
    this.appState.setCurrentTheme(theme);
    this.renderGroups(theme);
    
    // 检测修改并更新按钮状态（进入临时编辑模式）
    this.handleThemeChange();
    
    Utils.showToast('组已添加（临时预览）', 'success');

    // 输入框清空逻辑已移至modal-manager.js中统一处理
  }

  /**
   * 添加或更新CSS规则
   */
  addCSSRule() {
    const selector = document.getElementById('cssSelector').value;
    const properties = {};

    // 收集属性
    document.querySelectorAll('.css-property-item').forEach((editor) => {
      const propertyName = editor.querySelector('input[readonly]').value;
      const propertyValue = editor.querySelector('.property-value').value;

      if (propertyName && propertyValue) {
        properties[propertyName] = propertyValue;
      }
    });

    if (!selector.trim()) {
      Utils.showToast('请输入CSS选择器', 'error');
      return;
    }

    if (Object.keys(properties).length === 0) {
      Utils.showToast('请至少添加一个CSS属性', 'error');
      return;
    }

    const groupId = this.currentGroupId;
    const theme = this.appState.getCurrentTheme();
    const group = theme.groups.find((g) => g.id === groupId);

    if (!group) {
      Utils.showToast('无法找到目标组，请重试', 'error');
      return;
    }

    // 判断是编辑模式还是添加模式
    if (this.currentRuleIndex !== null && this.currentRuleIndex >= 0) {
      // 编辑模式：更新现有规则
      if (group.rules[this.currentRuleIndex]) {
        group.rules[this.currentRuleIndex] = { selector, properties };
        Utils.showToast('CSS规则已更新（临时预览）', 'success');
      } else {
        Utils.showToast('无法找到要编辑的规则', 'error');
        return;
      }
    } else {
      // 添加模式：新增规则
      group.rules.push({ selector, properties });
      Utils.showToast('CSS规则已添加（临时预览）', 'success');
    }

    // 更新当前主题数据（仅在内存中，不保存）
    this.appState.setCurrentTheme(theme);

    // 清除预览效果并重新应用当前编辑的主题
    this.clearAllPreview();
    setTimeout(() => {
      this.applyCurrentTheme();
    }, 100);

    this.renderGroups(theme);
    
    // 触发主题修改状态检测（进入临时编辑模式）
    this.handleThemeChange();
    
    this.hideModal('addRuleModal');
  }

  /**
   * 清除所有预览效果
   */
  async clearAllPreview() {
    try {
      await chrome.runtime.sendMessage({
        action: 'pageBeautify',
        type: 'CLEAR_ALL_PREVIEW',
        data: {},
      });
    } catch (error) {
      console.warn('清除预览失败:', error);
    }
  }

  /**
   * 设置添加规则模态框
   */
  setupAddRuleModal() {
    const modal = document.getElementById('addRuleModal');
    const closeBtn = document.getElementById('closeAddRuleModal');
    const cancelBtn = document.getElementById('cancelAddRule');
    const confirmBtn = document.getElementById('confirmAddRule');
    const validateBtn = document.getElementById('validateSelector');
    const addPropertyBtn = document.getElementById('addPropertyBtn');

    closeBtn.addEventListener('click', () => this.hideModal('addRuleModal'));
    cancelBtn.addEventListener('click', () => this.hideModal('addRuleModal'));

    // 添加防抖机制，避免频繁点击验证按钮
    validateBtn.addEventListener('click', () => {
      // 清除之前的防抖定时器
      clearTimeout(this.validateSelectorTimer);
      
      // 设置新的防抖定时器
      this.validateSelectorTimer = setTimeout(() => {
        this.validateSelector();
      }, 300); // 300ms防抖延迟
    });
    addPropertyBtn.addEventListener('click', () =>
      this.showModal('propertySelectModal')
    );

    // 选择器输入框变化时清除高亮和预览，并添加节流验证
    const selectorInput = document.getElementById('cssSelector');
    if (selectorInput) {
      selectorInput.addEventListener('input', () => {
        // 延迟清除高亮，避免频繁调用
        clearTimeout(this.clearHighlightTimer);
        this.clearHighlightTimer = setTimeout(() => {
          this.clearSelectorHighlight();
        }, 500);
        
        // 选择器改变时清除之前的预览效果
        this.clearAllPreview();
        
        // 检测修改并更新按钮状态
        this.handleThemeChange();
        
        // 清空时重置状态
        const currentValue = selectorInput.value.trim();
        if (!currentValue) {
          const indicator = document.getElementById('selectorStatusIndicator');
          const suggestions = document.getElementById('selectorSuggestions');
          if (indicator) indicator.className = 'selector-status-indicator';
          if (suggestions) {
            // 添加隐藏动画
            if (suggestions.classList.contains('show')) {
              suggestions.className = 'selector-suggestions hide';
              setTimeout(() => {
                suggestions.textContent = '';
                suggestions.className = 'selector-suggestions';
                suggestions.style.display = 'none';
              }, 200); // 等待动画完成
            } else {
              suggestions.style.display = 'none';
            }
          }
        }
      });
    }

    confirmBtn.addEventListener('click', () => {
      this.addCSSRule();
    });
  }

  /**
   * 设置属性选择模态框
   */
  setupPropertySelectModal() {
    const modal = document.getElementById('propertySelectModal');
    const closeBtn = document.getElementById('closePropertySelectModal');

    closeBtn.addEventListener('click', () =>
      this.hideModal('propertySelectModal')
    );

    this.renderPropertyCategories();
  }

  /**
   * 渲染属性分类
   */
  renderPropertyCategories() {
    const container = document.getElementById('propertyCategories');
    container.innerHTML = '';

    Object.entries(CSS_PROPERTIES).forEach(([categoryKey, category]) => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'property-category';
      categoryDiv.innerHTML = `
        <div class="property-category-header">${category.name}</div>
        <div class="property-category-list">
          ${Object.entries(category.properties)
            .map(
              ([propKey, prop]) => `
            <div class="property-item" data-property="${propKey}" data-category="${categoryKey}">
              <div class="property-name-cn">${prop.name}</div>
              <div class="property-name-en">${propKey}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `;

      // 添加属性选择事件
      categoryDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('property-item')) {
          const property = e.target.dataset.property;
          const category = e.target.dataset.category;
          this.addPropertyEditor(
            property,
            CSS_PROPERTIES[category].properties[property]
          );
          // 检测修改并更新按钮状态
          this.handleThemeChange();
          // 立即关闭模态框，避免动画延迟导致的卡顿
          this.hideModal('propertySelectModal', true);
        }
      });

      container.appendChild(categoryDiv);
    });
  }

  /**
   * 清空模态框输入
   * @param {string} modalId - 模态框ID
   */
  clearModalInputs(modalId) {
    const modal = document.getElementById(modalId);
    const inputs = modal.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      if (input.type === 'color') {
        input.value = '#000000'; // 颜色输入框设置默认黑色
      } else {
        input.value = '';
      }
    });
  }

  /**
   * 初始化模态框
   */
  initializeModals() {
    // 添加组模态框
    this.setupAddGroupModal();

    // 添加规则模态框
    this.setupAddRuleModal();

    // 属性选择模态框
    this.setupPropertySelectModal();
  }

  /**
   * 设置添加组模态框
   */
  setupAddGroupModal() {
    const modal = document.getElementById('addGroupModal');
    const closeBtn = document.getElementById('closeAddGroupModal');
    const cancelBtn = document.getElementById('cancelAddGroup');
    const confirmBtn = document.getElementById('confirmAddGroup');

    closeBtn.addEventListener('click', () => this.hideModal('addGroupModal'));
    cancelBtn.addEventListener('click', () => this.hideModal('addGroupModal'));

    // confirmAddGroup按钮的事件已在modal-manager.js中统一处理，避免重复绑定
  }

  /**
   * 显示模态框
   * @param {string} modalId - 模态框ID
   */
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error('模态框不存在:', modalId);
      return;
    }

    // 使用全局modal管理器的统一管理
    if (window.modalManager) {
      window.modalManager.showModal(modalId);
    } else {
      // 备用方案：直接显示模态框
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
  }

  /**
   * 隐藏模态框
   * @param {string} modalId - 模态框ID
   * @param {boolean} immediate - 是否立即隐藏，跳过动画
   */
  hideModal(modalId, immediate = false) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error('模态框不存在:', modalId);
      return;
    }
    
    // 使用全局modal管理器的滚动解锁功能
    if (window.modalManager) {
      window.modalManager.hideModal(modalId, immediate);
    } else {
      // 备用方案：直接隐藏模态框
      modal.style.display = 'none';
      modal.classList.remove('show');
    }
    
    this.clearModalInputs(modalId);
  }

  /**
   * 清空模态框输入
   * @param {string} modalId - 模态框ID
   */
  clearModalInputs(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const inputs = modal.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      if (input.type === 'color') {
        input.value = '#000000'; // 颜色输入框设置默认黑色
      } else {
        input.value = '';
      }
    });
  }

  /**
   * 渲染URL配置
   * @param {Object} theme - 主题数据
   */
  renderUrlPatterns(theme) {
    const container = document.getElementById('urlPatternsList');
    if (!container) {
      console.warn('URL模式列表容器不存在');
      return;
    }

    // 清空现有内容
    container.innerHTML = '';

    // 检查是否为预制主题
    const isPresetTheme = theme.originalId && this.appState.getPresetThemes().some(t => t.id === theme.originalId);

    // 获取URL模式列表
    const urlPatterns = theme.urlPatterns || [];

    if (urlPatterns.length === 0) {
      // 根据主题类型显示不同的空状态提示
      const emptyMessage = isPresetTheme ? 
        '<small>此预制主题暂无配置网站</small>' : 
        '<small>点击下方按钮添加适用的网站</small>';
      
      container.innerHTML = `
        <div class="url-pattern-empty">
          <div class="empty-icon">🌐</div>
          <p>暂无配置网站</p>
          ${emptyMessage}
        </div>
      `;
    } else {
      // 渲染URL模式列表
      urlPatterns.forEach((urlPattern, index) => {
        const patternItem = this.createUrlPatternItem(urlPattern, index, isPresetTheme);
        container.appendChild(patternItem);
      });
    }

    // 注意：事件绑定已在初始化时完成，这里不再重复绑定
  }

  /**
   * 创建URL模式项
   * @param {Object} urlPattern - URL模式数据
   * @param {number} index - 索引
   * @param {boolean} isPresetTheme - 是否为预制主题
   * @returns {HTMLElement} URL模式项元素
   */
  createUrlPatternItem(urlPattern, index, isPresetTheme = false) {
    const item = document.createElement('div');
    item.className = `url-pattern-item ${urlPattern.enabled ? '' : 'disabled'}`;
    item.dataset.index = index;

    // 根据是否为预制主题决定是否显示删除按钮和禁用编辑
    const removeButton = isPresetTheme ? '' : `
      <button type="button" class="url-pattern-remove" 
              data-index="${index}" title="删除此模式">×</button>`;
    
    const inputReadonly = isPresetTheme ? 'readonly' : '';
    const selectDisabled = isPresetTheme ? 'disabled' : '';
    const toggleDisabled = isPresetTheme ? 'style="pointer-events: none; opacity: 0.6;"' : '';

    item.innerHTML = `
      <div class="url-pattern-toggle ${urlPattern.enabled ? 'enabled' : ''}" 
           data-index="${index}" title="${urlPattern.enabled ? '禁用' : '启用'}此模式" ${toggleDisabled}></div>
      <input type="text" class="url-pattern-input" 
             value="${Utils.escapeHtml(urlPattern.pattern || '')}" 
             placeholder="输入网站地址或模式" 
             data-index="${index}" ${inputReadonly}>
      <select class="url-pattern-type" data-index="${index}" ${selectDisabled}>
        <option value="wildcard" ${urlPattern.type === 'wildcard' ? 'selected' : ''}>通配符</option>
        <option value="exact" ${urlPattern.type === 'exact' ? 'selected' : ''}>精确匹配</option>
        <option value="regex" ${urlPattern.type === 'regex' ? 'selected' : ''}>正则表达式</option>
      </select>
      ${removeButton}
    `;

    // 立即验证URL模式并应用样式
    const inputElement = item.querySelector('.url-pattern-input');
    if (inputElement && urlPattern.pattern) {
      // 获取当前URL并验证模式
      chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        const currentUrl = tabs[0]?.url;
        if (currentUrl) {
          this.validateUrlPattern(inputElement, urlPattern.pattern, currentUrl).catch(console.error);
        }
      }).catch(console.error);
    }

    return item;
  }

  /**
   * 绑定URL配置事件
   */
  bindUrlPatternEvents() {
    // 绑定添加URL模式按钮
    const addBtn = document.getElementById('addUrlPatternBtn');
    if (addBtn) {
      addBtn.removeEventListener('click', this.handleAddUrlPattern);
      addBtn.addEventListener('click', this.handleAddUrlPattern.bind(this));
    }

    // 绑定添加当前网站按钮
    const addCurrentBtn = document.getElementById('addCurrentUrlBtn');
    if (addCurrentBtn) {
      addCurrentBtn.removeEventListener('click', this.handleAddCurrentUrl);
      addCurrentBtn.addEventListener('click', this.handleAddCurrentUrl.bind(this));
    }

    // 绑定URL模式项事件（重新绑定容器事件）
    const container = document.getElementById('urlPatternsList');
    if (container) {
      // 使用事件委托处理所有URL模式项的事件
      container.removeEventListener('click', this.handleUrlPatternClick);
      container.addEventListener('click', this.handleUrlPatternClick.bind(this));
      
      container.removeEventListener('input', this.handleUrlPatternInput);
      container.addEventListener('input', this.handleUrlPatternInput.bind(this));
      
      container.removeEventListener('change', this.handleUrlPatternChange);
      container.addEventListener('change', this.handleUrlPatternChange.bind(this));
    }
  }

  /**
   * 处理添加URL模式
   */
  handleAddUrlPattern() {
    const currentTheme = this.appState.getCurrentTheme();
    if (!currentTheme) return;

    // 确保urlPatterns数组存在
    if (!currentTheme.urlPatterns) {
      currentTheme.urlPatterns = [];
    }

    // 添加新的URL模式
    const newPattern = {
      pattern: '',
      type: 'wildcard',
      enabled: true
    };

    currentTheme.urlPatterns.push(newPattern);

    // 重新渲染
    this.renderUrlPatterns(currentTheme);
    
    // 标记为有更改
    this.handleThemeChange();

    // 聚焦到新添加的输入框
    setTimeout(() => {
      const inputs = document.querySelectorAll('.url-pattern-input');
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) {
        lastInput.focus();
      }
    }, 100);
  }

  /**
   * 处理添加当前网站
   */
  async handleAddCurrentUrl() {
    try {
      // 获取当前活动标签页的URL
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tabs[0]?.url;
      
      if (!currentUrl) {
        Utils.showToast('无法获取当前网站地址', 'error');
        return;
      }

      // 提取域名
      const domain = Utils.extractDomain(currentUrl);
      if (!domain) {
        Utils.showToast('无法解析当前网站域名', 'error');
        return;
      }

      const currentTheme = this.appState.getCurrentTheme();
      if (!currentTheme) return;

      // 确保urlPatterns数组存在
      if (!currentTheme.urlPatterns) {
        currentTheme.urlPatterns = [];
      }

      // 生成带www和不带www的两个模式
      const patterns = [];
      
      if (domain.startsWith('www.')) {
        // 如果当前域名带www，添加带www和不带www的模式
        const domainWithoutWww = domain.substring(4);
        patterns.push(`*://${domain}/*`);        // 带www
        patterns.push(`*://${domainWithoutWww}/*`); // 不带www
      } else {
        // 如果当前域名不带www，添加不带www和带www的模式
        patterns.push(`*://${domain}/*`);        // 不带www
        patterns.push(`*://www.${domain}/*`);    // 带www
      }
      
      // 检查是否已存在相同的模式
      const existingPatterns = currentTheme.urlPatterns.map(p => p.pattern);
      const newPatterns = patterns.filter(pattern => !existingPatterns.includes(pattern));
      
      if (newPatterns.length === 0) {
        Utils.showToast('当前网站的所有变体已在配置列表中', 'warning');
        return;
      }

      // 添加新的URL模式
      newPatterns.forEach(pattern => {
        currentTheme.urlPatterns.push({
          pattern: pattern,
          type: 'wildcard',
          enabled: true
        });
      });

      // 重新渲染
      this.renderUrlPatterns(currentTheme);
      
      // 标记为有更改，进入临时编辑模式
      this.handleThemeChange();

      // 立即应用主题（临时应用）
      try {
        // 获取当前活动标签页的URL
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentUrl = tabs[0]?.url;
        
        if (currentUrl) {
          const isUrlMatch = Utils.isThemeMatchUrl(currentTheme, currentUrl);
          if (isUrlMatch) {
            // URL匹配，立即应用主题
            const success = await chromeApi.applyTheme(currentTheme);
            if (success) {
              console.log('添加URL模式后立即应用主题成功');
            }
          }
        }
      } catch (error) {
        console.warn('立即应用主题失败:', error);
      }

      const addedCount = newPatterns.length;
      const domainName = domain.startsWith('www.') ? domain.substring(4) : domain;
      Utils.showToast(`已添加网站：${domainName}（${addedCount}个模式）`, 'success');
      
    } catch (error) {
      console.error('添加当前网站失败:', error);
      Utils.showToast('添加当前网站失败', 'error');
    }
  }

  /**
   * 处理URL模式点击事件
   * @param {Event} event - 点击事件
   */
  handleUrlPatternClick(event) {
    const target = event.target;
    
    if (target.classList.contains('url-pattern-toggle')) {
      // 切换启用/禁用状态
      const index = parseInt(target.dataset.index);
      this.toggleUrlPattern(index);
    } else if (target.classList.contains('url-pattern-remove')) {
      // 删除URL模式
      const index = parseInt(target.dataset.index);
      this.removeUrlPattern(index);
    }
  }

  /**
   * 处理URL模式输入事件
   * @param {Event} event - 输入事件
   */
  handleUrlPatternInput(event) {
    const target = event.target;
    
    if (target.classList.contains('url-pattern-input')) {
      const index = parseInt(target.dataset.index);
      const value = target.value;
      
      // 实时校验URL格式
      this.throttledValidateUrl(target, value);
      
      // 防抖更新URL模式值
      this.debouncedUpdateUrlPattern(index, 'pattern', value);
    }
  }

  /**
   * 处理URL模式变化事件
   * @param {Event} event - 变化事件
   */
  handleUrlPatternChange(event) {
    const target = event.target;
    
    if (target.classList.contains('url-pattern-type')) {
      const index = parseInt(target.dataset.index);
      const value = target.value;
      this.updateUrlPatternValue(index, 'type', value);
    }
  }

  /**
   * 切换URL模式启用状态
   * @param {number} index - 模式索引
   */
  toggleUrlPattern(index) {
    const currentTheme = this.appState.getCurrentTheme();
    if (!currentTheme || !currentTheme.urlPatterns || !currentTheme.urlPatterns[index]) {
      return;
    }

    // 切换状态
    currentTheme.urlPatterns[index].enabled = !currentTheme.urlPatterns[index].enabled;
    const newEnabled = currentTheme.urlPatterns[index].enabled;
    
    // 直接更新DOM元素，避免重新渲染整个列表
    const container = document.getElementById('urlPatternsList');
    if (container) {
      const item = container.querySelector(`[data-index="${index}"]`);
      if (item) {
        const toggle = item.querySelector('.url-pattern-toggle');
        if (toggle) {
          // 更新切换按钮状态
          if (newEnabled) {
            toggle.classList.add('enabled');
            toggle.title = '禁用此模式';
          } else {
            toggle.classList.remove('enabled');
            toggle.title = '启用此模式';
          }
        }
        
        // 更新项目容器状态
        if (newEnabled) {
          item.classList.remove('disabled');
        } else {
          item.classList.add('disabled');
        }
      }
    }
    
    // 标记为有更改
    this.handleThemeChange();
    
    // 立即重新应用主题以更新页面样式
    this.applyCurrentTheme();
  }

  /**
   * 删除URL模式
   * @param {number} index - 模式索引
   */
  removeUrlPattern(index) {
    const currentTheme = this.appState.getCurrentTheme();
    if (!currentTheme || !currentTheme.urlPatterns || !currentTheme.urlPatterns[index]) {
      return;
    }

    currentTheme.urlPatterns.splice(index, 1);
    
    // 重新渲染
    this.renderUrlPatterns(currentTheme);
    
    // 标记为有更改
    this.handleThemeChange();
    
    // 立即重新应用主题以更新页面样式
    this.applyCurrentTheme();
  }

  /**
   * 更新URL模式值
   * @param {number} index - 模式索引
   * @param {string} field - 字段名
   * @param {any} value - 新值
   */
  updateUrlPatternValue(index, field, value) {
    const currentTheme = this.appState.getCurrentTheme();
    if (!currentTheme || !currentTheme.urlPatterns || !currentTheme.urlPatterns[index]) {
      return;
    }

    currentTheme.urlPatterns[index][field] = value;
    
    // 标记为有更改
    this.handleThemeChange();
    
    // 立即重新应用主题以更新页面样式
    this.applyCurrentTheme();
  }
  
  /**
   * 校验URL模式是否匹配当前页面
   * @param {HTMLElement} inputElement - 输入框元素
   * @param {string} value - URL模式值
   * @param {string} currentUrl - 当前页面URL（可选，如果不提供则自动获取）
   */
  async validateUrlPattern(inputElement, value, currentUrl = null) {
    // 移除之前的校验状态
    inputElement.classList.remove('url-pattern-valid', 'url-pattern-invalid');
    
    if (!value.trim()) {
      // 空值不显示状态
      return;
    }
    
    try {
      // 如果没有提供currentUrl，则获取当前页面URL
      if (!currentUrl) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        currentUrl = tabs[0]?.url;
      }
      
      if (!currentUrl) {
        // 无法获取当前URL时，不显示状态
        inputElement.title = '无法获取当前页面URL';
        return;
      }
      
      // 基本格式检查，确保模式不会导致错误
      let isValidFormat = true;
      try {
        // 简单检查是否会导致正则表达式错误
        if (value.includes('**')) {
          isValidFormat = false;
        } else {
          // 测试能否转换为正则表达式
          const regexPattern = value
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
          new RegExp(`^${regexPattern}$`, 'i');
        }
      } catch (error) {
        isValidFormat = false;
      }
      
      if (!isValidFormat) {
        inputElement.classList.add('url-pattern-invalid');
        inputElement.title = '模式格式错误';
        return;
      }
      
      // 进行实际匹配测试
      const { URL_MATCHER } = await import('../core/constants.js');
      const isMatch = URL_MATCHER.isMatch(currentUrl, value, 'wildcard');
      
      // 根据匹配结果设置状态
      if (isMatch) {
        inputElement.classList.add('url-pattern-valid');
        inputElement.title = `✓ 匹配当前页面: ${currentUrl}`;
      } else {
        inputElement.classList.add('url-pattern-invalid');
        inputElement.title = `✗ 不匹配当前页面: ${currentUrl}`;
      }
      
    } catch (error) {
      console.error('URL匹配验证失败:', error);
      inputElement.title = '验证失败';
    }
  }
  
  /**
   * 校验通配符模式
   * @param {string} pattern - 通配符模式
   * @returns {boolean} 是否有效
   */
  validateWildcardPattern(pattern) {
    // 基本通配符规则：
    // 1. 可以包含 * 通配符
    // 2. 不能连续出现多个 *
    // 3. 域名部分不能为空
    // 4. 验证通配符模式的合理性
    
    if (pattern.includes('**')) {
      return false; // 不允许连续通配符
    }
    
    // 特殊情况：单独的 * 表示匹配所有URL
    if (pattern === '*') {
      return true;
    }
    
    // 检查基本格式
    try {
      // 将通配符模式转换为正则表达式进行测试
      const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
        .replace(/\*/g, '.*') // * 转换为 .*
        .replace(/\?/g, '.'); // ? 转换为 .
      
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      
      // 验证正则表达式是否有效
      if (!regex) {
        return false;
      }
      
      // 检查模式的合理性：
      // 1. 如果包含协议部分，应该是完整的协议格式
      if (pattern.includes('://')) {
        const protocolPart = pattern.split('://')[0];
        const domainPart = pattern.split('://')[1];
        
        // 协议部分检查
        if (protocolPart !== '*' && protocolPart !== 'http' && protocolPart !== 'https') {
          return false;
        }
        
        // 域名部分不能为空
        if (!domainPart || domainPart.trim() === '') {
          return false;
        }
        
        // 域名部分应该包含有效字符（不能只是通配符和特殊字符）
        const cleanDomain = domainPart.replace(/[*?]/g, '').replace(/\//g, '');
        if (cleanDomain.length === 0) {
          return false;
        }
      } else {
        // 如果没有协议部分，检查是否为有效的域名模式
        const cleanPattern = pattern.replace(/[*?]/g, '').replace(/\//g, '');
        if (cleanPattern.length === 0) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 校验URL格式
   * @param {string} url - URL字符串
   * @returns {boolean} 是否有效
   */
  validateUrlFormat(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 校验域名格式
   * @param {string} domain - 域名字符串
   * @returns {boolean} 是否有效
   */
  validateDomainFormat(domain) {
    // 基本域名格式校验
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }

  /**
   * 设置主题编辑器只读状态
   * @param {boolean} readOnly - 是否只读
   */
  setThemeEditorReadOnly(readOnly) {
    // 禁用/启用主题名称输入框
    const themeNameInput = document.getElementById('themeName');
    if (themeNameInput) {
      themeNameInput.disabled = readOnly;
      if (readOnly) {
        themeNameInput.style.backgroundColor = '#f5f5f5';
        themeNameInput.style.cursor = 'not-allowed';
      } else {
        themeNameInput.style.backgroundColor = '';
        themeNameInput.style.cursor = '';
      }
    }

    // 禁用/启用主题描述输入框
    const themeDescInput = document.getElementById('themeDescription');
    if (themeDescInput) {
      themeDescInput.disabled = readOnly;
      if (readOnly) {
        themeDescInput.style.backgroundColor = '#f5f5f5';
        themeDescInput.style.cursor = 'not-allowed';
      } else {
        themeDescInput.style.backgroundColor = '';
        themeDescInput.style.cursor = '';
      }
    }

    // 隐藏/显示添加组按钮
    const addGroupBtn = document.getElementById('addGroupBtn');
    if (addGroupBtn) {
      if (readOnly) {
        addGroupBtn.style.display = 'none';
      } else {
        addGroupBtn.style.display = '';
        addGroupBtn.disabled = false;
        addGroupBtn.style.opacity = '';
        addGroupBtn.style.cursor = '';
      }
    }

    // 禁用/启用所有组的编辑功能
    const groupsSection = document.getElementById('groupsSection');
    if (groupsSection) {
      const editableElements = groupsSection.querySelectorAll('input, textarea, select, button');
      editableElements.forEach(element => {
        // 排除另存为按钮
        if (element.id === 'saveAsThemeBtn') {
          return;
        }
        
        element.disabled = readOnly;
        if (readOnly) {
          element.style.opacity = '0.6';
          element.style.cursor = 'not-allowed';
        } else {
          element.style.opacity = '';
          element.style.cursor = '';
        }
      });
    }

    // 特别禁用添加规则和删除组按钮
    const addRuleButtons = document.querySelectorAll('[data-action="add-rule"]');
    addRuleButtons.forEach(button => {
      button.disabled = readOnly;
      if (readOnly) {
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
      } else {
        button.style.opacity = '';
        button.style.cursor = '';
      }
    });

    const deleteGroupButtons = document.querySelectorAll('[data-action="delete-group"]');
    deleteGroupButtons.forEach(button => {
      button.disabled = readOnly;
      if (readOnly) {
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
      } else {
        button.style.opacity = '';
        button.style.cursor = '';
      }
    });

    // 禁用删除规则按钮
    const deleteRuleButtons = document.querySelectorAll('.delete-rule-btn');
    deleteRuleButtons.forEach(button => {
      button.disabled = readOnly;
      if (readOnly) {
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
      } else {
        button.style.opacity = '';
        button.style.cursor = '';
      }
    });

    // 禁用编辑规则按钮
    const editRuleButtons = document.querySelectorAll('.edit-rule-btn');
    editRuleButtons.forEach(button => {
      button.disabled = readOnly;
      if (readOnly) {
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
      } else {
        button.style.opacity = '';
        button.style.cursor = '';
      }
    });

    // 禁用组切换按钮
     const groupToggles = document.querySelectorAll('.group-toggle');
     groupToggles.forEach(toggle => {
       if (readOnly) {
         toggle.style.pointerEvents = 'none';
         toggle.style.opacity = '0.6';
         toggle.style.cursor = 'not-allowed';
       } else {
         toggle.style.pointerEvents = '';
         toggle.style.opacity = '';
         toggle.style.cursor = '';
       }
     });

    // 隐藏/显示URL规则编辑按钮
    const urlPatternsContainer = document.querySelector('.url-patterns-container');
    if (urlPatternsContainer) {
      // 隐藏/显示添加按钮
      const actionButtons = urlPatternsContainer.querySelectorAll('.url-pattern-actions button');
      actionButtons.forEach(button => {
        if (readOnly) {
          button.style.display = 'none';
        } else {
          button.style.display = '';
          button.disabled = false;
          button.style.opacity = '';
          button.style.cursor = '';
        }
      });
      
      // 对于非预制主题，恢复其他元素的正常状态
      if (!readOnly) {
        const otherElements = urlPatternsContainer.querySelectorAll('input:not([readonly]), select:not([disabled])');
        otherElements.forEach(element => {
          element.disabled = false;
          element.style.opacity = '';
          element.style.cursor = '';
        });
      }
    }
  }
}