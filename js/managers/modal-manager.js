/**
 * 模态框管理器模块
 * 负责所有模态框的显示、隐藏、事件处理等功能
 */

import { Utils } from "../core/utils.js";
import { CSS_PROPERTIES, APP_CONFIG } from "../core/constants.js";
import { chromeApi } from "../services/chrome-api.js";

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
      const isInModal = e.target.closest(".modal");

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
        const isInModal = e.target.closest(".modal");

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
    const confirmAddGroupBtn = document.getElementById("confirmAddGroup");
    if (confirmAddGroupBtn) {
      confirmAddGroupBtn.addEventListener("click", () => {
        this.addGroup();
      });
    }

    // 添加规则确认按钮
    const confirmAddRuleBtn = document.getElementById("confirmAddRule");
    if (confirmAddRuleBtn) {
      confirmAddRuleBtn.addEventListener("click", () => {
        this.addCSSRule();
      });
    }

    // 模态框关闭按钮
    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal");
        if (modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // ESC键关闭模态框
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.openModalCount > 0) {
        const openModals = document.querySelectorAll(".modal.show");
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
    const selectorInput = document.getElementById("cssSelector");
    if (selectorInput) {
      selectorInput.addEventListener("input", () => {
        this.debouncedValidateSelector();
      });

      selectorInput.addEventListener("blur", () => {
        this.validateSelector();
      });
    }

    // 组名输入回车提交
    const groupNameInput = document.getElementById("groupName");
    if (groupNameInput) {
      groupNameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
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
      console.error("模态框不存在:", modalId);
      return;
    }

    // 增加打开的模态框计数
    this.openModalCount++;

    // 第一个模态框打开时锁定页面滚动
    if (this.openModalCount === 1) {
      this.lockPageScroll();
    }

    // 显示模态框
    modal.classList.add("show");
    modal.style.display = "flex";

    // 聚焦到第一个输入框
    const firstInput = modal.querySelector("input, textarea, select");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }

    // 触发显示事件
    this.emit("modalShown", { modalId, modal });
  }

  /**
   * 隐藏模态框
   * @param {string} modalId - 模态框ID
   * @param {boolean} immediate - 是否立即隐藏，跳过动画
   */
  hideModal(modalId, immediate = false) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error("模态框不存在:", modalId);
      return;
    }

    // 减少打开的模态框计数
    this.openModalCount = Math.max(0, this.openModalCount - 1);

    if (immediate) {
      // 立即隐藏，不等待动画
      modal.classList.remove("show");
      modal.classList.remove("hiding");
      modal.style.display = "none";
    } else {
      // 添加隐藏动画类
      modal.classList.remove("show");
      modal.classList.add("hiding");

      // 等待退出动画完成后隐藏
      setTimeout(() => {
        modal.classList.remove("hiding");
        modal.style.display = "none";
      }, APP_CONFIG.UI.MODAL_ANIMATION_DURATION);
    }

    // 最后一个模态框关闭时解锁页面滚动
    if (this.openModalCount === 0) {
      this.unlockPageScroll();
    }

    // 清空模态框输入
    this.clearModalInputs(modal);

    // 特殊处理：关闭规则编辑模态框时清除预览
    if (modalId === "addRuleModal") {
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
    this.emit("modalHidden", { modalId, modal });
  }

  /**
   * 锁定页面滚动
   */
  lockPageScroll() {
    // 保存当前滚动位置
    this.savedScrollPosition =
      window.pageYOffset || document.documentElement.scrollTop;

    // 添加modal-open类并设置body样式
    document.body.classList.add("modal-open");
    document.documentElement.classList.add("modal-open");
    document.body.style.position = "fixed";
    document.body.style.top = `-${this.savedScrollPosition}px`;
    document.body.style.width = "100%";

    // 添加事件监听器防止滚动
    document.addEventListener("wheel", this.preventScrollHandler, {
      passive: false,
    });
    document.addEventListener("touchmove", this.preventScrollHandler, {
      passive: false,
    });
    document.addEventListener("keydown", this.preventKeyScrollHandler, {
      passive: false,
    });
  }

  /**
   * 解锁页面滚动
   */
  unlockPageScroll() {
    // 移除事件监听器
    if (this.preventScrollHandler) {
      document.removeEventListener("wheel", this.preventScrollHandler);
      document.removeEventListener("touchmove", this.preventScrollHandler);
    }

    if (this.preventKeyScrollHandler) {
      document.removeEventListener("keydown", this.preventKeyScrollHandler);
    }

    // 恢复body样式
    document.body.classList.remove("modal-open");
    document.documentElement.classList.remove("modal-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";

    // 恢复滚动位置
    window.scrollTo(0, this.savedScrollPosition);
  }

  /**
   * 清空模态框输入
   * @param {HTMLElement} modal - 模态框元素
   */
  clearModalInputs(modal) {
    // 清空文本输入
    modal
      .querySelectorAll('input[type="text"], input[type="email"], textarea')
      .forEach((input) => {
        input.value = "";
      });

    // 重置选择框
    modal.querySelectorAll("select").forEach((select) => {
      select.selectedIndex = 0;
    });

    // 清空动态生成的内容
    const propertiesContainer = modal.querySelector("#cssProperties");
    if (propertiesContainer) {
      propertiesContainer.innerHTML = "";
    }

    // 重置选择器状态
    const indicator = modal.querySelector("#selectorStatusIndicator");
    const suggestions = modal.querySelector("#selectorSuggestions");
    if (indicator) {
      indicator.className = "selector-status-indicator";
    }
    if (suggestions) {
      suggestions.textContent = "";
      suggestions.style.display = "none";
    }
  }

  /**
   * 渲染属性分类
   */
  renderPropertyCategories() {
    const container = document.getElementById("propertyCategories");
    if (!container) return;

    container.innerHTML = "";

    Object.entries(CSS_PROPERTIES).forEach(([categoryKey, category]) => {
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "property-category";

      // 为外观分类添加背景助手入口
      let backgroundHelperHtml = "";
      if (categoryKey === "appearance") {
        backgroundHelperHtml = `
          <div class="property-item background-helper-entry" data-action="background-helper">
            <div class="property-name-cn">🎨 背景样式助手</div>
            <div class="property-name-en">可视化背景编辑器</div>
          </div>
        `;
      }

      categoryDiv.innerHTML = `
        <div class="property-category-header">${category.name}</div>
        <div class="property-category-list">
          ${backgroundHelperHtml}
          ${Object.entries(category.properties)
            .map(
              ([propKey, prop]) => `
            <div class="property-item" data-property="${propKey}" data-category="${categoryKey}">
              <div class="property-name-cn">${prop.name}</div>
              <div class="property-name-en">${propKey}</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      // 添加属性选择事件
      categoryDiv.addEventListener("click", (e) => {
        if (e.target.classList.contains("property-item")) {
          if (e.target.dataset.action === "background-helper") {
            // 打开背景助手
            this.openBackgroundHelper();
          } else {
            const property = e.target.dataset.property;
            const category = e.target.dataset.category;
            this.addPropertyEditor(
              property,
              CSS_PROPERTIES[category].properties[property]
            );
            // 检测修改并更新按钮状态
            window.themeManager?.handleThemeChange();
            // 立即关闭模态框，避免动画延迟导致的卡顿
            this.hideModal("propertySelectModal", true);
          }
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
    const container = document.getElementById("cssProperties");
    if (!container) return;

    // 检查是否已存在该属性
    const existing = container.querySelector(`[data-property="${property}"]`);
    if (existing) {
      existing.focus();
      return;
    }

    const editor = document.createElement("div");
    editor.className = "css-property-item";
    editor.setAttribute("data-property", property);

    let inputHtml = "";
    switch (config.type) {
      case "color":
        inputHtml = `
          <div class="color-input-container">
            <input type="color" class="form-input color-picker" data-property="${property}">
            <div class="alpha-container">
              <label class="alpha-label">透明度:</label>
              <input type="range" class="alpha-slider" min="0" max="1" step="0.01" value="1" data-property="${property}">
              <span class="alpha-value">100%</span>
            </div>
            <input type="hidden" class="property-value rgba-value" data-property="${property}">
          </div>`;
        break;
      case "range":
        inputHtml = `<input type="range" class="form-input property-value" data-property="${property}" 
          min="${config.min || 0}" max="${config.max || 100}" step="${
          config.step || 1
        }">`;
        break;
      case "select":
        inputHtml = `<select class="form-input property-value" data-property="${property}">
          ${config.options
            .map((option) => `<option value="${option}">${option}</option>`)
            .join("")}
        </select>`;
        break;
      case "combo":
        const datalistId = `datalist-${property}-${Date.now()}`;
        inputHtml = `<input type="text" class="form-input property-value" data-property="${property}" 
                     placeholder="输入${config.name}或选择预设值" list="${datalistId}">
                     <datalist id="${datalistId}">
                       ${config.options
                         .map((option) => `<option value="${option}">${option}</option>`)
                         .join("")}
                     </datalist>`;
        break;
      default:
        inputHtml = `<input type="text" class="form-input property-value" data-property="${property}" placeholder="输入${config.name}">`;
    }

    // 查找属性的中文名称
    let propInfo = null;
    for (const category in CSS_PROPERTIES) {
      if (CSS_PROPERTIES[category].properties[property]) {
        propInfo = CSS_PROPERTIES[category].properties[property];
        break;
      }
    }
    const chineseName = propInfo ? propInfo.name : property;

    editor.innerHTML = `
      <div class="property-name">
        <div class="property-name-cn">${chineseName}</div>
        <div class="property-name-en">${property}</div>
      </div>
      <input type="hidden" readonly value="${property}" class="property-name-input">
      ${inputHtml}
      <button type="button" class="property-remove">×</button>
    `;

    // 添加删除事件
    editor.querySelector(".property-remove").addEventListener("click", () => {
      editor.remove();
      this.clearPreviewForProperty(property);
      // 检测修改并更新按钮状态
      window.themeManager?.handleThemeChange();
    });

    // 添加实时预览事件
    if (config.type === 'color') {
      // 处理颜色选择器的特殊逻辑
      const colorPicker = editor.querySelector('.color-picker');
      const alphaSlider = editor.querySelector('.alpha-slider');
      const alphaValue = editor.querySelector('.alpha-value');
      const hiddenInput = editor.querySelector('.rgba-value');
      
      const updateRGBA = () => {
        const hex = colorPicker.value;
        const alpha = parseFloat(alphaSlider.value);
        
        // 将hex转换为RGB
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        // 生成RGBA值
        const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        hiddenInput.value = rgba;
        alphaValue.textContent = Math.round(alpha * 100) + '%';
        
        this.previewStyle(property, rgba);
        // 检测修改并更新按钮状态
        window.themeManager?.handleThemeChange();
      };
      
      colorPicker.addEventListener('input', updateRGBA);
      alphaSlider.addEventListener('input', updateRGBA);
      
      // 初始化RGBA值
      updateRGBA();
    } else {
      const propertyInput = editor.querySelector(".property-value");
      propertyInput.addEventListener("input", (e) => {
        this.previewStyle(property, e.target.value);
        // 检测修改并更新按钮状态
        window.themeManager?.handleThemeChange();
      });
      
      // 对于select和combo类型，也要监听change事件
      if (config.type === "select" || config.type === "combo") {
        propertyInput.addEventListener("change", (e) => {
          this.previewStyle(property, e.target.value);
          // 检测修改并更新按钮状态
          window.themeManager?.handleThemeChange();
        });
      }
    }

    container.appendChild(editor);

    // 对于select类型，立即应用默认选中的值
    if (config.type === "select" && config.options && config.options.length > 0) {
      this.previewStyle(property, config.options[0]);
    }
    
    // 注意：color类型的默认值现在由updateRGBA函数处理
  }

  /**
   * 实时预览样式效果
   * @param {string} property - CSS属性名
   * @param {string} value - CSS属性值
   */
  async previewStyle(property, value) {
    const selector = document.getElementById("cssSelector")?.value;
    console.log('-=-=-= 3 selector, property, value', selector, property, value);
    
    if (!selector || !property || !value) {
      return;
    }

    try {
      await chromeApi.previewStyle(selector, property, value);
    } catch (error) {
      console.warn("实时预览失败:", error);
    }
  }

  /**
   * 清除特定属性的预览效果
   * @param {string} property - CSS属性名
   */
  async clearPreviewForProperty(property) {
    const selector = document.getElementById("cssSelector")?.value;

    if (!selector || !property) {
      return;
    }

    try {
      await chromeApi.clearPreviewProperty(selector, property);
    } catch (error) {
      console.warn("清除预览失败:", error);
    }
  }

  /**
   * 清除所有预览效果
   */
  async clearAllPreview() {
    try {
      await chromeApi.clearAllPreview();
    } catch (error) {
      console.warn("清除所有预览失败:", error);
    }
  }

  /**
   * 验证选择器
   */
  async validateSelector() {
    const selector = document.getElementById("cssSelector")?.value;
    const indicator = document.getElementById("selectorStatusIndicator");
    const suggestions = document.getElementById("selectorSuggestions");

    if (!selector?.trim()) {
      if (indicator) indicator.className = "selector-status-indicator";
      if (suggestions) {
        suggestions.textContent = "";
        suggestions.style.display = "none";
      }
      await this.clearSelectorHighlight();
      return;
    }

    try {
      const result = await chromeApi.validateSelector(selector);

      if (result.success) {
        if (result.isValid) {
          if (indicator)
            indicator.className = "selector-status-indicator valid animate-in";
          if (suggestions) {
            suggestions.textContent = `找到 ${result.elementCount} 个匹配元素`;
            suggestions.className = "selector-suggestions success show";
            suggestions.style.display = "block";
          }
        } else {
          if (indicator)
            indicator.className =
              "selector-status-indicator invalid animate-in";
          if (suggestions) {
            suggestions.textContent =
              result.elementCount === 0 ? "未找到匹配元素" : "选择器语法错误";
            suggestions.className = "selector-suggestions error show";
            suggestions.style.display = "block";
          }
        }
      } else {
        if (indicator)
          indicator.className = "selector-status-indicator invalid animate-in";
        if (suggestions) {
          suggestions.textContent =
            result.error || "无法连接到页面，请确保页面已加载";
          suggestions.className = "selector-suggestions error show";
          suggestions.style.display = "block";
        }
      }
    } catch (error) {
      console.error("验证选择器时发生错误:", error);
      if (indicator)
        indicator.className = "selector-status-indicator invalid animate-in";
      if (suggestions) {
        suggestions.textContent = "验证失败，请确保页面已加载并刷新后重试";
        suggestions.className = "selector-suggestions error show";
        suggestions.style.display = "block";
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
      console.log("清除高亮失败:", error);
    }
  }

  /**
   * 添加组
   */
  addGroup() {
    const nameInput = document.getElementById("groupName");
    const descInput = document.getElementById("groupDescription");

    if (!nameInput || !descInput) return;

    const name = nameInput.value.trim();
    const description = descInput.value.trim();

    if (!name) {
      Utils.showToast("请输入组名称", "error");
      nameInput.focus();
      return;
    }

    const currentTheme = window.appState?.getCurrentTheme();
    if (!currentTheme) {
      Utils.showToast("请先选择或创建一个主题", "error");
      return;
    }

    const newGroup = {
      id: Utils.generateId(),
      name,
      description,
      rules: [],
    };

    currentTheme.groups.push(newGroup);
    window.appState.setCurrentTheme(currentTheme);
    window.themeManager?.renderGroups(currentTheme);

    // 触发主题修改状态检测
    window.themeManager?.handleThemeChange();

    // 清空输入框
    nameInput.value = "";
    descInput.value = "";

    this.hideModal("addGroupModal");
    Utils.showToast(`组 "${name}" 已添加`, "success");
  }

  /**
   * 添加或更新CSS规则
   */
  addCSSRule() {
    const selector = document.getElementById("cssSelector")?.value;
    const properties = {};

    // 收集属性
    document.querySelectorAll(".css-property-item").forEach((editor) => {
      const propertyNameElement = editor.querySelector(".property-name-input");
      const propertyValueElement = editor.querySelector(".property-value");

      const propertyName = propertyNameElement?.value;
      const propertyValue = propertyValueElement?.value;

      if (propertyName && propertyValue) {
        properties[propertyName] = propertyValue;
      }
    });

    if (!selector?.trim()) {
      Utils.showToast("请输入CSS选择器", "error");
      return;
    }

    if (Object.keys(properties).length === 0) {
      Utils.showToast("请至少添加一个CSS属性", "error");
      return;
    }

    const currentTheme = window.appState?.getCurrentTheme();
    if (!currentTheme) {
      Utils.showToast("请先选择或创建一个主题", "error");
      return;
    }

    const group = currentTheme.groups.find((g) => g.id === this.currentGroupId);
    if (!group) {
      Utils.showToast("无法找到目标组，请重试", "error");
      return;
    }

    // 判断是编辑模式还是添加模式
    if (this.currentRuleIndex !== null && this.currentRuleIndex >= 0) {
      // 编辑模式：更新现有规则
      if (group.rules[this.currentRuleIndex]) {
        group.rules[this.currentRuleIndex] = { selector, properties };
        Utils.showToast("CSS规则已更新并应用", "success");
      } else {
        Utils.showToast("无法找到要编辑的规则", "error");
        return;
      }
    } else {
      // 添加模式：新增规则
      group.rules.push({ selector, properties });
      Utils.showToast("CSS规则已添加并应用", "success");
    }

    // 清除预览效果
    this.clearAllPreview();

    // 重新应用当前主题
    setTimeout(() => {
      window.themeManager?.applyCurrentTheme();
    }, 100);

    window.appState.setCurrentTheme(currentTheme);
    window.themeManager?.renderGroups(currentTheme);

    // 触发主题修改状态检测
    window.themeManager?.handleThemeChange();

    this.hideModal("addRuleModal");
  }

  /**
   * 显示添加组模态框
   */
  showAddGroupModal() {
    this.resetAddGroupModalState();
    this.showModal("addGroupModal");
  }

  /**
   * 隐藏添加组模态框
   */
  hideAddGroupModal() {
    this.hideModal("addGroupModal");
  }

  /**
   * 显示添加规则模态框
   * @param {string} groupId - 组ID
   */
  showAddRuleModal(groupId) {
    this.currentGroupId = groupId;
    this.currentRuleIndex = null;
    this.resetAddRuleModalState();
    this.showModal("addRuleModal");
  }

  /**
   * 隐藏添加规则模态框
   */
  hideAddRuleModal() {
    this.hideModal("addRuleModal");
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
    const selectorInput = document.getElementById("cssSelector");
    const modalTitle = document.querySelector("#addRuleModal .modal-title");
    const confirmBtn = document.getElementById("confirmAddRule");

    if (modalTitle) modalTitle.textContent = "编辑CSS规则";
    if (confirmBtn) confirmBtn.textContent = "保存修改";
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
        this.addPropertyEditor(
          prop,
          propertyConfig || { type: "text", name: prop }
        );

        // 设置属性值
        const propertyInput = document.querySelector(
          `[data-property="${prop}"]`
        );
        if (propertyInput) {
          propertyInput.value = value;
        }
      });
    }

    this.showModal("addRuleModal");
  }

  /**
   * 重置添加组模态框状态
   */
  resetAddGroupModalState() {
    const groupNameInput = document.getElementById("groupName");
    if (groupNameInput) {
      groupNameInput.value = "";
    }
  }

  /**
   * 重置添加规则模态框状态
   */
  resetAddRuleModalState() {
    const selectorInput = document.getElementById("cssSelector");
    const propertiesContainer = document.getElementById("cssProperties");
    const indicator = document.getElementById("selectorStatusIndicator");
    const suggestions = document.getElementById("selectorSuggestions");
    const modalTitle = document.querySelector("#addRuleModal .modal-title");
    const confirmBtn = document.getElementById("confirmAddRule");

    if (selectorInput) selectorInput.value = "";
    if (propertiesContainer) propertiesContainer.innerHTML = "";
    if (modalTitle) modalTitle.textContent = "添加CSS规则";
    if (confirmBtn) confirmBtn.textContent = "添加规则";

    if (indicator) indicator.className = "selector-status-indicator";
    if (suggestions) {
      // 添加隐藏动画
      if (suggestions.classList.contains("show")) {
        suggestions.className = "selector-suggestions hide";
        setTimeout(() => {
          suggestions.textContent = "";
          suggestions.className = "selector-suggestions";
          suggestions.style.display = "none";
        }, 200); // 等待动画完成
      } else {
        suggestions.textContent = "";
        suggestions.className = "selector-suggestions";
        suggestions.style.display = "none";
      }
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

  /**
   * 打开背景样式助手
   */
  openBackgroundHelper() {
    // 先关闭属性选择模态框
    this.hideModal("propertySelectModal", true);

    // 获取当前已有的背景相关样式
    const currentStyles = this.getCurrentBackgroundStyles();
    
    // 获取当前的CSS选择器
    const currentSelector = document.getElementById("cssSelector")?.value || 'body';

    // 导入背景助手并显示
    import("../components/background-helper.js")
      .then(({ backgroundHelper }) => {
        backgroundHelper.show(currentStyles, (appliedStyles) => {
          console.log("++++ appliedStyles", appliedStyles);

          this.applyBackgroundStyles(appliedStyles);
        }, currentSelector);
      })
      .catch((error) => {
        console.error("加载背景助手失败:", error);
        Utils.showToast("背景助手加载失败", "error");
      });
  }

  /**
   * 获取当前的背景相关样式
   * @returns {Object} 背景样式对象
   */
  getCurrentBackgroundStyles() {
    const styles = {};
    const container = document.getElementById("cssProperties");
    if (!container) return styles;

    // 收集所有背景相关的属性
    const backgroundProperties = [
      "background-color",
      "background-image",
      "background-size",
      "background-position",
      "background-repeat",
      "background-attachment",
      "background-clip",
      "background-origin",
      "background-blend-mode",
    ];

    container.querySelectorAll(".css-property-item").forEach((item) => {
      const property = item.dataset.property;
      if (backgroundProperties.includes(property)) {
        const valueInput = item.querySelector(".property-value");
        if (valueInput && valueInput.value.trim()) {
          styles[property] = valueInput.value.trim();
        }
      }
    });

    return styles;
  }

  /**
   * 应用背景样式到当前规则
   * @param {Object} styles - 背景样式对象
   */
  applyBackgroundStyles(styles) {
    Object.entries(styles).forEach(([property, value]) => {
      if (value && value.trim()) {
        // 查找现有的属性编辑器
        const container = document.getElementById("cssProperties");
        let existingEditor = container?.querySelector(
          `[data-property="${property}"]`
        );
        console.log("-----1 existingEditor", existingEditor);

        if (existingEditor) {
          // 更新现有编辑器的值
          const valueInput = existingEditor.querySelector(".property-value");
          console.log("-----2 valueInput", valueInput);

          if (valueInput) {
            // 特殊处理颜色属性
            if (property.includes('color') && existingEditor.querySelector('.color-input-container')) {
              this.updateColorEditor(existingEditor, value);
            } else {
              valueInput.value = value;
            }
            // 触发输入事件以更新状态
            valueInput.dispatchEvent(new Event("input", { bubbles: true }));
            // 立即应用预览效果
            this.previewStyle(property, value);
          }
        } else {
          // 添加新的属性编辑器
          const config = this.findPropertyConfig(property);
          if (config) {
            this.addPropertyEditor(property, config);
            // 设置值 - 现在可以立即获取到元素
            const newEditor = container?.querySelector(
              `[data-property="${property}"]`
            );
            const valueInput = newEditor?.querySelector(".property-value");
            if (valueInput) {
              // 特殊处理颜色属性
              if (property.includes('color') && newEditor.querySelector('.color-input-container')) {
                this.updateColorEditor(newEditor, value);
              } else {
                valueInput.value = value;
              }
              valueInput.dispatchEvent(new Event("input", { bubbles: true }));
              // 立即应用预览效果
              this.previewStyle(property, value);
            }
          }
        }
      }
    });

    // 检测修改并更新按钮状态
    window.themeManager?.handleThemeChange();

    Utils.showToast("背景样式已应用", "success");
  }

  /**
   * 更新颜色编辑器
   * @param {HTMLElement} editor - 颜色编辑器元素
   * @param {string} value - 颜色值
   */
  updateColorEditor(editor, value) {
    const colorPicker = editor.querySelector('.color-picker');
    const alphaSlider = editor.querySelector('.alpha-slider');
    const alphaValue = editor.querySelector('.alpha-value');
    const hiddenInput = editor.querySelector('.rgba-value');
    
    console.log('更新颜色编辑器:', value); // 调试日志
    
    let hexColor = '#ffffff';
    let alpha = 1;
    
    if (value) {
      if (value === 'transparent') {
        // 处理transparent值，显示为完全透明
        hexColor = '#000000';
        alpha = 0;
        console.log(`解析transparent成功: hex=${hexColor}, alpha=${alpha}`); // 调试日志
        console.log(`hexColor长度检查: ${hexColor.length}`); // 调试hexColor长度
      } else if (value.startsWith('rgba(')) {
        const rgbaMatch = value.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (rgbaMatch) {
          const [, r, g, b, a] = rgbaMatch;
          hexColor = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
          alpha = parseFloat(a);
          console.log(`解析RGBA成功: hex=${hexColor}, alpha=${alpha}`); // 调试日志
        }
      } else if (value.startsWith('rgb(')) {
        const rgbMatch = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch;
          hexColor = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
          alpha = 1;
          console.log(`解析RGB成功: hex=${hexColor}, alpha=${alpha}`); // 调试日志
        }
      } else if (value.startsWith('#')) {
        // 处理十六进制颜色值，确保是6位格式
        if (value.length === 4) {
          // 3位格式转6位格式 (#000 -> #000000)
          hexColor = `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
        } else {
          hexColor = value;
        }
        alpha = 1;
        console.log(`解析HEX成功: hex=${hexColor}, alpha=${alpha}`); // 调试日志
      }
    }
    
    // 更新UI元素
    if (colorPicker) colorPicker.value = hexColor;
    if (alphaSlider) alphaSlider.value = alpha;
    if (alphaValue) alphaValue.textContent = Math.round(alpha * 100) + '%';
    if (hiddenInput) hiddenInput.value = value;
    
    console.log('颜色编辑器更新完成'); // 调试日志
  }

  /**
   * 查找属性配置
   * @param {string} property - CSS属性名
   * @returns {Object|null} 属性配置
   */
  findPropertyConfig(property) {
    for (const [categoryKey, category] of Object.entries(CSS_PROPERTIES)) {
      if (category.properties[property]) {
        return category.properties[property];
      }
    }
    return null;
  }
}
