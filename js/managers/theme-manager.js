/**
 * 主题管理器模块
 * 负责主题的创建、编辑、删除、应用等核心功能
 */

import { Utils } from '../core/utils.js';
import { chromeApi } from '../services/chrome-api.js';
import { CSS_PROPERTIES } from '../core/constants.js';

/**
 * 主题管理器类
 * 处理主题相关的所有业务逻辑
 */
export class ThemeManager {
  constructor(appState) {
    this.appState = appState;
    this.isInitialized = false;
    
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
   * 处理删除组的异步确认
   * @param {string} groupId - 组ID
   */
  async handleDeleteGroup(groupId) {
    const confirmed = await this.showConfirmDialog('确定要删除这个组吗？', {
      title: '删除确认',
      type: 'warning',
      confirmText: '删除',
      cancelText: '取消'
    });
    
    if (confirmed) {
      this.deleteGroup(groupId);
    }
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
      this.initializeModals();
      this.renderThemes();
      await this.restoreAppliedTheme();
      this.isInitialized = true;
    } catch (error) {
      console.error('主题管理器初始化失败:', error);
      Utils.showToast('主题管理器初始化失败', 'error');
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
      noneTheme.addEventListener('click', () => {
        this.selectNoneTheme();
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
        <h4>${Utils.escapeHtml(theme.name)}</h4>
        <p>${Utils.escapeHtml(theme.description || '')}</p>
      `;
    } else {
      // 自定义主题使用带操作按钮的布局
      card.innerHTML = `
        <div class="custom-theme-info">
          <h5>${Utils.escapeHtml(theme.name)}</h5>
          <p>${Utils.escapeHtml(theme.description || '无描述')}</p>
        </div>
        <div class="custom-theme-actions">
          <button title="编辑" data-action="edit" data-id="${theme.id}">✏️</button>
          <button title="删除" data-action="delete" data-id="${theme.id}">🗑️</button>
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
      card.addEventListener('click', () => {
        this.selectPresetTheme(theme);
      });
    } else {
      // 自定义主题点击选择
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-theme-actions')) {
          this.selectCustomTheme(theme);
        }
      });

      // 处理操作按钮
      card.addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;

        if (action === 'edit') {
          this.editCustomTheme(id);
        } else if (action === 'delete') {
          await this.deleteCustomTheme(id);
        }
      });
    }
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
  selectPresetTheme(theme) {
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
      this.selectNoneTheme();
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
  selectCustomTheme(theme) {
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
  selectNoneTheme(applyTheme = true) {
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
      // 应用主题样式
      const success = await chromeApi.applyTheme(currentTheme);
      if (success) {
        // 如果是预制主题的副本，保存原始主题ID
        const themeIdToSave = currentTheme.originalId || currentTheme.id;
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
  editCustomTheme(themeId) {
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
    if (theme) {
      const confirmed = await this.showConfirmDialog(`确定要删除主题 "${theme.name}" 吗？`, {
        title: '删除主题',
        type: 'danger',
        confirmText: '删除',
        cancelText: '取消'
      });
      
      if (confirmed) {
        const wasAppliedTheme = this.appState.appliedThemeId === themeId;
        await this.appState.removeCustomTheme(themeId);
      
        // 如果删除的是当前主题，清空编辑器
        if (this.appState.currentTheme && this.appState.currentTheme.id === themeId) {
          this.appState.setCurrentTheme(null);
          this.hideThemeEditor();
        }
        
        // 如果删除的是当前应用的主题，或者没有任何主题被选中，自动选择无主题
        if (wasAppliedTheme || !this.appState.appliedThemeId) {
          this.selectNoneTheme(true);
        }
        
        Utils.showToast(`主题 "${theme.name}" 已删除`, 'success');
      }
    }
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
      this.selectNoneTheme(false);
      return;
    }

    console.log('开始恢复主题:', appliedThemeId);

    // 查找并选中对应的主题（恢复UI状态和显示内容，但不重新应用主题）
    if (appliedThemeId === 'none' || appliedThemeId === 'default') {
      // 恢复无主题选中状态（兼容旧的default值）
      this.selectNoneTheme(false);
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
  createNewTheme() {
    const newTheme = {
      id: Utils.generateId(),
      name: this.appState.generateUniqueThemeName('新主题'),
      description: '自定义主题',
      groups: [],
      isCustom: true
    };

    // 设置为当前主题并自动应用
    this.appState.setCurrentTheme(newTheme);
    this.appState.setAppliedThemeId(newTheme.id);
    this.showThemeEditor(newTheme);
    
    // 更新主题选择状态
    this.updateThemeSelection();
    
    Utils.showToast(`已创建新主题 "${newTheme.name}"`, 'success');
  }



  /**
   * 保存当前主题
   */
  async saveCurrentTheme() {
    try {
      const currentTheme = this.appState.getCurrentTheme();
      if (!currentTheme) {
        Utils.showToast('没有要保存的主题', 'warning');
        return;
      }

      await this.appState.addCustomTheme(currentTheme);
      Utils.showToast(`主题 "${currentTheme.name}" 已保存`, 'success');
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
        isCustom: true
      };

      // 保存新主题
      await this.appState.addCustomTheme(newTheme);
      
      // 设置为当前主题并应用
      this.appState.setCurrentTheme(newTheme);
      this.appState.setAppliedThemeId(newTheme.id);
      
      // 更新UI状态
      this.updateThemeSelection();
      this.updateThemeActions(newTheme);
      
      Utils.showToast(`主题 "${newTheme.name}" 已保存`, 'success');
    } catch (error) {
      console.error('另存为失败:', error);
      Utils.showToast('另存为失败: ' + error.message, 'error');
    }
  }

  /**
   * 导出当前主题
   */
  exportCurrentTheme() {
    const currentTheme = this.appState.getCurrentTheme();
    if (!currentTheme) {
      Utils.showToast('没有要导出的主题', 'warning');
      return;
    }

    const filename = `${currentTheme.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_theme.json`;
    Utils.exportJSON(currentTheme, filename);
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
      this.appState.setCurrentTheme(themeData);
      
      Utils.showToast(`主题 "${themeData.name}" 导入成功`, 'success');
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
    }

    const themeDescription = document.getElementById('themeDescription');
    if (themeDescription) {
      themeDescription.value = targetTheme.description || '';
    }

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
   * 更新主题操作按钮
   * @param {Object} theme - 主题数据
   */
  updateThemeActions(theme) {
    const saveBtn = document.getElementById('saveThemeBtn');
    const saveAsBtn = document.getElementById('saveAsThemeBtn');

    if (!saveBtn || !saveAsBtn) return;

    // 检查当前主题是否已存在于自定义主题中
    const existingTheme = this.appState.customThemes.find((t) => t.id === theme.id);
    const isExistingCustomTheme = existingTheme && theme.isCustom;

    if (isExistingCustomTheme) {
      // 已存在的自定义主题 - 显示保存按钮，隐藏另存为按钮
      saveBtn.style.display = 'inline-block';
      saveAsBtn.style.display = 'none';
    } else {
      // 新主题或预设主题 - 隐藏保存按钮，显示另存为按钮
      saveBtn.style.display = 'none';
      saveAsBtn.style.display = 'inline-block';
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
          <p>暂无样式组，点击下方按钮添加第一个组</p>
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
    card.innerHTML = `
      <div class="group-header" data-group-id="${group.id}">
        <div>
          <div class="group-title">${Utils.escapeHtml(group.name)}</div>
          <div class="group-description">${Utils.escapeHtml(group.description || '')}</div>
        </div>
        <div class="group-actions">
          <button class="btn btn-sm btn-outline" data-action="add-rule" data-group-id="${
            group.id
          }">添加规则</button>
          <button class="btn btn-sm btn-outline" data-action="delete-group" data-group-id="${
            group.id
          }">删除组</button>
          <span class="group-toggle">▼</span>
        </div>
      </div>
      <div class="group-content" id="group-content-${group.id}">
        <div class="css-rules-list" id="rules-list-${group.id}">
          ${this.renderCSSRules(group.rules, group.id)}
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
   * @returns {string} 规则HTML字符串
   */
  renderCSSRules(rules, groupId) {
    if (!rules || rules.length === 0) {
      return '<div class="empty-rules">暂无CSS规则，点击"添加规则"开始添加</div>';
    }

    return rules.map((rule, index) => {
      const propertiesHtml = Object.entries(rule.properties || {})
        .map(([prop, value]) => {
          return `
            <div class="css-property">
              <span class="css-property-name">${Utils.escapeHtml(prop)}:</span>
              <span class="css-property-value">${Utils.escapeHtml(value)};</span>
            </div>
          `;
        })
        .join('');

      return `
        <div class="css-rule-item" data-rule-selector="${Utils.escapeHtml(rule.selector)}" data-rule-index="${index}" data-group-id="${groupId}">
          <div class="css-rule-header">
            <div class="css-rule-selector">
              <span class="selector-text">${Utils.escapeHtml(rule.selector)}</span>
              <span class="selector-status" data-status="unknown">●</span>
            </div>
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
            </div>
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
      const action = e.target.dataset.action;
      const groupId = e.target.dataset.groupId;
      const ruleIndex = e.target.dataset.ruleIndex;

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
        const ruleIndex = parseInt(btn.dataset.ruleIndex);
        const groupId = btn.dataset.groupId;
        // 移除高亮效果
        this.removeElementHighlight();
        this.editRule(groupId, ruleIndex);
      } else if (e.target.closest('.delete-rule-btn')) {
        const btn = e.target.closest('.delete-rule-btn');
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
   * @param {number} groupIndex - 组索引
   */
  async deleteGroup(groupIndex) {
    const currentTheme = this.appState.getCurrentTheme();
    if (!currentTheme || !currentTheme.groups[groupIndex]) {
      return;
    }

    const group = currentTheme.groups[groupIndex];
    const confirmed = await this.showConfirmDialog(`确定要删除组 "${group.name}" 吗？`, {
      title: '删除确认',
      type: 'warning',
      confirmText: '删除',
      cancelText: '取消'
    });
    
    if (!confirmed) {
      return;
    }

    currentTheme.groups.splice(groupIndex, 1);
    this.appState.setCurrentTheme(currentTheme);
    this.renderGroups(currentTheme);
    
    Utils.showToast('组已删除', 'success');
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
      type: 'warning',
      confirmText: '删除',
      cancelText: '取消'
    });
    
    if (!confirmed) {
      return;
    }

    currentTheme.groups[groupIndex].rules.splice(ruleIndex, 1);
    this.appState.setCurrentTheme(currentTheme);
    this.renderGroups(currentTheme);
    
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
        const currentTheme = this.appState.currentTheme;
        if (currentTheme) {
          // 直接应用当前编辑的主题，确保页面显示与编辑器一致
          try {
            const success = await chromeApi.applyTheme(currentTheme);
            if (success) {
              // 重要：保存当前编辑主题的ID，确保刷新后能恢复
              // 如果是预制主题的副本，需要找到原始主题ID
              let themeIdToSave = currentTheme.id;
              if (currentTheme.isCustom && currentTheme.originalId) {
                themeIdToSave = currentTheme.originalId;
              } else if (currentTheme.isCustom) {
                // 如果是自定义主题，检查是否已保存
                const existingTheme = this.appState.customThemes.find(t => t.id === currentTheme.id);
                if (!existingTheme) {
                  // 如果是未保存的预制主题副本，不保存appliedThemeId
                  Utils.showToast('预览已重置，当前编辑主题已应用', 'success');
                  return;
                }
              }
              
              await this.appState.setAppliedThemeId(themeIdToSave);
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
  exportCurrentTheme() {
    const currentTheme = this.appState.getCurrentTheme();
    if (!currentTheme) {
      Utils.showToast('没有要导出的主题', 'warning');
      return;
    }

    const filename = `${currentTheme.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_theme.json`;
    Utils.exportJSON(currentTheme, filename);
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
      type: 'warning',
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

    // 保存主题变更
    this.appState.updateCustomTheme(theme);

    // 重新渲染主题列表
    this.renderThemes();

    // 重新渲染主题编辑器内容
    this.showThemeEditor(theme);

    // 重新应用主题
    if (this.appState.getAppliedThemeId() === theme.id) {
      chromeApi.applyTheme(theme);
    }

    Utils.showToast("CSS规则已删除", "success");
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
      suggestions.textContent = '';
      suggestions.className = 'selector-suggestions';
      suggestions.style.display = 'none';
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

    let inputHtml = '';
    switch (config.type) {
      case 'color':
        inputHtml = `<input type="color" class="form-input property-value" data-property="${property}">`;
        break;
      case 'range':
        inputHtml = `<input type="range" class="form-input property-value" data-property="${property}" min="${config.min || 0}" max="${config.max || 100}" step="${config.step || 1}">`;
        break;
      case 'select':
        inputHtml = `<select class="form-input property-value" data-property="${property}">
          ${config.options
            .map((option) => `<option value="${option}">${option}</option>`)
            .join('')}
        </select>`;
        break;
      default:
        inputHtml = `<input type="text" class="form-input property-value" data-property="${property}" placeholder="输入${config.name}">`;
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
    });

    // 添加实时预览事件
    const propertyInput = editor.querySelector('.property-value');
    propertyInput.addEventListener('input', (e) => {
      this.previewStyle(property, e.target.value);
    });

    // 对于select类型，也要监听change事件
    if (config.type === 'select') {
      propertyInput.addEventListener('change', (e) => {
        this.previewStyle(property, e.target.value);
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

    if (!selector.trim()) {
      indicator.className = 'selector-status-indicator';
      suggestions.textContent = '';
      suggestions.style.display = 'none';
      // 清除高亮
      this.clearSelectorHighlight();
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
        if (response.isValid) {
          indicator.className = 'selector-status-indicator valid';
          suggestions.textContent = `找到 ${response.elementCount} 个匹配元素`;
          suggestions.className = 'selector-suggestions success';
          suggestions.style.display = 'block';
        } else {
          indicator.className = 'selector-status-indicator invalid';
          suggestions.textContent =
            response.elementCount === 0 ? '未找到匹配元素' : '选择器语法错误';
          suggestions.className = 'selector-suggestions error';
          suggestions.style.display = 'block';
        }
      } else {
        indicator.className = 'selector-status-indicator invalid';
        suggestions.textContent = '无法连接到页面，请确保页面已加载';
        suggestions.className = 'selector-suggestions error';
        suggestions.style.display = 'block';
      }
    } catch (error) {
      console.error('验证选择器时发生错误:', error);
      indicator.className = 'selector-status-indicator invalid';
      suggestions.textContent = '验证失败，请确保页面已加载并刷新后重试';
      suggestions.className = 'selector-suggestions error';
      suggestions.style.display = 'block';
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
    this.renderGroups(theme);

    // 清空输入
    document.getElementById('groupName').value = '';
    document.getElementById('groupDescription').value = '';
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
        Utils.showToast('CSS规则已更新并应用', 'success');
      } else {
        Utils.showToast('无法找到要编辑的规则', 'error');
        return;
      }
    } else {
      // 添加模式：新增规则
      group.rules.push({ selector, properties });
      Utils.showToast('CSS规则已添加并应用', 'success');
    }

    // 清除该选择器的预览效果（因为规则已保存）
    this.clearAllPreview();

    // 重新应用当前主题以显示已保存的样式
    setTimeout(() => {
      this.applyCurrentTheme();
    }, 100);

    this.renderGroups(theme);
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

    validateBtn.addEventListener('click', () => this.validateSelector());
    addPropertyBtn.addEventListener('click', () =>
      this.showModal('propertySelectModal')
    );

    // 选择器输入框变化时清除高亮和预览
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

    confirmBtn.addEventListener('click', () => {
      const name = document.getElementById('groupName').value;
      const description = document.getElementById('groupDescription').value;

      if (!name.trim()) {
        Utils.showToast('请输入组名称', 'warning');
        return;
      }

      this.addGroup(name, description);
      this.hideModal('addGroupModal');
    });
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

}