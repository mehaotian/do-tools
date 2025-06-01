/**
 * 页面美化 - 可视化CSS编辑器
 * 主要功能模块
 */

// 全局状态管理
class AppState {
  constructor() {
    this.currentTheme = null;
    this.customThemes = [];
    this.presetThemes = [];
    this.activeGroup = null;

  }

  // 设置当前主题
  setCurrentTheme(theme) {
    this.currentTheme = theme;
    this.notifyStateChange('themeChanged', theme);
  }

  // 添加自定义主题
  addCustomTheme(theme) {
    this.customThemes.push(theme);
    this.notifyStateChange('customThemesChanged', this.customThemes);
  }

  // 删除自定义主题
  removeCustomTheme(themeId) {
    this.customThemes = this.customThemes.filter(theme => theme.id !== themeId);
    this.notifyStateChange('customThemesChanged', this.customThemes);
  }

  // 状态变化通知
  notifyStateChange(event, data) {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

// CSS属性定义
const CSS_PROPERTIES = {
  layout: {
    name: '布局',
    properties: {
      'display': { name: '显示方式', type: 'select', options: ['block', 'inline', 'flex', 'grid', 'none'] },
      'position': { name: '定位', type: 'select', options: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },
      'width': { name: '宽度', type: 'text', unit: 'px' },
      'height': { name: '高度', type: 'text', unit: 'px' },
      'margin': { name: '外边距', type: 'text', unit: 'px' },
      'padding': { name: '内边距', type: 'text', unit: 'px' },
      'top': { name: '顶部距离', type: 'text', unit: 'px' },
      'left': { name: '左侧距离', type: 'text', unit: 'px' },
      'right': { name: '右侧距离', type: 'text', unit: 'px' },
      'bottom': { name: '底部距离', type: 'text', unit: 'px' },
      'z-index': { name: '层级', type: 'number' }
    }
  },
  appearance: {
    name: '外观',
    properties: {
      'background-color': { name: '背景颜色', type: 'color' },
      'background-image': { name: '背景图片', type: 'text' },
      'background-size': { name: '背景大小', type: 'select', options: ['auto', 'cover', 'contain'] },
      'background-position': { name: '背景位置', type: 'text' },
      'background-repeat': { name: '背景重复', type: 'select', options: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y'] },
      'border': { name: '边框', type: 'text' },
      'border-radius': { name: '圆角', type: 'text', unit: 'px' },
      'box-shadow': { name: '阴影', type: 'text' },
      'opacity': { name: '透明度', type: 'range', min: 0, max: 1, step: 0.1 }
    }
  },
  typography: {
    name: '文字',
    properties: {
      'color': { name: '文字颜色', type: 'color' },
      'font-size': { name: '字体大小', type: 'text', unit: 'px' },
      'font-weight': { name: '字体粗细', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
      'font-family': { name: '字体族', type: 'text' },
      'line-height': { name: '行高', type: 'text' },
      'text-align': { name: '文字对齐', type: 'select', options: ['left', 'center', 'right', 'justify'] },
      'text-decoration': { name: '文字装饰', type: 'select', options: ['none', 'underline', 'overline', 'line-through'] },
      'text-transform': { name: '文字转换', type: 'select', options: ['none', 'uppercase', 'lowercase', 'capitalize'] }
    }
  },
  effects: {
    name: '特效',
    properties: {
      'filter': { name: '滤镜', type: 'text' },
      'backdrop-filter': { name: '背景滤镜', type: 'text' },
      'transform': { name: '变换', type: 'text' },
      'transition': { name: '过渡', type: 'text' },
      'animation': { name: '动画', type: 'text' }
    }
  }
};

// 预制主题定义
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
      },
      {
        id: 'navbar',
        name: '导航栏',
        description: '深色导航栏样式',
        rules: [
          {
            selector: 'nav, .navbar, header',
            properties: {
              'background-color': 'rgba(30, 30, 30, 0.9)',
              'backdrop-filter': 'blur(10px)',
              'border-bottom': '1px solid rgba(255, 255, 255, 0.1)'
            }
          }
        ]
      }
    ]
  }
];

// 工具函数
class Utils {
  // 生成唯一ID
  static generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }

  // 显示Toast通知
  static showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // 验证CSS选择器
  static validateSelector(selector) {
    try {
      document.querySelector(selector);
      return true;
    } catch (e) {
      return false;
    }
  }

  // 深拷贝对象
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // 导出JSON文件
  static exportJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 导入JSON文件
  static importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}

// 主题管理器
class ThemeManager {
  constructor(appState) {
    this.appState = appState;
    this.loadPresetThemes();
    this.loadCustomThemes();
  }

  // 加载预制主题
  loadPresetThemes() {
    this.appState.presetThemes = PRESET_THEMES;
    this.renderPresetThemes();
  }

  // 加载自定义主题
  loadCustomThemes() {
    const saved = localStorage.getItem('customThemes');
    if (saved) {
      try {
        this.appState.customThemes = JSON.parse(saved);
        this.renderCustomThemes();
      } catch (e) {
        console.error('Failed to load custom themes:', e);
      }
    }
  }

  // 保存自定义主题到本地存储
  saveCustomThemes() {
    localStorage.setItem('customThemes', JSON.stringify(this.appState.customThemes));
  }

  // 渲染预制主题
  renderPresetThemes() {
    const container = document.getElementById('presetThemes');
    container.innerHTML = '';

    this.appState.presetThemes.forEach(theme => {
      const card = document.createElement('div');
      card.className = 'preset-theme-card';
      card.innerHTML = `
        <h4>${theme.name}</h4>
        <p>${theme.description}</p>
      `;
      
      card.addEventListener('click', () => {
        this.selectPresetTheme(theme);
      });
      
      container.appendChild(card);
    });
  }

  // 渲染自定义主题
  renderCustomThemes() {
    const container = document.getElementById('customThemesList');
    // 保留默认主题，清空其他内容
    const defaultTheme = container.querySelector('[data-theme-id="default"]');
    container.innerHTML = '';
    
    // 重新添加默认主题
    if (defaultTheme) {
      container.appendChild(defaultTheme);
      // 添加默认主题点击事件
      defaultTheme.addEventListener('click', () => {
        this.selectDefaultTheme();
      });
    }

    this.appState.customThemes.forEach(theme => {
      const item = document.createElement('div');
      item.className = 'custom-theme-item';
      item.innerHTML = `
        <div class="custom-theme-info">
          <h5>${theme.name}</h5>
          <p>${theme.description || '无描述'}</p>
        </div>
        <div class="custom-theme-actions">
          <button title="编辑" data-action="edit" data-id="${theme.id}">✏️</button>
          <button title="删除" data-action="delete" data-id="${theme.id}">🗑️</button>
        </div>
      `;
      
      // 点击主题项选择主题
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-theme-actions')) {
          this.selectCustomTheme(theme);
        }
      });
      
      // 处理操作按钮
      item.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;
        
        if (action === 'edit') {
          this.editCustomTheme(id);
        } else if (action === 'delete') {
          this.deleteCustomTheme(id);
        }
      });
      
      container.appendChild(item);
    });
  }

  // 选择预制主题
  selectPresetTheme(theme) {
    // 清除其他选中状态
    document.querySelectorAll('.preset-theme-card.active').forEach(card => {
      card.classList.remove('active');
    });
    document.querySelectorAll('.custom-theme-item.active').forEach(item => {
      item.classList.remove('active');
    });
    
    // 设置当前选中
    event.target.closest('.preset-theme-card').classList.add('active');
    
    // 如果是"无主题"，清空当前主题
    if (theme.id === 'none') {
      this.appState.setCurrentTheme(null);
      this.hideThemeEditor();
    } else {
      // 创建主题副本用于编辑
      const editableTheme = Utils.deepClone(theme);
      editableTheme.id = Utils.generateId();
      editableTheme.isCustom = true;
      
      this.appState.setCurrentTheme(editableTheme);
      this.showThemeEditor(editableTheme);
    }
  }

  // 选择自定义主题
  selectCustomTheme(theme) {
    // 清除其他选中状态
    document.querySelectorAll('.preset-theme-card.active').forEach(card => {
      card.classList.remove('active');
    });
    document.querySelectorAll('.custom-theme-item.active').forEach(item => {
      item.classList.remove('active');
    });
    
    // 设置当前选中
    event.target.closest('.custom-theme-item').classList.add('active');
    
    this.appState.setCurrentTheme(theme);
    this.showThemeEditor(theme);
  }
  
  // 选择默认主题
  selectDefaultTheme() {
    // 清除其他选中状态
    document.querySelectorAll('.preset-theme-card.active').forEach(card => {
      card.classList.remove('active');
    });
    document.querySelectorAll('.custom-theme-item.active').forEach(item => {
      item.classList.remove('active');
    });
    
    // 设置默认主题为选中
    document.querySelector('[data-theme-id="default"]').classList.add('active');
    
    // 应用默认主题（清除所有样式）
    chrome.runtime.sendMessage({
      action: 'pageBeautify',
      type: 'RESET_STYLES'
    }, (response) => {
      if (chrome.runtime.lastError) {
        Utils.showToast('重置样式失败: ' + chrome.runtime.lastError.message, 'error');
      } else {
        Utils.showToast('已应用默认主题', 'success');
      }
    });
    
    // 清空当前主题并隐藏编辑器
    this.appState.setCurrentTheme(null);
    this.hideThemeEditor();
  }

  // 创建新主题
  createNewTheme() {
    const newTheme = {
      id: Utils.generateId(),
      name: '新主题',
      description: '',
      groups: [],
      isCustom: true
    };
    
    this.appState.addCustomTheme(newTheme);
    this.appState.setCurrentTheme(newTheme);
    this.saveCustomThemes();
    this.renderCustomThemes();
    this.showThemeEditor(newTheme);
  }

  // 编辑自定义主题
  editCustomTheme(themeId) {
    const theme = this.appState.customThemes.find(t => t.id === themeId);
    if (theme) {
      this.appState.setCurrentTheme(theme);
      this.showThemeEditor(theme);
    }
  }

  // 删除自定义主题
  deleteCustomTheme(themeId) {
    if (confirm('确定要删除这个主题吗？')) {
      this.appState.removeCustomTheme(themeId);
      this.saveCustomThemes();
      this.renderCustomThemes();
      
      // 如果删除的是当前主题，清空编辑器
      if (this.appState.currentTheme && this.appState.currentTheme.id === themeId) {
        this.appState.setCurrentTheme(null);
        this.hideThemeEditor();
      }
    }
  }

  // 显示主题编辑器
  showThemeEditor(theme) {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('themeInfoSection').style.display = 'block';
    document.getElementById('groupsSection').style.display = 'block';
    
    // 填充主题信息
    document.getElementById('themeName').value = theme.name;
    document.getElementById('themeDescription').value = theme.description || '';
    
    // 根据主题类型显示不同的按钮
    this.updateThemeActions(theme);
    
    // 渲染修改组
    this.renderGroups(theme);
  }
  
  // 更新主题操作按钮
  updateThemeActions(theme) {
    const saveBtn = document.getElementById('saveThemeBtn');
    const saveAsBtn = document.getElementById('saveAsThemeBtn');
    
    if (theme.isCustom && this.appState.customThemes.find(t => t.id === theme.id)) {
      // 已存在的自定义主题 - 显示保存按钮
      saveBtn.style.display = 'inline-block';
      saveAsBtn.style.display = 'none';
    } else {
      // 预制主题或新主题 - 显示另存为按钮
      saveBtn.style.display = 'none';
      saveAsBtn.style.display = 'inline-block';
    }
  }

  // 隐藏主题编辑器
  hideThemeEditor() {
    document.getElementById('emptyState').style.display = 'flex';
    document.getElementById('themeInfoSection').style.display = 'none';
    document.getElementById('groupsSection').style.display = 'none';
  }

  // 渲染修改组
  renderGroups(theme) {
    const container = document.getElementById('groupsList');
    container.innerHTML = '';

    theme.groups.forEach(group => {
      const groupCard = this.createGroupCard(group);
      container.appendChild(groupCard);
    });
  }

  // 创建修改组卡片
  createGroupCard(group) {
    const card = document.createElement('div');
    card.className = 'group-card';
    card.innerHTML = `
      <div class="group-header" data-group-id="${group.id}">
        <div>
          <div class="group-title">${group.name}</div>
          <div class="group-description">${group.description}</div>
        </div>
        <div class="group-actions">
          <button class="btn btn-sm btn-outline" data-action="add-rule" data-group-id="${group.id}">添加规则</button>
          <button class="btn btn-sm btn-outline" data-action="delete-group" data-group-id="${group.id}">删除组</button>
          <span class="group-toggle">▼</span>
        </div>
      </div>
      <div class="group-content" id="group-content-${group.id}">
        <div class="css-rules-list" id="rules-list-${group.id}">
          ${this.renderCSSRules(group.rules)}
        </div>
      </div>
    `;
    
    // 添加事件监听
    this.attachGroupEvents(card, group);
    
    return card;
  }

  // 渲染CSS规则
  renderCSSRules(rules) {
    return rules.map(rule => `
      <div class="css-rule-item">
        <div class="css-rule-selector">${rule.selector}</div>
        <div class="css-rule-properties">
          ${Object.entries(rule.properties).map(([prop, value]) => `
            <div class="css-property">
              <span class="css-property-name">${prop}:</span>
              <span class="css-property-value">${value};</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // 附加组事件
  attachGroupEvents(card, group) {
    const header = card.querySelector('.group-header');
    const content = card.querySelector('.group-content');
    const toggle = card.querySelector('.group-toggle');
    
    // 切换展开/收起
    header.addEventListener('click', (e) => {
      if (!e.target.closest('.group-actions')) {
        content.classList.toggle('expanded');
        toggle.textContent = content.classList.contains('expanded') ? '▲' : '▼';
      }
    });
    
    // 处理操作按钮
    card.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const groupId = e.target.dataset.groupId;
      
      if (action === 'add-rule') {
        window.modalManager.showAddRuleModal(groupId);
      } else if (action === 'delete-group') {
        this.deleteGroup(groupId);
      }
    });
  }

  // 保存当前主题
  saveCurrentTheme() {
    const theme = this.appState.currentTheme;
    if (!theme) return;
    
    // 更新主题信息
    theme.name = document.getElementById('themeName').value;
    theme.description = document.getElementById('themeDescription').value;
    
    if (theme.isCustom) {
      // 更新自定义主题列表
      const index = this.appState.customThemes.findIndex(t => t.id === theme.id);
      if (index >= 0) {
        this.appState.customThemes[index] = theme;
      } else {
        this.appState.customThemes.push(theme);
      }
      
      this.saveCustomThemes();
      this.renderCustomThemes();
      Utils.showToast('主题已保存', 'success');
    }
  }

  // 导出主题
  exportTheme() {
    const theme = this.appState.currentTheme;
    if (!theme) {
      Utils.showToast('请先选择一个主题', 'warning');
      return;
    }
    
    const exportData = {
      ...theme,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    Utils.exportJSON(exportData, `${theme.name}.json`);
    Utils.showToast('主题已导出', 'success');
  }

  // 导入主题
  async importTheme(file) {
    if (!file) {
      // 如果没有传入文件，创建文件输入
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
          this.importTheme(selectedFile);
        }
      };
      input.click();
      return;
    }
    
    try {
      const data = await Utils.importJSON(file);
      
      // 验证主题数据
      if (!data.name || !data.groups) {
        throw new Error('无效的主题文件格式');
      }
      
      // 生成新ID避免冲突
      data.id = Utils.generateId();
      data.isCustom = true;
      
      this.appState.addCustomTheme(data);
      this.saveCustomThemes();
      this.renderCustomThemes();
      
      Utils.showToast('主题导入成功', 'success');
    } catch (error) {
      Utils.showToast('主题导入失败: ' + error.message, 'error');
    }
  }
  
  // 另存为新主题
  saveAsNewTheme() {
    const theme = this.appState.currentTheme;
    if (!theme) {
      Utils.showToast('请先选择一个主题', 'warning');
      return;
    }
    
    // 创建主题副本
    const newTheme = Utils.deepClone(theme);
    newTheme.id = Utils.generateId();
    newTheme.name = theme.name + ' - 副本';
    newTheme.isCustom = true;
    
    this.appState.addCustomTheme(newTheme);
    this.appState.setCurrentTheme(newTheme);
    this.saveCustomThemes();
    this.renderCustomThemes();
    this.showThemeEditor(newTheme);
    
    Utils.showToast('主题已另存为新主题', 'success');
  }
  
  // 应用当前主题
  applyCurrentTheme() {
    const theme = this.appState.currentTheme;
    if (!theme) {
      Utils.showToast('请先选择一个主题', 'warning');
      return;
    }
    
    // 通过background层发送消息到content script
    chrome.runtime.sendMessage({
      action: 'pageBeautify',
      type: 'APPLY_THEME',
      theme: theme
    }, (response) => {
      if (chrome.runtime.lastError) {
        Utils.showToast('应用主题失败: ' + chrome.runtime.lastError.message, 'error');
      } else if (response && response.success) {
        Utils.showToast('主题已应用', 'success');
      } else {
        Utils.showToast('应用主题失败', 'error');
      }
    });
  }
  
  // 导出当前主题
  exportCurrentTheme() {
    this.exportTheme();
  }
}

// 样式应用器
class StyleApplier {
  constructor() {
    this.appliedStyles = new Map();
  }

  // 应用主题样式
  applyTheme(theme) {
    this.clearAllStyles();
    
    if (!theme || !theme.groups) return;
    
    theme.groups.forEach(group => {
      group.rules.forEach(rule => {
        this.applyRule(rule, group.id);
      });
    });
    
    Utils.showToast('样式已应用', 'success');
  }

  // 应用单个规则
  applyRule(rule, groupId) {
    const elements = document.querySelectorAll(rule.selector);
    
    elements.forEach(element => {
      const styleId = `${groupId}-${rule.selector}`;
      
      // 保存原始样式
      if (!this.appliedStyles.has(element)) {
        this.appliedStyles.set(element, new Map());
      }
      
      const elementStyles = this.appliedStyles.get(element);
      
      Object.entries(rule.properties).forEach(([property, value]) => {
        // 保存原始值
        if (!elementStyles.has(property)) {
          elementStyles.set(property, element.style[property] || '');
        }
        
        // 应用新样式
        element.style[property] = value;
      });
    });
  }

  // 清除所有样式
  clearAllStyles() {
    this.appliedStyles.forEach((elementStyles, element) => {
      elementStyles.forEach((originalValue, property) => {
        if (originalValue) {
          element.style[property] = originalValue;
        } else {
          element.style.removeProperty(property);
        }
      });
    });
    
    this.appliedStyles.clear();
    Utils.showToast('样式已重置', 'info');
  }


}

// 模态框管理器
class ModalManager {
  constructor() {
    this.initializeModals();
  }

  // 初始化模态框
  initializeModals() {
    // 添加组模态框
    this.setupAddGroupModal();
    
    // 添加规则模态框
    this.setupAddRuleModal();
    
    // 属性选择模态框
    this.setupPropertySelectModal();
  }

  // 设置添加组模态框
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

  // 设置添加规则模态框
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
    addPropertyBtn.addEventListener('click', () => this.showModal('propertySelectModal'));
    
    confirmBtn.addEventListener('click', () => {
      this.addCSSRule();
    });
  }

  // 设置属性选择模态框
  setupPropertySelectModal() {
    const modal = document.getElementById('propertySelectModal');
    const closeBtn = document.getElementById('closePropertySelectModal');
    
    closeBtn.addEventListener('click', () => this.hideModal('propertySelectModal'));
    
    this.renderPropertyCategories();
  }

  // 显示模态框
  showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    // 阻止背景滚动
    document.body.classList.add('modal-open');
  }

  // 隐藏模态框
  hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    this.clearModalInputs(modalId);
    // 恢复背景滚动
    document.body.classList.remove('modal-open');
  }

  // 清空模态框输入
  clearModalInputs(modalId) {
    const modal = document.getElementById(modalId);
    const inputs = modal.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      if (input.type === 'color') {
        input.value = '#000000'; // 颜色输入框设置默认黑色
      } else {
        input.value = '';
      }
    });
  }

  // 渲染属性分类
  renderPropertyCategories() {
    const container = document.getElementById('propertyCategories');
    container.innerHTML = '';
    
    Object.entries(CSS_PROPERTIES).forEach(([categoryKey, category]) => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'property-category';
      categoryDiv.innerHTML = `
        <div class="property-category-header">${category.name}</div>
        <div class="property-category-list">
          ${Object.entries(category.properties).map(([propKey, prop]) => `
            <div class="property-item" data-property="${propKey}" data-category="${categoryKey}">
              ${prop.name} (${propKey})
            </div>
          `).join('')}
        </div>
      `;
      
      // 添加属性选择事件
      categoryDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('property-item')) {
          const property = e.target.dataset.property;
          const category = e.target.dataset.category;
          this.addPropertyEditor(property, CSS_PROPERTIES[category].properties[property]);
          this.hideModal('propertySelectModal');
        }
      });
      
      container.appendChild(categoryDiv);
    });
  }

  // 添加属性编辑器
  addPropertyEditor(property, config) {
    const container = document.getElementById('cssProperties');    const editor = document.createElement('div');
    editor.className = 'css-property-item';
    
    let inputHtml = '';
    switch (config.type) {
      case 'color':
        inputHtml = `<input type="color" class="form-input property-value" data-property="${property}">`;
        break;
      case 'range':
        inputHtml = `<input type="range" class="form-input property-value" data-property="${property}" min="${config.min}" max="${config.max}" step="${config.step}">`;
        break;
      case 'select':
        inputHtml = `<select class="form-input property-value" data-property="${property}">
          ${config.options.map(option => `<option value="${option}">${option}</option>`).join('')}
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
    });
    
    container.appendChild(editor);
  }

  // 验证选择器
  async validateSelector() {
    const selector = document.getElementById('cssSelector').value;
    const indicator = document.getElementById('selectorStatusIndicator');
    const suggestions = document.getElementById('selectorSuggestions');
    
    if (!selector.trim()) {
      indicator.className = 'selector-status-indicator';
      suggestions.textContent = '';
      suggestions.style.display = 'none';
      return;
    }

    console.log('开始验证选择器:',selector);
    
   
    
    try {
      // 通过background层路由转发消息到content script
      const response = await chrome.runtime.sendMessage({
        action: 'pageBeautify',
        type: 'VALIDATE_SELECTOR',
        data: { selector: selector }
      });
      
      console.log('验证选择器结果:', response);
      

      if (response && response.success) {
        const result = response.data;
        if (result.isValid) {
          indicator.className = 'selector-status-indicator valid';
          suggestions.textContent = result.message;
          suggestions.className = 'selector-suggestions success';
          suggestions.style.display = 'block';
        } else {
          indicator.className = 'selector-status-indicator invalid';
          suggestions.textContent = result.message;
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

  // 添加修改组
  addGroup(name, description) {
    const theme = window.appState.currentTheme;
    if (!theme) return;
    
    const newGroup = {
      id: Utils.generateId(),
      name,
      description,
      rules: []
    };
    
    theme.groups.push(newGroup);
    window.themeManager.renderGroups(theme);
    
    // 清空输入
    document.getElementById('groupName').value = '';
    document.getElementById('groupDescription').value = '';
  }

  // 添加CSS规则
  addCSSRule() {
    const selector = document.getElementById('cssSelector').value;
    const properties = {};
    
    // 收集属性
    document.querySelectorAll('.css-property-item').forEach(editor => {
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
    
    // 添加规则到当前组
    const groupId = this.currentGroupId;
    const theme = window.appState.currentTheme;
    const group = theme.groups.find(g => g.id === groupId);
    
    if (group) {
      group.rules.push({ selector, properties });
      window.themeManager.renderGroups(theme);
      this.hideModal('addRuleModal');
      Utils.showToast('CSS规则已添加', 'success');
    } else {
      Utils.showToast('无法找到目标组，请重试', 'error');
    }
  }

  // 显示添加规则模态框
  showAddRuleModal(groupId) {
    this.currentGroupId = groupId;
    // 重置模态框状态
    this.resetAddRuleModalState();
    this.showModal('addRuleModal');
  }

  // 重置添加规则模态框状态
  resetAddRuleModalState() {
    // 清空输入框
    const selectorInput = document.getElementById('cssSelector');
    const propertiesContainer = document.getElementById('cssProperties');
    const indicator = document.getElementById('selectorStatusIndicator');
    const suggestions = document.getElementById('selectorSuggestions');
    
    if (selectorInput) {
      selectorInput.value = '';
    }
    
    if (propertiesContainer) {
      propertiesContainer.innerHTML = '';
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
}

// 应用程序主类
class PageBeautifyApp {
  constructor() {
    this.appState = new AppState();
    this.themeManager = new ThemeManager(this.appState);
    this.styleApplier = new StyleApplier();
    this.modalManager = new ModalManager();
    
    this.initializeApp();
  }

  // 初始化应用
  initializeApp() {
    this.bindEvents();
    this.setupGlobalReferences();
    
    // 监听状态变化
    document.addEventListener('themeChanged', (e) => {
      this.onThemeChanged(e.detail);
    });
  }

  // 设置全局引用
  setupGlobalReferences() {
    window.appState = this.appState;
    window.themeManager = this.themeManager;
    window.styleApplier = this.styleApplier;
    window.modalManager = this.modalManager;
  }

  // 绑定事件
  bindEvents() {
    // 文件输入处理
    
    // 文件导入
    document.getElementById('fileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.themeManager.importTheme(file);
        e.target.value = ''; // 清空文件输入
      }
    });
    
    // 新建主题按钮
    document.getElementById('newThemeBtn').addEventListener('click', () => {
      this.themeManager.createNewTheme();
    });
    
    document.getElementById('createFirstTheme').addEventListener('click', () => {
      this.themeManager.createNewTheme();
    });
    
    // 保存主题按钮
    document.getElementById('saveThemeBtn').addEventListener('click', () => {
      this.themeManager.saveCurrentTheme();
    });
    
    // 另存为按钮
    document.getElementById('saveAsThemeBtn').addEventListener('click', () => {
      this.themeManager.saveAsNewTheme();
    });
    
    // 应用主题按钮
    document.getElementById('applyThemeBtn').addEventListener('click', () => {
      this.themeManager.applyCurrentTheme();
    });
    
    // 导出主题按钮
    document.getElementById('exportThemeBtn').addEventListener('click', () => {
      this.themeManager.exportCurrentTheme();
    });
    
    // 导入主题按钮
    document.getElementById('importThemeBtn').addEventListener('click', () => {
      this.themeManager.importTheme();
    });
    
    // 添加组按钮
    document.getElementById('addGroupBtn').addEventListener('click', () => {
      this.modalManager.showModal('addGroupModal');
    });
    
    // 模态框背景点击关闭
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.modalManager.hideModal(modal.id);
        }
      });
    });
  }

  // 主题变化处理
  onThemeChanged(theme) {
    // 可以在这里添加主题变化时的额外逻辑
    console.log('Theme changed:', theme);
  }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
  new PageBeautifyApp();
});
