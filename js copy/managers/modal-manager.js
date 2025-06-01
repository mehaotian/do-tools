/**
 * 模态框管理器模块
 * 负责所有模态框的显示、隐藏、事件处理等功能
 */

import { Utils } from '../core/utils.js';
import { CSS_PROPERTIES, APP_CONFIG } from '../core/constants.js';
import { chromeApi } from '../services/chrome-api.js';

/**
 * 模态框管理器类
 * 统一管理所有模态框的行为
 */
export class ModalManager {
  constructor() {
    // 当前打开的模态框数量
    this.openModalCount = 0;
    
    // 保存的滚动位置
    this.savedScrollPosition = 0;
    
    // 当前编辑的组ID和规则索引
    this.currentGroupId = null;
    this.currentRuleIndex = null;
    
    // 防止滚动的事件处理器
    this.preventScrollHandler = this.createPreventScrollHandler();
    this.preventKeyScrollHandler = this.createPreventKeyScrollHandler();
    
    // 选择器验证防抖函数
    this.debouncedValidateSelector = Utils.debounce(
      this.validateSelector.bind(this), 
      APP_CONFIG.UI.DEBOUNCE_DELAY
    );
    
    this.initializeModals();
  }

  /**
   * 创建防止滚动的事件处理器
   * @returns {Function} 事件处理器
   */
  createPreventScrollHandler() {
    return (e) => {
      // 检查事件目标是否在模态框区域内
      const isInModal = e.target.closest('.modal');
      
      // 如果在模态框内（包括背景区域），允许滚动
      if (isInModal) {
        return true;
      }
      
      // 只阻止模态框外部的滚动
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
  }

  /**
   * 创建防止键盘滚动的事件处理器
   * @returns {Function} 事件处理器
   */
  createPreventKeyScrollHandler() {
    return (e) => {
      const scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
      if (scrollKeys.includes(e.keyCode)) {
        // 检查是否在模态框内
        const isInModal = e.target.closest('.modal');
        
        // 如果在模态框内，允许键盘滚动
        if (isInModal) {
          return true;
        }
        
        // 只阻止模态框外部的键盘滚动
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
  }

  /**
   * 初始化模态框
   */
  initializeModals() {
    this.setupModalEvents();
    this.setupFormEvents();
    this.renderPropertyCategories();
  }

  /**
   * 设置模态框事件
   */
  setupModalEvents() {
    // 添加组确认按钮
    const confirmAddGroupBtn = document.getElementById('confirmAddGroup');
    if (confirmAddGroupBtn) {
      confirmAddGroupBtn.addEventListener('click', () => {
        this.addGroup();
      });
    }

    // 添加规则确认按钮
    const confirmAddRuleBtn = document.getElementById('confirmAddRule');
    if (confirmAddRuleBtn) {
      confirmAddRuleBtn.addEventListener('click', () => {
        this.addCSSRule();
      });
    }

    // 模态框关闭按钮
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.openModalCount > 0) {
        const openModals = document.querySelectorAll('.modal.show');
        if (openModals.length > 0) {
          const lastModal = openModals[openModals.length - 1];
          this.hideModal(lastModal.id);
        }
      }
    });
  }

  /**
   * 设置表单事件
   */
  setupFormEvents() {
    // 选择器输入验证
    const selectorInput = document.getElementById('cssSelector');
    if (selectorInput) {
      selectorInput.addEventListener('input', () => {
        this.debouncedValidateSelector();
      });
      
      selectorInput.addEventListener('blur', () => {
        this.validateSelector();
      });
    }

    // 组名输入回车提交
    const groupNameInput = document.getElementById('groupName');
    if (groupNameInput) {
      groupNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addGroup();
        }
      });
    }
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

    // 增加打开的模态框计数
    this.openModalCount++;

    // 第一个模态框打开时锁定页面滚动
    if (this.openModalCount === 1) {
      this.lockPageScroll();
    }

    // 显示模态框
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // 聚焦到第一个输入框
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }

    // 触发显示事件
    this.emit('modalShown', { modalId, modal });
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

    // 减少打开的模态框计数
    this.openModalCount = Math.max(0, this.openModalCount - 1);

    if (immediate) {
      // 立即隐藏，不等待动画
      modal.classList.remove('show');
      modal.classList.remove('hiding');
      modal.style.display = 'none';
    } else {
      // 添加隐藏动画类
      modal.classList.remove('show');
      modal.classList.add('hiding');
      
      // 等待退出动画完成后隐藏
      setTimeout(() => {
        modal.classList.remove('hiding');
        modal.style.display = 'none';
      }, APP_CONFIG.UI.MODAL_ANIMATION_DURATION);
    }

    // 最后一个模态框关闭时解锁页面滚动
    if (this.openModalCount === 0) {
      this.unlockPageScroll();
    }

    // 清空模态框输入
    this.clearModalInputs(modal);

    // 特殊处理：关闭规则编辑模态框时清除预览
    if (modalId === 'addRuleModal') {
      this.clearAllPreview();
      // 重新应用当前编辑的主题
      setTimeout(() => {
        const currentTheme = window.appState?.getCurrentTheme();
        if (currentTheme) {
          chromeApi.applyTheme(currentTheme);
        }
      }, 100);
    }

    // 触发隐藏事件
    this.emit('modalHidden', { modalId, modal });
  }

  /**
   * 锁定页面滚动
   */
  lockPageScroll() {
    // 保存当前滚动位置
    this.savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // 添加modal-open类并设置body样式
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.savedScrollPosition}px`;
    document.body.style.width = '100%';
    
    // 添加事件监听器防止滚动
    document.addEventListener('wheel', this.preventScrollHandler, { passive: false });
    document.addEventListener('touchmove', this.preventScrollHandler, { passive: false });
    document.addEventListener('keydown', this.preventKeyScrollHandler, { passive: false });
  }

  /**
   * 解锁页面滚动
   */
  unlockPageScroll() {
    // 移除事件监听器
    if (this.preventScrollHandler) {
      document.removeEventListener('wheel', this.preventScrollHandler);
      document.removeEventListener('touchmove', this.preventScrollHandler);
    }
    
    if (this.preventKeyScrollHandler) {
      document.removeEventListener('keydown', this.preventKeyScrollHandler);
    }
    
    // 恢复body样式
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    // 恢复滚动位置
    window.scrollTo(0, this.savedScrollPosition);
  }

  /**
   * 清空模态框输入
   * @param {HTMLElement} modal - 模态框元素
   */
  clearModalInputs(modal) {
    // 清空文本输入
    modal.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(input => {
      input.value = '';
    });
    
    // 重置选择框
    modal.querySelectorAll('select').forEach(select => {
      select.selectedIndex = 0;
    });
    
    // 清空动态生成的内容
    const propertiesContainer = modal.querySelector('#cssProperties');
    if (propertiesContainer) {
      propertiesContainer.innerHTML = '';
    }
    
    // 重置选择器状态
    const indicator = modal.querySelector('#selectorStatusIndicator');
    const suggestions = modal.querySelector('#selectorSuggestions');
    if (indicator) {
      indicator.className = 'selector-status-indicator';
    }
    if (suggestions) {
      suggestions.textContent = '';
      suggestions.style.display = 'none';
    }
  }

  /**
   * 渲染属性分类
   */
  renderPropertyCategories() {
    const container = document.getElementById('propertyCategories');
    if (!container) return;

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
      case "color":
        inputHtml = `<input type="color" class="form-input property-value" data-property="${property}">`;
        break;
      case "range":
        inputHtml = `<input type="range" class="form-input property-value" data-property="${property}" 
          min="${config.min || 0}" max="${config.max || 100}" step="${config.step || 1}">`;
        break;
      case "select":
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
    const selector = document.getElementById('cssSelector')?.value;
    
    if (!selector || !property || !value) {
      return;
    }

    try {
      await chromeApi.previewStyle(selector, property, value);
    } catch (error) {
      console.warn('实时预览失败:', error);
    }
  }

  /**
   * 清除特定属性的预览效果
   * @param {string} property - CSS属性名
   */
  async clearPreviewForProperty(property) {
    const selector = document.getElementById('cssSelector')?.value;
    
    if (!selector || !property) {
      return;
    }

    try {
      await chromeApi.clearPreviewProperty(selector, property);
    } catch (error) {
      console.warn('清除预览失败:', error);
    }
  }

  /**
   * 清除所有预览效果
   */
  async clearAllPreview() {
    try {
      await chromeApi.clearAllPreview();
    } catch (error) {
      console.warn('清除所有预览失败:', error);
    }
  }

  /**
   * 验证选择器
   */
  async validateSelector() {
    const selector = document.getElementById('cssSelector')?.value;
    const indicator = document.getElementById('selectorStatusIndicator');
    const suggestions = document.getElementById('selectorSuggestions');

    if (!selector?.trim()) {
      if (indicator) indicator.className = 'selector-status-indicator';
      if (suggestions) {
        suggestions.textContent = '';
        suggestions.style.display = 'none';
      }
      await this.clearSelectorHighlight();
      return;
    }

    try {
      const result = await chromeApi.validateSelector(selector);
      
      if (result.success) {
        if (result.isValid) {
          if (indicator) indicator.className = 'selector-status-indicator valid';
          if (suggestions) {
            suggestions.textContent = `找到 ${result.elementCount} 个匹配元素`;
            suggestions.className = 'selector-suggestions success';
            suggestions.style.display = 'block';
          }
        } else {
          if (indicator) indicator.className = 'selector-status-indicator invalid';
          if (suggestions) {
            suggestions.textContent = result.elementCount === 0 ? '未找到匹配元素' : '选择器语法错误';
            suggestions.className = 'selector-suggestions error';
            suggestions.style.display = 'block';
          }
        }
      } else {
        if (indicator) indicator.className = 'selector-status-indicator invalid';
        if (suggestions) {
          suggestions.textContent = result.error || '无法连接到页面，请确保页面已加载';
          suggestions.className = 'selector-suggestions error';
          suggestions.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('验证选择器时发生错误:', error);
      if (indicator) indicator.className = 'selector-status-indicator invalid';
      if (suggestions) {
        suggestions.textContent = '验证失败，请确保页面已加载并刷新后重试';
        suggestions.className = 'selector-suggestions error';
        suggestions.style.display = 'block';
      }
    }
  }

  /**
   * 清除选择器高亮效果
   */
  async clearSelectorHighlight() {
    try {
      await chromeApi.clearSelectorHighlight();
    } catch (error) {
      console.log('清除高亮失败:', error);
    }
  }

  /**
   * 添加组
   */
  addGroup() {
    const nameInput = document.getElementById('groupName');
    const descInput = document.getElementById('groupDescription');
    
    if (!nameInput || !descInput) return;
    
    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    
    if (!name) {
      Utils.showToast('请输入组名称', 'error');
      nameInput.focus();
      return;
    }
    
    const currentTheme = window.appState?.getCurrentTheme();
    if (!currentTheme) {
      Utils.showToast('请先选择或创建一个主题', 'error');
      return;
    }
    
    const newGroup = {
      id: Utils.generateId(),
      name,
      description,
      rules: []
    };
    
    currentTheme.groups.push(newGroup);
    window.appState.setCurrentTheme(currentTheme);
    window.themeManager?.renderGroups(currentTheme);
    
    this.hideModal('addGroupModal');
    Utils.showToast(`组 "${name}" 已添加`, 'success');
  }

  /**
   * 添加或更新CSS规则
   */
  addCSSRule() {
    const selector = document.getElementById('cssSelector')?.value;
    const properties = {};

    // 收集属性
    document.querySelectorAll('.css-property-item').forEach(editor => {
      const propertyName = editor.querySelector('input[readonly]')?.value;
      const propertyValue = editor.querySelector('.property-value')?.value;

      if (propertyName && propertyValue) {
        properties[propertyName] = propertyValue;
      }
    });

    if (!selector?.trim()) {
      Utils.showToast('请输入CSS选择器', 'error');
      return;
    }

    if (Object.keys(properties).length === 0) {
      Utils.showToast('请至少添加一个CSS属性', 'error');
      return;
    }

    const currentTheme = window.appState?.getCurrentTheme();
    if (!currentTheme) {
      Utils.showToast('请先选择或创建一个主题', 'error');
      return;
    }

    const group = currentTheme.groups.find(g => g.id === this.currentGroupId);
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

    // 清除预览效果
    this.clearAllPreview();

    // 重新应用当前主题
    setTimeout(() => {
      window.themeManager?.applyCurrentTheme();
    }, 100);

    window.appState.setCurrentTheme(currentTheme);
    window.themeManager?.renderGroups(currentTheme);
    this.hideModal('addRuleModal');
  }

  /**
   * 显示添加组模态框
   */
  showAddGroupModal() {
    this.resetAddGroupModalState();
    this.showModal('addGroupModal');
  }

  /**
   * 隐藏添加组模态框
   */
  hideAddGroupModal() {
    this.hideModal('addGroupModal');
  }

  /**
   * 显示添加规则模态框
   * @param {string} groupId - 组ID
   */
  showAddRuleModal(groupId) {
    this.currentGroupId = groupId;
    this.currentRuleIndex = null;
    this.resetAddRuleModalState();
    this.showModal('addRuleModal');
  }

  /**
   * 隐藏添加规则模态框
   */
  hideAddRuleModal() {
    this.hideModal('addRuleModal');
  }

  /**
   * 处理添加组操作
   */
  handleAddGroup() {
    this.addGroup();
  }

  /**
   * 处理添加规则操作
   */
  handleAddRule() {
    this.addCSSRule();
  }

  /**
   * 显示编辑规则模态框
   * @param {string} groupId - 组ID
   * @param {number} ruleIndex - 规则索引
   * @param {Object} rule - 规则数据
   */
  showEditRuleModal(groupId, ruleIndex, rule) {
    this.currentGroupId = groupId;
    this.currentRuleIndex = ruleIndex;

    this.resetAddRuleModalState();

    // 填充现有数据
    const selectorInput = document.getElementById('cssSelector');
    const modalTitle = document.querySelector('#addRuleModal .modal-title');
    const confirmBtn = document.getElementById('confirmAddRule');

    if (modalTitle) modalTitle.textContent = '编辑CSS规则';
    if (confirmBtn) confirmBtn.textContent = '保存修改';
    if (selectorInput) selectorInput.value = rule.selector;

    // 填充CSS属性
    if (rule.properties) {
      Object.entries(rule.properties).forEach(([prop, value]) => {
        // 查找属性配置
        let propertyConfig = null;
        for (const category in CSS_PROPERTY_GROUPS) {
          if (CSS_PROPERTY_GROUPS[category].properties[prop]) {
            propertyConfig = CSS_PROPERTY_GROUPS[category].properties[prop];
            break;
          }
        }

        // 添加属性编辑器
        this.addPropertyEditor(prop, propertyConfig || { type: 'text', name: prop });

        // 设置属性值
        const propertyInput = document.querySelector(`[data-property="${prop}"]`);
        if (propertyInput) {
          propertyInput.value = value;
        }
      });
    }

    this.showModal('addRuleModal');
  }

  /**
   * 重置添加组模态框状态
   */
  resetAddGroupModalState() {
    const groupNameInput = document.getElementById('groupName');
    if (groupNameInput) {
      groupNameInput.value = '';
    }
  }

  /**
   * 重置添加规则模态框状态
   */
  resetAddRuleModalState() {
    const selectorInput = document.getElementById('cssSelector');
    const propertiesContainer = document.getElementById('cssProperties');
    const indicator = document.getElementById('selectorStatusIndicator');
    const suggestions = document.getElementById('selectorSuggestions');
    const modalTitle = document.querySelector('#addRuleModal .modal-title');
    const confirmBtn = document.getElementById('confirmAddRule');

    if (selectorInput) selectorInput.value = '';
    if (propertiesContainer) propertiesContainer.innerHTML = '';
    if (modalTitle) modalTitle.textContent = '添加CSS规则';
    if (confirmBtn) confirmBtn.textContent = '添加规则';
    
    if (indicator) indicator.className = 'selector-status-indicator';
    if (suggestions) {
      suggestions.textContent = '';
      suggestions.className = 'selector-suggestions';
      suggestions.style.display = 'none';
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   */
  emit(event, data) {
    const customEvent = new CustomEvent(event, { detail: data });
    document.dispatchEvent(customEvent);
  }
}