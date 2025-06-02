/**
 * 背景样式助手组件
 * 提供可视化的背景样式编辑界面和预设选择
 */

import { BACKGROUND_PRESETS, getAllBackgroundPresets, searchBackgroundPresets } from '../templates/background-presets.js';
import { Utils } from '../core/utils.js';

/**
 * 背景样式助手类
 */
export class BackgroundHelper {
  constructor() {
    this.isVisible = false;
    this.currentCallback = null;
    this.currentStyles = {};
    
    this.createHelperModal();
    this.bindEvents();
  }

  /**
   * 创建背景助手模态框
   */
  createHelperModal() {
    const modal = document.createElement('div');
    modal.className = 'modal background-helper-modal';
    modal.id = 'backgroundHelperModal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="modal-content background-helper-content">
        <div class="modal-header">
          <h3>背景样式助手</h3>
          <button class="modal-close" id="closeBackgroundHelper">&times;</button>
        </div>
        <div class="modal-body">
          <!-- 预设选择区域 -->
          <div class="background-presets-section">
            <div class="section-header">
              <h4>预设样式</h4>
              <div class="preset-search">
                <input type="text" id="presetSearch" class="form-input" placeholder="搜索预设样式...">
              </div>
            </div>
            <div class="preset-categories" id="presetCategories">
              <!-- 预设分类将动态生成 -->
            </div>
          </div>
          
          <!-- 自定义编辑区域 -->
          <div class="background-custom-section">
            <div class="section-header">
              <h4>自定义设置</h4>
              <button class="btn btn-sm btn-outline" id="resetBackground">重置</button>
            </div>
            <div class="background-properties" id="backgroundProperties">
              <!-- 背景属性编辑器将动态生成 -->
            </div>
          </div>
          
          <!-- 预览区域 -->
          <div class="background-preview-section">
            <div class="section-header">
              <h4>效果预览</h4>
            </div>
            <div class="background-preview" id="backgroundPreview">
              <div class="preview-content">
                <p>这是背景效果预览</p>
                <p>您可以在这里看到背景样式的实际效果</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="cancelBackgroundHelper">取消</button>
          <button class="btn btn-primary" id="applyBackgroundHelper">应用</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.modal = modal;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 关闭按钮
    this.modal.querySelector('#closeBackgroundHelper').addEventListener('click', () => {
      this.hide();
    });
    
    // 取消按钮
    this.modal.querySelector('#cancelBackgroundHelper').addEventListener('click', () => {
      this.hide();
    });
    
    // 应用按钮
    this.modal.querySelector('#applyBackgroundHelper').addEventListener('click', () => {
      this.applyStyles();
    });
    
    // 重置按钮
    this.modal.querySelector('#resetBackground').addEventListener('click', () => {
      this.resetStyles();
    });
    
    // 搜索输入
    const searchInput = this.modal.querySelector('#presetSearch');
    searchInput.addEventListener('input', Utils.debounce((e) => {
      this.filterPresets(e.target.value);
    }, 300));
    
    // 点击模态框背景关闭
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
  }

  /**
   * 显示背景助手
   * @param {Object} currentStyles - 当前样式
   * @param {Function} callback - 应用样式的回调函数
   */
  show(currentStyles = {}, callback = null) {
    this.currentStyles = { ...currentStyles };
    this.currentCallback = callback;
    
    this.renderPresets();
    this.renderCustomProperties();
    this.updatePreview();
    
    // 使用与其他模态框一致的显示方式
    this.modal.style.display = 'flex';
    this.modal.classList.add('show');
    this.isVisible = true;
    
    // 防止页面滚动
    document.body.style.overflow = 'hidden';
  }

  /**
   * 隐藏背景助手
   */
  hide() {
    // 添加隐藏动画
    this.modal.classList.add('hiding');
    this.modal.classList.remove('show');
    
    // 延迟隐藏以等待动画完成
    setTimeout(() => {
      this.modal.style.display = 'none';
      this.modal.classList.remove('hiding');
    }, 300);
    
    this.isVisible = false;
    
    // 恢复页面滚动
    document.body.style.overflow = '';
  }

  /**
   * 渲染预设样式
   */
  renderPresets() {
    const container = this.modal.querySelector('#presetCategories');
    container.innerHTML = '';
    
    Object.entries(BACKGROUND_PRESETS).forEach(([key, category]) => {
      const categoryElement = document.createElement('div');
      categoryElement.className = 'preset-category';
      
      categoryElement.innerHTML = `
        <div class="category-header">
          <h5>${category.name}</h5>
        </div>
        <div class="preset-grid">
          ${category.presets.map(preset => `
            <div class="preset-item" data-preset='${JSON.stringify(preset.styles).replace(/'/g, "&apos;")}'>
              <div class="preset-preview" style="${this.stylesToCss(preset.styles)}"></div>
              <div class="preset-name">${preset.name}</div>
            </div>
          `).join('')}
        </div>
      `;
      
      container.appendChild(categoryElement);
    });
    
    // 绑定预设点击事件
    container.addEventListener('click', (e) => {
      const presetItem = e.target.closest('.preset-item');
      if (presetItem) {
        try {
          const presetStyles = JSON.parse(presetItem.dataset.preset.replace(/&apos;/g, "'"));
          console.log('选中的预设样式:', presetStyles); // 调试日志
          this.applyPreset(presetStyles, presetItem);
        } catch (error) {
          console.error('解析预设样式失败:', error);
          Utils.showToast('预设样式解析失败', 'error');
        }
      }
    });
  }

  /**
   * 渲染自定义属性编辑器
   */
  renderCustomProperties() {
    const container = this.modal.querySelector('#backgroundProperties');
    container.innerHTML = '';
    
    const backgroundProperties = {
      'background-color': { name: '背景颜色', type: 'color' },
      'background-image': { name: '背景图片', type: 'text', placeholder: 'url(image.jpg) 或 linear-gradient(...)' },
      'background-size': { 
        name: '背景大小', 
        type: 'select', 
        options: ['auto', 'cover', 'contain', '100%', '100% 100%', '50%', '200px', '200px 100px'] 
      },
      'background-position': { 
        name: '背景位置', 
        type: 'select', 
        options: ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'] 
      },
      'background-repeat': { 
        name: '背景重复', 
        type: 'select', 
        options: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'space', 'round'] 
      },
      'background-attachment': { 
        name: '背景附着', 
        type: 'select', 
        options: ['scroll', 'fixed', 'local'] 
      },
      'background-blend-mode': { 
        name: '混合模式', 
        type: 'select', 
        options: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn'] 
      }
    };
    
    Object.entries(backgroundProperties).forEach(([property, config]) => {
      const propertyElement = this.createPropertyEditor(property, config);
      container.appendChild(propertyElement);
    });
  }

  /**
   * 创建属性编辑器
   * @param {string} property - CSS属性名
   * @param {Object} config - 属性配置
   * @returns {HTMLElement} 属性编辑器元素
   */
  createPropertyEditor(property, config) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = config.name;
    wrapper.appendChild(label);
    
    let input;
    
    if (config.type === 'color') {
      input = document.createElement('input');
      input.type = 'color';
      input.className = 'form-input color-input';
      input.value = this.currentStyles[property] || '#ffffff';
    } else if (config.type === 'select') {
      input = document.createElement('select');
      input.className = 'form-select';
      
      // 添加空选项
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = '请选择...';
      input.appendChild(emptyOption);
      
      config.options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        if (this.currentStyles[property] === option) {
          optionElement.selected = true;
        }
        input.appendChild(optionElement);
      });
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-input';
      input.placeholder = config.placeholder || '';
      input.value = this.currentStyles[property] || '';
    }
    
    input.dataset.property = property;
    
    // 绑定输入事件
    input.addEventListener('input', () => {
      this.updateProperty(property, input.value);
    });
    
    wrapper.appendChild(input);
    return wrapper;
  }

  /**
   * 更新属性值
   * @param {string} property - CSS属性名
   * @param {string} value - 属性值
   */
  updateProperty(property, value) {
    if (value.trim()) {
      this.currentStyles[property] = value;
    } else {
      delete this.currentStyles[property];
    }
    
    this.updatePreview();
  }

  /**
   * 应用预设样式
   * @param {Object} presetStyles - 预设样式
   * @param {HTMLElement} selectedItem - 选中的预设项元素（可选）
   */
  applyPreset(presetStyles, selectedItem = null) {
    // 合并预设样式到当前样式
    this.currentStyles = { ...this.currentStyles, ...presetStyles };
    
    // 重新渲染属性编辑器以显示新值
    this.renderCustomProperties();
    
    // 更新预览
    this.updatePreview();
    
    // 高亮选中的预设
    this.modal.querySelectorAll('.preset-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // 高亮选中项
    if (selectedItem) {
      selectedItem.classList.add('selected');
    }
    
    console.log('应用预设样式后的currentStyles:', this.currentStyles); // 调试日志
  }

  /**
   * 重置样式
   */
  resetStyles() {
    this.currentStyles = {};
    this.renderCustomProperties();
    this.updatePreview();
  }

  /**
   * 更新预览
   */
  updatePreview() {
    const preview = this.modal.querySelector('#backgroundPreview');
    const cssText = this.stylesToCss(this.currentStyles);
    preview.style.cssText = cssText;
  }

  /**
   * 将样式对象转换为CSS文本
   * @param {Object} styles - 样式对象
   * @returns {string} CSS文本
   */
  stylesToCss(styles) {
    return Object.entries(styles)
      .map(([property, value]) => `${property}: ${value}`)
      .join('; ');
  }

  /**
   * 过滤预设样式
   * @param {string} keyword - 搜索关键词
   */
  filterPresets(keyword) {
    const categories = this.modal.querySelectorAll('.preset-category');
    
    if (!keyword.trim()) {
      categories.forEach(category => {
        category.style.display = 'block';
        category.querySelectorAll('.preset-item').forEach(item => {
          item.style.display = 'block';
        });
      });
      return;
    }
    
    const lowerKeyword = keyword.toLowerCase();
    
    categories.forEach(category => {
      let hasVisibleItems = false;
      
      category.querySelectorAll('.preset-item').forEach(item => {
        const name = item.querySelector('.preset-name').textContent.toLowerCase();
        if (name.includes(lowerKeyword)) {
          item.style.display = 'block';
          hasVisibleItems = true;
        } else {
          item.style.display = 'none';
        }
      });
      
      category.style.display = hasVisibleItems ? 'block' : 'none';
    });
  }

  /**
   * 应用样式
   */
  applyStyles() {
    if (this.currentCallback) {
      this.currentCallback(this.currentStyles);
    }
    this.hide();
  }
}

// 创建全局实例
export const backgroundHelper = new BackgroundHelper();