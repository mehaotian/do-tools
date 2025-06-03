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
    this.isPreviewActive = false; // 预览状态
    
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
          
          <!-- 预览提示区域 -->
          <div class="background-preview-section">
            <div class="section-header">
              <h4>实时预览</h4>
            </div>
            <div class="preview-tip">
              <p>样式变更将直接在页面上预览，点击"应用"确认更改，点击"取消"恢复之前的样式</p>
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
      this.cancelPreview();
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
   * @param {string} selector - CSS选择器
   */
  show(currentStyles = {}, callback = null, selector = 'body') {
    this.currentStyles = { ...currentStyles };
    this.currentCallback = callback;
    this.currentSelector = selector; // 保存选择器
    this.isPreviewActive = false;
    
    this.renderPresets();
    this.renderCustomProperties();
    
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
    // 清除预览效果
    this.clearPagePreview();
    
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
      // 创建RGBA颜色选择器容器
      const colorContainer = document.createElement('div');
      colorContainer.className = 'color-input-container';
      
      // 创建颜色选择器行容器
      const colorPickerRow = document.createElement('div');
      colorPickerRow.className = 'color-picker-row';
      
      // 颜色文本输入框
      const colorTextInput = document.createElement('input');
      colorTextInput.type = 'text';
      colorTextInput.className = 'form-input color-text-input';
      colorTextInput.placeholder = '输入颜色值';
      
      // 颜色选择器
      const colorPicker = document.createElement('input');
      colorPicker.type = 'color';
      colorPicker.className = 'form-input color-picker';
      
      // 透明度滑块容器
      const alphaContainer = document.createElement('div');
      alphaContainer.className = 'alpha-container';
      
      const alphaLabel = document.createElement('label');
      alphaLabel.className = 'alpha-label';
      alphaLabel.textContent = '透明度:';
      
      const alphaSlider = document.createElement('input');
      alphaSlider.type = 'range';
      alphaSlider.className = 'alpha-slider';
      alphaSlider.min = '0';
      alphaSlider.max = '1';
      alphaSlider.step = '0.01';
      
      const alphaValue = document.createElement('span');
      alphaValue.className = 'alpha-value';
      
      // 隐藏的RGBA输入框
      input = document.createElement('input');
      input.type = 'hidden';
      input.className = 'rgba-input';
      
      // 解析当前值
      const currentValue = this.currentStyles[property];
      let hexColor = '#ffffff';
      let alpha = 1;
      
      console.log(`解析颜色属性 ${property}:`, currentValue); // 调试日志
      
      if (currentValue) {
        if (currentValue === 'transparent') {
          // 处理transparent值，显示为完全透明
          hexColor = '#000000';
          alpha = 0;
          console.log(`解析transparent成功: hex=${hexColor}, alpha=${alpha}`); // 调试日志
        } else if (currentValue.startsWith('rgba(')) {
          const rgbaMatch = currentValue.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
          if (rgbaMatch) {
            const [, r, g, b, a] = rgbaMatch;
            hexColor = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
            alpha = parseFloat(a);
            console.log(`解析RGBA成功: hex=${hexColor}, alpha=${alpha}`); // 调试日志
          }
        } else if (currentValue.startsWith('rgb(')) {
          const rgbMatch = currentValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (rgbMatch) {
            const [, r, g, b] = rgbMatch;
            hexColor = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
            alpha = 1;
            console.log(`解析RGB成功: hex=${hexColor}, alpha=${alpha}`); // 调试日志
          }
        } else if (currentValue.startsWith('#')) {
          // 处理十六进制颜色值，确保是6位格式
          if (currentValue.length === 4) {
            // 3位格式转6位格式 (#000 -> #000000)
            hexColor = `#${currentValue[1]}${currentValue[1]}${currentValue[2]}${currentValue[2]}${currentValue[3]}${currentValue[3]}`;
          } else {
            hexColor = currentValue;
          }
          alpha = 1;
          console.log(`解析HEX成功: hex=${hexColor}, alpha=${alpha}`); // 调试日志
        }
      } else {
        console.log(`使用默认颜色值: hex=${hexColor}, alpha=${alpha}`); // 调试日志
      }
      
      colorPicker.value = hexColor;
      alphaSlider.value = alpha;
      alphaValue.textContent = Math.round(alpha * 100) + '%';
      
      // 设置文本输入框的初始值
      const initialRgba = `rgba(${parseInt(hexColor.slice(1, 3), 16)}, ${parseInt(hexColor.slice(3, 5), 16)}, ${parseInt(hexColor.slice(5, 7), 16)}, ${alpha})`;
      colorTextInput.value = initialRgba;
      
      // 更新RGBA值的函数
      const updateRGBA = () => {
        const hex = colorPicker.value;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const a = parseFloat(alphaSlider.value);
        
        const rgba = `rgba(${r}, ${g}, ${b}, ${a})`;
        input.value = rgba;
        colorTextInput.value = rgba;
        alphaValue.textContent = Math.round(a * 100) + '%';
        
        // 触发属性更新
        this.updateProperty(property, rgba);
      };
      
      // 从文本输入框更新颜色的函数
      const updateFromText = () => {
        const textValue = colorTextInput.value.trim();
        let hexColor = '#ffffff';
        let alpha = 1;
        
        if (textValue.startsWith('rgba(')) {
          const rgbaMatch = textValue.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
          if (rgbaMatch) {
            const [, r, g, b, a] = rgbaMatch;
            hexColor = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
            alpha = parseFloat(a);
          }
        } else if (textValue.startsWith('rgb(')) {
          const rgbMatch = textValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (rgbMatch) {
            const [, r, g, b] = rgbMatch;
            hexColor = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
            alpha = 1;
          }
        } else if (textValue.startsWith('#')) {
          if (textValue.length === 4) {
            hexColor = `#${textValue[1]}${textValue[1]}${textValue[2]}${textValue[2]}${textValue[3]}${textValue[3]}`;
          } else if (textValue.length === 7) {
            hexColor = textValue;
          }
          alpha = 1;
        }
        
        colorPicker.value = hexColor;
        alphaSlider.value = alpha;
        alphaValue.textContent = Math.round(alpha * 100) + '%';
        
        const rgba = `rgba(${parseInt(hexColor.slice(1, 3), 16)}, ${parseInt(hexColor.slice(3, 5), 16)}, ${parseInt(hexColor.slice(5, 7), 16)}, ${alpha})`;
        input.value = rgba;
        
        // 触发属性更新
        this.updateProperty(property, rgba);
      };
      
      // 绑定事件
      colorPicker.addEventListener('input', updateRGBA);
      alphaSlider.addEventListener('input', updateRGBA);
      colorTextInput.addEventListener('blur', updateFromText);
      colorTextInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          updateFromText();
        }
      });
      
      // 组装元素
      alphaContainer.appendChild(alphaLabel);
      alphaContainer.appendChild(alphaSlider);
      alphaContainer.appendChild(alphaValue);
      
      colorPickerRow.appendChild(colorTextInput);
      colorPickerRow.appendChild(colorPicker);
      
      colorContainer.appendChild(colorPickerRow);
      colorContainer.appendChild(alphaContainer);
      colorContainer.appendChild(input);
      
      // 初始化RGBA值
      input.value = `rgba(${parseInt(hexColor.slice(1, 3), 16)}, ${parseInt(hexColor.slice(3, 5), 16)}, ${parseInt(hexColor.slice(5, 7), 16)}, ${alpha})`;
      
      wrapper.appendChild(colorContainer);
      return wrapper;
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
    
    // 只为非颜色输入绑定输入事件（颜色输入已在updateRGBA中处理）
    if (config.type !== 'color') {
      input.addEventListener('input', () => {
        this.updateProperty(property, input.value);
      });
      
      wrapper.appendChild(input);
    }
    
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
    
    // 直接预览到页面
    this.previewToPage();
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
    
    // 直接预览到页面
    this.previewToPage();
    
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
    // 直接预览到页面
    this.previewToPage();
  }

  /**
   * 预览样式到页面
   */
  async previewToPage() {
    // 清除之前的预览（不重置预览状态）
    await this.clearPagePreview(false);
    
    // 设置预览状态
    this.isPreviewActive = true;
    
    // 应用新的预览样式
    for (const [property, value] of Object.entries(this.currentStyles)) {
      if (value && value.trim()) {
        try {
          await this.previewStyle(this.currentSelector || 'body', property, value);
        } catch (error) {
          console.warn(`预览样式失败 ${property}: ${value}`, error);
        }
      }
    }
  }
  
  /**
   * 预览单个样式属性
   * @param {string} selector - CSS选择器
   * @param {string} property - CSS属性名
   * @param {string} value - CSS属性值
   */
  async previewStyle(selector, property, value) {
    // 导入Chrome API服务
    const { chromeApi } = await import('../services/chrome-api.js');
    return await chromeApi.previewStyle(selector, property, value);
  }
  
  /**
   * 清除页面预览效果
   * @param {boolean} resetState - 是否重置预览状态，默认为true
   */
  async clearPagePreview(resetState = true) {
    if (!this.isPreviewActive && resetState) {
      return;
    }
    
    try {
      // 导入Chrome API服务
      const { chromeApi } = await import('../services/chrome-api.js');
      await chromeApi.clearAllPreview();
      if (resetState) {
        this.isPreviewActive = false;
      }
    } catch (error) {
      console.warn('清除预览效果失败:', error);
    }
  }
  
  /**
   * 取消预览
   */
  async cancelPreview() {
    // 清除预览效果
    await this.clearPagePreview();
    
    // 重新应用当前主题以恢复之前的状态
    setTimeout(() => {
      if (window.themeManager) {
        window.themeManager.applyCurrentTheme();
      }
    }, 100);
    
    // 关闭模态框
    this.hide();
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
    console.log("应用样式:", this.currentStyles);
    
    if (this.currentCallback) {
      this.currentCallback(this.currentStyles);
    }
    
    // 直接关闭窗口，不清理样式
    this.modal.style.display = 'none';
    this.modal.classList.remove('show');
    this.isVisible = false;
    
    // 恢复页面滚动
    document.body.style.overflow = '';
  }
}

// 创建全局实例
export const backgroundHelper = new BackgroundHelper();