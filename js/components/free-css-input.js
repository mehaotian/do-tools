/**
 * 自由CSS属性输入组件
 * 提供CSS属性名和值的自动补全功能
 */

import { getPropertySuggestions, getValueSuggestions, isValidCSSProperty } from '../core/css-properties-lib.js';

/**
 * 自由CSS属性输入组件类
 */
export class FreeCSSInput {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onPropertyAdd: options.onPropertyAdd || (() => {}),
      onPropertyChange: options.onPropertyChange || (() => {}),
      placeholder: options.placeholder || '输入CSS属性名',
      valuePlaceholder: options.valuePlaceholder || '输入属性值',
      showSuggestions: options.showSuggestions !== false,
      maxSuggestions: options.maxSuggestions || 8,
      ...options
    };
    
    this.currentProperty = '';
    this.currentValue = '';
    this.isShowingSuggestions = false;
    this.selectedSuggestionIndex = -1;
    this.suggestions = [];
    
    this.init();
  }
  
  /**
   * 初始化组件
   */
  init() {
    this.createHTML();
    this.bindEvents();
  }
  
  /**
   * 创建HTML结构
   */
  createHTML() {
    this.container.innerHTML = `
      <div class="free-css-input">
        <div class="css-input-container">
          <input type="text" 
                 class="css-property-input" 
                 placeholder="${this.options.placeholder}"
                 autocomplete="off">
          <div class="css-suggestions property-suggestions" style="display: none;"></div>
          <button type="button" class="css-add-btn" title="添加属性">+</button>
        </div>
      </div>
    `;
    
    // 获取DOM元素引用
    this.propertyInput = this.container.querySelector('.css-property-input');
    this.addBtn = this.container.querySelector('.css-add-btn');
    this.propertySuggestions = this.container.querySelector('.property-suggestions');
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    // 属性输入框事件
    this.propertyInput.addEventListener('input', (e) => {
      this.currentProperty = e.target.value; // 不要trim，保持原始输入
      this.showPropertySuggestions();
      this.updateAddButtonState();
      
      // 触发属性变化回调
      this.options.onPropertyChange(this.currentProperty.trim());
    });
    
    this.propertyInput.addEventListener('keydown', (e) => {
      this.handlePropertyKeydown(e);
    });
    
    this.propertyInput.addEventListener('focus', () => {
      // 只有在有输入内容时才显示建议
      if (this.currentProperty && this.currentProperty.trim().length > 0) {
        this.showPropertySuggestions();
      }
    });
    
    this.propertyInput.addEventListener('blur', () => {
      // 延迟隐藏，允许点击建议项
      setTimeout(() => {
        this.hidePropertySuggestions();
      }, 200);
    });
    
    // 添加按钮事件
    this.addBtn.addEventListener('click', () => {
      this.addProperty();
    });
  }
  
  /**
   * 显示属性建议
   */
  showPropertySuggestions() {
    if (!this.options.showSuggestions) return;
    
    // 获取当前输入值
    const inputValue = this.currentProperty.trim();
    
    // 如果输入为空，不显示建议框
    if (inputValue.length === 0) {
      this.hidePropertySuggestions();
      return;
    }
    
    // 获取建议列表
    const suggestions = getPropertySuggestions(inputValue, this.options.maxSuggestions);
    this.suggestions = suggestions;
    
    // 如果没有匹配项，隐藏建议框
    if (suggestions.length === 0) {
      this.hidePropertySuggestions();
      return;
    }
    
    this.propertySuggestions.innerHTML = suggestions
      .map((prop, index) => `
        <div class="suggestion-item ${index === this.selectedSuggestionIndex ? 'selected' : ''}" 
             data-property="${prop}">
          <span class="suggestion-text">${prop}</span>
        </div>
      `).join('');
    
    // 绑定点击事件
    this.propertySuggestions.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const property = item.dataset.property;
        this.selectProperty(property);
      });
    });
    
    this.propertySuggestions.style.display = 'block';
    this.isShowingSuggestions = true;
  }
  
  /**
   * 隐藏属性建议
   */
  hidePropertySuggestions() {
    this.propertySuggestions.style.display = 'none';
    this.isShowingSuggestions = false;
    this.selectedSuggestionIndex = -1;
  }
  

  
  /**
   * 处理属性输入框键盘事件
   * @param {KeyboardEvent} e - 键盘事件
   */
  handlePropertyKeydown(e) {
    if (!this.isShowingSuggestions) {
      if (e.key === 'Enter' && this.currentProperty && this.currentProperty.trim().length > 0) {
        e.preventDefault();
        this.addProperty();
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedSuggestionIndex = Math.min(
          this.selectedSuggestionIndex + 1,
          this.suggestions.length - 1
        );
        this.updateSuggestionSelection();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.selectedSuggestionIndex = Math.max(
          this.selectedSuggestionIndex - 1,
          -1
        );
        this.updateSuggestionSelection();
        break;
        
      case 'Enter':
        e.preventDefault();
        if (this.selectedSuggestionIndex >= 0) {
          this.selectProperty(this.suggestions[this.selectedSuggestionIndex]);
        } else if (this.currentProperty && this.currentProperty.trim().length > 0) {
          this.addProperty();
        }
        break;
        
      case 'Escape':
        this.hidePropertySuggestions();
        break;
        
      case 'Tab':
        if (this.selectedSuggestionIndex >= 0) {
          e.preventDefault();
          this.selectProperty(this.suggestions[this.selectedSuggestionIndex]);
        }
        this.hidePropertySuggestions();
        break;
    }
  }
  

  
  /**
   * 更新建议选择状态
   */
  updateSuggestionSelection() {
    const items = this.propertySuggestions.querySelectorAll('.suggestion-item');
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedSuggestionIndex);
    });
    
    // 确保选中项在可视范围内
    this.scrollSelectedIntoView();
  }
  
  /**
   * 滚动选中项到可视范围内
   */
  scrollSelectedIntoView() {
    if (this.selectedSuggestionIndex < 0) return;
    
    const selectedItem = this.propertySuggestions.querySelector('.suggestion-item.selected');
    if (!selectedItem) return;
    
    const container = this.propertySuggestions;
    const itemTop = selectedItem.offsetTop;
    const itemBottom = itemTop + selectedItem.offsetHeight;
    const containerScrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    // 添加缓冲区，避免选中项紧贴边缘
    const buffer = 10;
    
    // 如果选中项在可视区域上方
    if (itemTop < containerScrollTop + buffer) {
      container.scrollTo({
        top: Math.max(0, itemTop - buffer),
        behavior: 'smooth'
      });
    }
    // 如果选中项在可视区域下方
    else if (itemBottom > containerScrollTop + containerHeight - buffer) {
      container.scrollTo({
        top: itemBottom - containerHeight + buffer,
        behavior: 'smooth'
      });
    }
  }
  
  /**
   * 选择属性
   * @param {string} property - 属性名
   */
  selectProperty(property) {
    this.currentProperty = property;
    this.propertyInput.value = property;
    this.hidePropertySuggestions();
    this.updateAddButtonState();
    
    // 选择属性后可以直接添加
    if (property && property.trim().length > 0) {
      this.addProperty();
    }
  }
  
  /**
   * 更新添加按钮状态
   */
  updateAddButtonState() {
    const isValid = this.currentProperty && this.currentProperty.trim().length > 0;
    
    this.addBtn.disabled = !isValid;
    this.addBtn.style.opacity = isValid ? '1' : '0.5';
  }
  
  /**
   * 添加属性
   */
  addProperty() {
    if (!this.currentProperty || this.currentProperty.trim().length === 0) {
      return;
    }
    
    // 调用回调函数，只传递属性名
    this.options.onPropertyAdd(this.currentProperty.trim());
    
    // 重置输入
    this.reset();
  }
  
  /**
   * 重置输入
   */
  reset() {
    this.currentProperty = '';
    this.propertyInput.value = '';
    this.hidePropertySuggestions();
    this.updateAddButtonState();
    this.propertyInput.focus();
  }
  
  /**
   * 设置焦点
   */
  focus() {
    this.propertyInput.focus();
  }
  
  /**
   * 销毁组件
   */
  destroy() {
    // 清理事件监听器和DOM
    this.container.innerHTML = '';
  }
}