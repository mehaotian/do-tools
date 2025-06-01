/**
 * 页面美化 - 可视化CSS编辑器
 * 主要功能模块
 */

// 全局状态管理
class AppState {
  constructor() {
    this.currentTheme = null; // 当前主题
    this.customThemes = []; // 自定义主题
    this.presetThemes = []; // 预制主题
    this.activeGroup = null; // 当前激活的分组
    this.appliedThemeId = null; // 当前应用的主题ID
  }

  // 设置当前主题
  setCurrentTheme(theme) {
    this.currentTheme = theme;
    this.notifyStateChange("themeChanged", theme);
  }

  // 设置应用的主题ID并保存到chrome.storage.sync
  setAppliedTheme(themeId) {
    this.appliedThemeId = themeId;
    this.saveAppliedTheme();
  }

  // 保存应用的主题ID到chrome.storage.sync
  saveAppliedTheme() {
    chrome.storage.sync
      .set({
        appliedThemeId: this.appliedThemeId || "",
      })
      .catch((error) => {
        console.error("保存应用主题ID失败:", error);
      });
  }

  // 从chrome.storage.sync加载应用的主题ID
  async loadAppliedTheme() {
    try {
      const result = await chrome.storage.sync.get(["appliedThemeId"]);
      const saved = result.appliedThemeId;
      if (saved) {
        this.appliedThemeId = saved;
        return saved;
      }
      return null;
    } catch (error) {
      console.error("加载应用主题ID失败:", error);
      return null;
    }
  }

  // 添加自定义主题
  addCustomTheme(theme) {
    this.customThemes.push(theme);
    this.notifyStateChange("customThemesChanged", this.customThemes);
  }

  // 删除自定义主题
  removeCustomTheme(themeId) {
    this.customThemes = this.customThemes.filter(
      (theme) => theme.id !== themeId
    );
    this.notifyStateChange("customThemesChanged", this.customThemes);
  }

  // 状态变化通知
  notifyStateChange(event, data) {
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

// CSS属性定义
const CSS_PROPERTIES = {
  layout: {
    name: "布局",
    properties: {
      display: {
        name: "显示方式",
        type: "select",
        options: ["block", "inline", "flex", "grid", "none"],
      },
      position: {
        name: "定位",
        type: "select",
        options: ["static", "relative", "absolute", "fixed", "sticky"],
      },
      width: { name: "宽度", type: "text", unit: "px" },
      height: { name: "高度", type: "text", unit: "px" },
      margin: { name: "外边距", type: "text", unit: "px" },
      padding: { name: "内边距", type: "text", unit: "px" },
      top: { name: "顶部距离", type: "text", unit: "px" },
      left: { name: "左侧距离", type: "text", unit: "px" },
      right: { name: "右侧距离", type: "text", unit: "px" },
      bottom: { name: "底部距离", type: "text", unit: "px" },
      "z-index": { name: "层级", type: "number" },
    },
  },
  appearance: {
    name: "外观",
    properties: {
      "background-color": { name: "背景颜色", type: "color" },
      "background-image": { name: "背景图片", type: "text" },
      "background-size": {
        name: "背景大小",
        type: "select",
        options: ["auto", "cover", "contain"],
      },
      "background-position": { name: "背景位置", type: "text" },
      "background-repeat": {
        name: "背景重复",
        type: "select",
        options: ["repeat", "no-repeat", "repeat-x", "repeat-y"],
      },
      border: { name: "边框", type: "text" },
      "border-radius": { name: "圆角", type: "text", unit: "px" },
      "box-shadow": { name: "阴影", type: "text" },
      opacity: { name: "透明度", type: "range", min: 0, max: 1, step: 0.1 },
    },
  },
  typography: {
    name: "文字",
    properties: {
      color: { name: "文字颜色", type: "color" },
      "font-size": { name: "字体大小", type: "text", unit: "px" },
      "font-weight": {
        name: "字体粗细",
        type: "select",
        options: [
          "normal",
          "bold",
          "100",
          "200",
          "300",
          "400",
          "500",
          "600",
          "700",
          "800",
          "900",
        ],
      },
      "font-family": { name: "字体族", type: "text" },
      "line-height": { name: "行高", type: "text" },
      "text-align": {
        name: "文字对齐",
        type: "select",
        options: ["left", "center", "right", "justify"],
      },
      "text-decoration": {
        name: "文字装饰",
        type: "select",
        options: ["none", "underline", "overline", "line-through"],
      },
      "text-transform": {
        name: "文字转换",
        type: "select",
        options: ["none", "uppercase", "lowercase", "capitalize"],
      },
    },
  },
  effects: {
    name: "特效",
    properties: {
      filter: { name: "滤镜", type: "text" },
      "backdrop-filter": { name: "背景滤镜", type: "text" },
      transform: { name: "变换", type: "text" },
      transition: { name: "过渡", type: "text" },
      animation: { name: "动画", type: "text" },
    },
  },
};

// 预制主题定义
const PRESET_THEMES = [
  {
    id: "none",
    name: "无主题",
    description: "不应用任何样式修改",
    groups: [],
  },
  {
    id: "modern-light",
    name: "现代浅色",
    description: "简洁现代的浅色主题",
    groups: [
      {
        id: "navbar",
        name: "导航栏美化",
        description: "为导航栏添加现代化样式",
        rules: [
          {
            selector: "nav, .navbar, header",
            properties: {
              "background-color": "rgba(255, 255, 255, 0.9)",
              "backdrop-filter": "blur(10px)",
              "border-bottom": "1px solid rgba(0, 0, 0, 0.1)",
              "box-shadow": "0 2px 10px rgba(0, 0, 0, 0.1)",
            },
          },
        ],
      },
      {
        id: "content",
        name: "内容区域",
        description: "优化内容区域的显示效果",
        rules: [
          {
            selector: "main, .main-content, .content",
            properties: {
              "background-color": "#ffffff",
              "border-radius": "8px",
              "box-shadow": "0 1px 3px rgba(0, 0, 0, 0.1)",
              padding: "20px",
            },
          },
        ],
      },
    ],
  },
  {
    id: "modern-dark",
    name: "现代深色",
    description: "优雅的深色主题",
    groups: [
      {
        id: "global",
        name: "全局样式",
        description: "深色主题的全局样式",
        rules: [
          {
            selector: "body",
            properties: {
              "background-color": "#1a1a1a",
              color: "#ffffff",
            },
          },
        ],
      },
      {
        id: "navbar",
        name: "导航栏",
        description: "深色导航栏样式",
        rules: [
          {
            selector: "nav, .navbar, header",
            properties: {
              "background-color": "rgba(30, 30, 30, 0.9)",
              "backdrop-filter": "blur(10px)",
              "border-bottom": "1px solid rgba(255, 255, 255, 0.1)",
            },
          },
        ],
      },
    ],
  },
];

// 工具函数
class Utils {
  // 生成唯一ID
  static generateId() {
    return "id_" + Math.random().toString(36).substr(2, 9);
  }

  // 显示Toast通知
  static showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
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
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
    // 延迟初始化，等待DOM加载完成
    setTimeout(() => {
      this.init();
    }, 100);
  }

  // 初始化主题管理器
  async init() {
    this.loadPresetThemes();
    await this.loadCustomThemes();
    this.renderPresetThemes();
    this.renderCustomThemes();

    // 恢复上次应用的主题状态
    await this.restoreAppliedTheme();
  }

  // 恢复上次应用的主题状态
  async restoreAppliedTheme() {
    const appliedThemeId = await this.appState.loadAppliedTheme();
    if (!appliedThemeId) return;

    console.log("恢复主题:", appliedThemeId);

    // 查找并选中对应的主题（恢复UI状态和显示内容，但不重新应用主题）
    if (appliedThemeId === "none" || appliedThemeId === "default") {
      // 恢复无主题选中状态（兼容旧的default值）
      this.selectNoneTheme(false);
    } else {
      // 查找预制主题
      const presetTheme = this.appState.presetThemes.find(
        (theme) => theme.id === appliedThemeId
      );
      if (presetTheme) {
        // 手动设置UI状态和显示内容，但不应用主题
        this.restoreThemeUIState(presetTheme, "preset");
        return;
      }

      // 查找自定义主题
      const customTheme = this.appState.customThemes.find(
        (theme) => theme.id === appliedThemeId
      );
      if (customTheme) {
        // 手动设置UI状态和显示内容，但不应用主题
        this.restoreThemeUIState(customTheme, "custom");
        return;
      }
    }
  }

  // 恢复主题UI状态（仅用于页面初始化时恢复状态）
  restoreThemeUIState(theme, type) {
    // 清除其他选中状态
    document.querySelectorAll(".preset-theme-card.active").forEach((card) => {
      card.classList.remove("active");
    });
    document.querySelectorAll(".custom-theme-item.active").forEach((item) => {
      item.classList.remove("active");
    });

    // 设置当前主题为选中状态
    const element = document.querySelector(`[data-theme-id="${theme.id}"]`);
    if (element) {
      element.classList.add("active");
    }

    if (type === "preset") {
      // 对于预制主题，创建可编辑副本
      const editableTheme = Utils.deepClone(theme);
      editableTheme.id = Utils.generateId();
      editableTheme.isCustom = true;
      this.appState.setCurrentTheme(editableTheme);
      this.showThemeEditor(editableTheme);
    } else if (type === "custom") {
      // 对于自定义主题，直接设置
      this.appState.setCurrentTheme(theme);
      this.showThemeEditor(theme);
    }
  }

  // 加载预制主题
  loadPresetThemes() {
    this.appState.presetThemes = PRESET_THEMES;
  }

  // 加载自定义主题
  async loadCustomThemes() {
    try {
      const result = await chrome.storage.sync.get(["customThemes"]);
      if (result.customThemes && Array.isArray(result.customThemes)) {
        this.appState.customThemes = result.customThemes;
      }
    } catch (error) {
      console.error("Failed to load custom themes:", error);
    }
  }

  // 保存自定义主题到chrome.storage.sync
  saveCustomThemes() {
    chrome.storage.sync
      .set({
        customThemes: this.appState.customThemes,
      })
      .catch((error) => {
        console.error("Failed to save custom themes:", error);
      });
  }

  // 渲染预制主题
  renderPresetThemes() {
    const container = document.getElementById("presetThemes");
    // 保留无主题，清空其他内容
    const noneTheme = container.querySelector('[data-theme-id="none"]');
    container.innerHTML = "";

    // 重新添加无主题
    if (noneTheme) {
      container.appendChild(noneTheme);
      // 添加无主题点击事件
      noneTheme.addEventListener("click", () => {
        this.selectNoneTheme();
      });
    }

    this.appState.presetThemes.forEach((theme) => {
      // 跳过无主题，因为已经在HTML中定义
      if (theme.id === "none") return;

      const card = document.createElement("div");
      card.className = "preset-theme-card";
      card.setAttribute("data-theme-id", theme.id);
      card.innerHTML = `
        <h4>${theme.name}</h4>
        <p>${theme.description}</p>
      `;

      card.addEventListener("click", () => {
        this.selectPresetTheme(theme);
      });

      container.appendChild(card);
    });
  }

  // 渲染自定义主题
  renderCustomThemes() {
    const container = document.getElementById("customThemesList");
    container.innerHTML = "";

    this.appState.customThemes.forEach((theme) => {
      const item = document.createElement("div");
      item.className = "custom-theme-item";
      item.setAttribute("data-theme-id", theme.id);
      item.innerHTML = `
        <div class="custom-theme-info">
          <h5>${theme.name}</h5>
          <p>${theme.description || "无描述"}</p>
        </div>
        <div class="custom-theme-actions">
          <button title="编辑" data-action="edit" data-id="${
            theme.id
          }">✏️</button>
          <button title="删除" data-action="delete" data-id="${
            theme.id
          }">🗑️</button>
        </div>
      `;

      // 点击主题项选择主题
      item.addEventListener("click", (e) => {
        if (!e.target.closest(".custom-theme-actions")) {
          this.selectCustomTheme(theme);
        }
      });

      // 处理操作按钮
      item.addEventListener("click", (e) => {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;

        if (action === "edit") {
          this.editCustomTheme(id);
        } else if (action === "delete") {
          this.deleteCustomTheme(id);
        }
      });

      container.appendChild(item);
    });
  }

  // 选择预制主题
  selectPresetTheme(theme, targetElement = null, applyTheme = true) {
    // 清除其他选中状态
    document.querySelectorAll(".preset-theme-card.active").forEach((card) => {
      card.classList.remove("active");
    });
    document.querySelectorAll(".custom-theme-item.active").forEach((item) => {
      item.classList.remove("active");
    });

    // 设置当前选中
    if (targetElement) {
      const card = targetElement.closest(".preset-theme-card");
      if (card) card.classList.add("active");
    } else if (typeof event !== "undefined" && event.target) {
      event.target.closest(".preset-theme-card").classList.add("active");
    } else {
      // 通过主题ID查找对应的卡片
      const card = document.querySelector(`[data-theme-id="${theme.id}"]`);
      if (card) card.classList.add("active");
    }

    // 如果是"无主题"，清空当前主题
    if (theme.id === "none") {
      this.appState.setCurrentTheme(null);
      this.hideThemeEditor();
    } else {
      // 创建主题副本用于编辑
      const editableTheme = Utils.deepClone(theme);
      editableTheme.id = Utils.generateId();
      editableTheme.isCustom = true;

      this.appState.setCurrentTheme(editableTheme);
      if (applyTheme) {
        this.showThemeEditor(editableTheme);
        // 自动应用选中的主题
        this.applyCurrentTheme();
      }
    }
  }

  // 选择自定义主题
  selectCustomTheme(theme, targetElement = null, applyTheme = true) {
    // 清除其他选中状态
    document.querySelectorAll(".preset-theme-card.active").forEach((card) => {
      card.classList.remove("active");
    });
    document.querySelectorAll(".custom-theme-item.active").forEach((item) => {
      item.classList.remove("active");
    });

    // 设置当前选中
    if (targetElement) {
      const item = targetElement.closest(".custom-theme-item");
      if (item) item.classList.add("active");
    } else if (typeof event !== "undefined" && event.target) {
      event.target.closest(".custom-theme-item").classList.add("active");
    } else {
      // 通过主题ID查找对应的项目
      const item = document.querySelector(`[data-theme-id="${theme.id}"]`);
      if (item) item.classList.add("active");
    }

    this.appState.setCurrentTheme(theme);
    if (applyTheme) {
      this.showThemeEditor(theme);
      // 自动应用选中的主题
      this.applyCurrentTheme();
    }
  }

  // 选择无主题
  selectNoneTheme(applyTheme = true) {
    // 清除其他选中状态
    document.querySelectorAll(".preset-theme-card.active").forEach((card) => {
      card.classList.remove("active");
    });
    document.querySelectorAll(".custom-theme-item.active").forEach((item) => {
      item.classList.remove("active");
    });

    // 设置无主题为选中
    document.querySelector('[data-theme-id="none"]').classList.add("active");

    if (applyTheme) {
      // 应用无主题（清除所有样式）
      chrome.runtime.sendMessage(
        {
          action: "pageBeautify",
          type: "RESET_STYLES",
          data: {},
        },
        (response) => {
          if (chrome.runtime.lastError) {
            Utils.showToast(
              "重置样式失败: " + chrome.runtime.lastError.message,
              "error"
            );
          } else {
            // 保存无主题状态
            this.appState.setAppliedTheme("none");
            Utils.showToast("已应用无主题", "success");
          }
        }
      );

      // 清空当前主题并隐藏编辑器
      this.appState.setCurrentTheme(null);
      this.hideThemeEditor();
    }
  }

  // 创建新主题
  createNewTheme() {
    const newTheme = {
      id: Utils.generateId(),
      name: "新主题",
      description: "",
      groups: [],
      isCustom: true,
    };

    this.appState.addCustomTheme(newTheme);
    this.appState.setCurrentTheme(newTheme);
    this.saveCustomThemes();
    this.renderCustomThemes();
    this.showThemeEditor(newTheme);
  }

  // 编辑自定义主题
  editCustomTheme(themeId) {
    const theme = this.appState.customThemes.find((t) => t.id === themeId);
    if (theme) {
      this.appState.setCurrentTheme(theme);
      this.showThemeEditor(theme);
    }
  }

  // 删除自定义主题
  deleteCustomTheme(themeId) {
    if (confirm("确定要删除这个主题吗？")) {
      this.appState.removeCustomTheme(themeId);
      this.saveCustomThemes();
      this.renderCustomThemes();

      // 如果删除的是当前主题，清空编辑器
      if (
        this.appState.currentTheme &&
        this.appState.currentTheme.id === themeId
      ) {
        this.appState.setCurrentTheme(null);
        this.hideThemeEditor();
      }
    }
  }

  // 显示主题编辑器
  showThemeEditor(theme) {
    document.getElementById("emptyState").style.display = "none";
    document.getElementById("themeInfoSection").style.display = "block";
    document.getElementById("groupsSection").style.display = "block";

    // 填充主题信息
    document.getElementById("themeName").value = theme.name;
    document.getElementById("themeDescription").value = theme.description || "";

    // 根据主题类型显示不同的按钮
    this.updateThemeActions(theme);

    // 渲染修改组
    this.renderGroups(theme);

    // 验证主题中所有选择器的有效性
    setTimeout(() => {
      this.validateThemeSelectors(theme);
    }, 100);
  }

  // 更新主题操作按钮
  updateThemeActions(theme) {
    const saveBtn = document.getElementById("saveThemeBtn");
    const saveAsBtn = document.getElementById("saveAsThemeBtn");

    if (
      theme.isCustom &&
      this.appState.customThemes.find((t) => t.id === theme.id)
    ) {
      // 已存在的自定义主题 - 显示保存按钮
      saveBtn.style.display = "inline-block";
      saveAsBtn.style.display = "none";
    } else {
      // 预制主题或新主题 - 显示另存为按钮
      saveBtn.style.display = "none";
      saveAsBtn.style.display = "inline-block";
    }
  }

  // 隐藏主题编辑器
  hideThemeEditor() {
    document.getElementById("emptyState").style.display = "flex";
    document.getElementById("themeInfoSection").style.display = "none";
    document.getElementById("groupsSection").style.display = "none";
  }

  // 渲染修改组
  renderGroups(theme) {
    const container = document.getElementById("groupsList");
    container.innerHTML = "";

    theme.groups.forEach((group) => {
      const groupCard = this.createGroupCard(group);
      container.appendChild(groupCard);
    });
  }

  // 创建修改组卡片
  createGroupCard(group) {
    const card = document.createElement("div");
    card.className = "group-card";
    card.innerHTML = `
      <div class="group-header" data-group-id="${group.id}">
        <div>
          <div class="group-title">${group.name}</div>
          <div class="group-description">${group.description}</div>
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

  // 渲染CSS规则
  renderCSSRules(rules, groupId) {
    return rules
      .map(
        (rule, index) => `
      <div class="css-rule-item" data-rule-selector="${
        rule.selector
      }" data-rule-index="${index}" data-group-id="${groupId}">
        <div class="css-rule-header">
          <div class="css-rule-selector">
            <span class="selector-text">${rule.selector}</span>
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
          ${Object.entries(rule.properties)
            .map(
              ([prop, value]) => `
            <div class="css-property">
              <span class="css-property-name">${prop}:</span>
              <span class="css-property-value">${value};</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
      )
      .join("");
  }

  // 附加组事件
  attachGroupEvents(card, group) {
    const header = card.querySelector(".group-header");
    const content = card.querySelector(".group-content");
    const toggle = card.querySelector(".group-toggle");

    // 切换展开/收起
    header.addEventListener("click", (e) => {
      if (!e.target.closest(".group-actions")) {
        const isExpanded = content.classList.contains("expanded");
        content.classList.toggle("expanded");
        header.classList.toggle("expanded", !isExpanded);
        toggle.textContent = content.classList.contains("expanded") ? "▲" : "▼";
      }
    });

    // 默认展开第一个组
    if (document.querySelectorAll(".group-card").length === 0) {
      content.classList.add("expanded");
      header.classList.add("expanded");
      toggle.textContent = "▲";
    }

    // 处理操作按钮
    card.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      const groupId = e.target.dataset.groupId;

      if (action === "add-rule") {
        window.modalManager.showAddRuleModal(groupId);
      } else if (action === "delete-group") {
        this.deleteGroup(groupId);
      }
    });

    // 处理规则编辑和删除按钮
    card.addEventListener("click", (e) => {
      if (e.target.closest(".edit-rule-btn")) {
        const btn = e.target.closest(".edit-rule-btn");
        const ruleIndex = parseInt(btn.dataset.ruleIndex);
        const groupId = btn.dataset.groupId;
        this.editRule(groupId, ruleIndex);
      } else if (e.target.closest(".delete-rule-btn")) {
        const btn = e.target.closest(".delete-rule-btn");
        const ruleIndex = parseInt(btn.dataset.ruleIndex);
        const groupId = btn.dataset.groupId;
        this.deleteRule(groupId, ruleIndex);
      }
    });

    // 为规则块添加悬浮事件
    this.attachRuleHoverEvents(card);
  }

  // 为规则块添加悬浮事件
  attachRuleHoverEvents(card) {
    const ruleItems = card.querySelectorAll(".css-rule-item");

    ruleItems.forEach((ruleItem) => {
      const selector = ruleItem.dataset.ruleSelector;
      const statusDot = ruleItem.querySelector(".selector-status");

      // 鼠标进入规则块
      ruleItem.addEventListener("mouseenter", () => {
        this.validateAndHighlightSelector(selector, statusDot);
      });

      // 鼠标离开规则块
      ruleItem.addEventListener("mouseleave", () => {
        this.removeElementHighlight();
      });
    });
  }

  // 验证选择器并高亮元素
  validateAndHighlightSelector(selector, statusDot) {
    // 向内容脚本发送消息验证选择器
    chrome.runtime.sendMessage(
      {
        action: "pageBeautify",
        type: "VALIDATE_SELECTOR",
        data: { selector },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          // 验证失败
          statusDot.setAttribute("data-status", "invalid");
          return;
        }

        if (response && response.success && response.elementCount > 0) {
          // 验证成功，高亮元素
          statusDot.setAttribute("data-status", "valid");
          this.highlightElements(selector);
        } else {
          // 选择器无效或没有匹配元素
          statusDot.setAttribute("data-status", "invalid");
        }
      }
    );
  }

  // 高亮页面元素
  highlightElements(selector) {
    chrome.runtime.sendMessage({
      action: "pageBeautify",
      type: "HIGHLIGHT_ELEMENTS",
      data: { selector },
    });
  }

  // 移除元素高亮
  removeElementHighlight() {
    chrome.runtime.sendMessage({
      action: "pageBeautify",
      type: "REMOVE_HIGHLIGHT",
    });
  }

  // 验证主题中所有选择器
  validateThemeSelectors(theme) {
    if (!theme || !theme.groups) return;

    theme.groups.forEach((group) => {
      group.rules.forEach((rule, ruleIndex) => {
        const ruleItem = document.querySelector(
          `[data-rule-selector="${rule.selector}"][data-rule-index="${ruleIndex}"]`
        );
        if (ruleItem) {
          const statusDot = ruleItem.querySelector(".selector-status");
          this.validateSelector(rule.selector, statusDot);
        }
      });
    });
  }

  // 验证单个选择器（不高亮）
  validateSelector(selector, statusDot) {
    chrome.runtime.sendMessage(
      {
        action: "pageBeautify",
        type: "VALIDATE_SELECTOR",
        data: { selector },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          statusDot.setAttribute("data-status", "invalid");
          return;
        }

        if (response && response.success && response.elementCount > 0) {
          statusDot.setAttribute("data-status", "valid");
        } else {
          statusDot.setAttribute("data-status", "invalid");
        }
      }
    );
  }

  // 保存当前主题
  saveCurrentTheme() {
    const theme = this.appState.currentTheme;
    if (!theme) return;

    // 更新主题信息
    theme.name = document.getElementById("themeName").value;
    theme.description = document.getElementById("themeDescription").value;

    if (theme.isCustom) {
      // 更新自定义主题列表
      const index = this.appState.customThemes.findIndex(
        (t) => t.id === theme.id
      );
      if (index >= 0) {
        this.appState.customThemes[index] = theme;
      } else {
        this.appState.customThemes.push(theme);
      }

      this.saveCustomThemes();
      this.renderCustomThemes();
      Utils.showToast("主题已保存", "success");
    }
  }

  // 导出主题
  exportTheme() {
    const theme = this.appState.currentTheme;
    if (!theme) {
      Utils.showToast("请先选择一个主题", "warning");
      return;
    }

    const exportData = {
      ...theme,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    Utils.exportJSON(exportData, `${theme.name}.json`);
    Utils.showToast("主题已导出", "success");
  }

  // 导入主题
  async importTheme(file) {
    if (!file) {
      // 如果没有传入文件，创建文件输入
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
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
        throw new Error("无效的主题文件格式");
      }

      // 生成新ID避免冲突
      data.id = Utils.generateId();
      data.isCustom = true;

      this.appState.addCustomTheme(data);
      this.saveCustomThemes();
      this.renderCustomThemes();

      Utils.showToast("主题导入成功", "success");
    } catch (error) {
      Utils.showToast("主题导入失败: " + error.message, "error");
    }
  }

  // 另存为新主题
  saveAsNewTheme() {
    const theme = this.appState.currentTheme;
    if (!theme) {
      Utils.showToast("请先选择一个主题", "warning");
      return;
    }

    // 创建主题副本
    const newTheme = Utils.deepClone(theme);
    newTheme.id = Utils.generateId();
    newTheme.name = theme.name + " - 副本";
    newTheme.isCustom = true;

    this.appState.addCustomTheme(newTheme);
    this.appState.setCurrentTheme(newTheme);
    this.saveCustomThemes();
    this.renderCustomThemes();
    this.showThemeEditor(newTheme);

    Utils.showToast("主题已另存为新主题", "success");
  }

  // 应用当前主题
  applyCurrentTheme() {
    const theme = this.appState.currentTheme;
    if (!theme) {
      Utils.showToast("请先选择一个主题", "warning");
      return;
    }

    // 通过background层发送消息到content script
    chrome.runtime.sendMessage(
      {
        action: "pageBeautify",
        type: "APPLY_THEME",
        data: theme,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          Utils.showToast(
            "应用主题失败: " + chrome.runtime.lastError.message,
            "error"
          );
        } else if (response && response.success) {
          // 保存应用的主题ID到本地存储
          this.appState.setAppliedTheme(theme.id);
          Utils.showToast("主题已应用", "success");
        } else {
          Utils.showToast("应用主题失败", "error");
        }
      }
    );
  }

  // 导出当前主题
  exportCurrentTheme() {
    this.exportTheme();
  }

  // 删除修改组
  deleteGroup(groupId) {
    const theme = this.appState.currentTheme;
    if (!theme) return;

    // 确认删除
    if (!confirm("确定要删除这个修改组吗？此操作不可撤销。")) {
      return;
    }

    // 从主题中移除组
    theme.groups = theme.groups.filter((group) => group.id !== groupId);

    // 重新渲染组列表
    this.renderGroups(theme);

    Utils.showToast("修改组已删除", "success");
  }

  // 编辑规则
  editRule(groupId, ruleIndex) {
    const theme = this.appState.currentTheme;
    if (!theme) return;

    const group = theme.groups.find((g) => g.id === groupId);
    if (!group || !group.rules[ruleIndex]) {
      Utils.showToast("无法找到要编辑的规则", "error");
      return;
    }

    const rule = group.rules[ruleIndex];

    // 设置编辑模式并填充数据
    window.modalManager.showEditRuleModal(groupId, ruleIndex, rule);
  }

  // 删除规则
  deleteRule(groupId, ruleIndex) {
    if (!confirm("确定要删除这个CSS规则吗？")) return;

    const theme = this.appState.currentTheme;
    if (!theme) return;

    const group = theme.groups.find((g) => g.id === groupId);
    if (!group || !group.rules[ruleIndex]) {
      Utils.showToast("无法找到要删除的规则", "error");
      return;
    }

    // 从组中移除规则
    group.rules.splice(ruleIndex, 1);

    // 重新渲染组
    this.renderGroups(theme);

    // 重新应用主题
    this.applyCurrentTheme();

    Utils.showToast("CSS规则已删除", "success");
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

    theme.groups.forEach((group) => {
      group.rules.forEach((rule) => {
        this.applyRule(rule, group.id);
      });
    });

    Utils.showToast("样式已应用", "success");
  }

  // 应用单个规则
  applyRule(rule, groupId) {
    const elements = document.querySelectorAll(rule.selector);

    elements.forEach((element) => {
      const styleId = `${groupId}-${rule.selector}`;

      // 保存原始样式
      if (!this.appliedStyles.has(element)) {
        this.appliedStyles.set(element, new Map());
      }

      const elementStyles = this.appliedStyles.get(element);

      Object.entries(rule.properties).forEach(([property, value]) => {
        // 保存原始值
        if (!elementStyles.has(property)) {
          elementStyles.set(property, element.style[property] || "");
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
    Utils.showToast("样式已重置", "info");
  }
}

// 模态框管理器
class ModalManager {
  constructor() {
    // 定义滚动阻止处理函数
    this.preventScrollHandler = (e) => {
      // 检查是否在任何打开的模态框内容区域
      const openModals = document.querySelectorAll('.modal[style*="flex"]');
      for (let openModal of openModals) {
        const modalContent = openModal.querySelector('.modal-content');
        if (modalContent && modalContent.contains(e.target)) {
          return; // 允许模态框内容区域滚动
        }
      }
      // 阻止所有其他区域的滚动
      e.preventDefault();
      e.stopPropagation();
    };
    // 定义键盘滚动阻止处理函数
    this.preventKeyScrollHandler = (e) => {
      if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
      }
    };
    this.openModalCount = 0; // 跟踪打开的模态框数量
    this.savedScrollPosition = 0; // 保存滚动位置
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
    const modal = document.getElementById("addGroupModal");
    const closeBtn = document.getElementById("closeAddGroupModal");
    const cancelBtn = document.getElementById("cancelAddGroup");
    const confirmBtn = document.getElementById("confirmAddGroup");

    closeBtn.addEventListener("click", () => this.hideModal("addGroupModal"));
    cancelBtn.addEventListener("click", () => this.hideModal("addGroupModal"));

    confirmBtn.addEventListener("click", () => {
      const name = document.getElementById("groupName").value;
      const description = document.getElementById("groupDescription").value;

      if (!name.trim()) {
        Utils.showToast("请输入组名称", "warning");
        return;
      }

      this.addGroup(name, description);
      this.hideModal("addGroupModal");
    });
  }

  // 设置添加规则模态框
  setupAddRuleModal() {
    const modal = document.getElementById("addRuleModal");
    const closeBtn = document.getElementById("closeAddRuleModal");
    const cancelBtn = document.getElementById("cancelAddRule");
    const confirmBtn = document.getElementById("confirmAddRule");
    const validateBtn = document.getElementById("validateSelector");
    const addPropertyBtn = document.getElementById("addPropertyBtn");

    closeBtn.addEventListener("click", () => this.hideModal("addRuleModal"));
    cancelBtn.addEventListener("click", () => this.hideModal("addRuleModal"));

    validateBtn.addEventListener("click", () => this.validateSelector());
    addPropertyBtn.addEventListener("click", () =>
      this.showModal("propertySelectModal")
    );

    // 选择器输入框变化时清除高亮和预览
    const selectorInput = document.getElementById("cssSelector");
    if (selectorInput) {
      selectorInput.addEventListener("input", () => {
        // 延迟清除高亮，避免频繁调用
        clearTimeout(this.clearHighlightTimer);
        this.clearHighlightTimer = setTimeout(() => {
          this.clearSelectorHighlight();
        }, 500);
        // 选择器改变时清除之前的预览效果
        this.clearAllPreview();
      });
    }

    confirmBtn.addEventListener("click", () => {
      this.addCSSRule();
    });
  }

  // 设置属性选择模态框
  setupPropertySelectModal() {
    const modal = document.getElementById("propertySelectModal");
    const closeBtn = document.getElementById("closePropertySelectModal");

    closeBtn.addEventListener("click", () =>
      this.hideModal("propertySelectModal")
    );

    this.renderPropertyCategories();
  }

  // 显示模态框
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    
    modal.style.display = "flex";
    this.openModalCount++; // 增加打开的模态框计数
    
    // 只在第一个模态框打开时锁定滚动
    if (this.openModalCount === 1) {
      // 保存当前滚动位置
      this.savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
      
      // 设置body的top位置来保持视觉位置
      document.body.style.top = `-${this.savedScrollPosition}px`;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }

    // 只在第一个模态框打开时添加全局事件监听器
    if (this.openModalCount === 1) {
      // 阻止鼠标滚轮
      document.addEventListener("wheel", this.preventScrollHandler, {
        passive: false,
      });
      // 阻止触摸滚动
      document.addEventListener("touchmove", this.preventScrollHandler, {
        passive: false,
      });
      // 阻止键盘滚动
      document.addEventListener("keydown", this.preventKeyScrollHandler, { passive: false });
    }
  }

  // 隐藏模态框
  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "none";
    this.clearModalInputs(modalId);
    this.openModalCount--; // 减少打开的模态框计数
    
    // 确保计数不会小于0
    if (this.openModalCount < 0) {
      this.openModalCount = 0;
    }
    
    // 只有当所有模态框都关闭时才恢复滚动
    if (this.openModalCount === 0) {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      
      // 恢复body样式和滚动位置
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // 恢复滚动位置
      window.scrollTo(0, this.savedScrollPosition);
      
      // 移除全局事件监听器
      if (this.preventScrollHandler) {
        document.removeEventListener("wheel", this.preventScrollHandler);
        document.removeEventListener("touchmove", this.preventScrollHandler);
        this.preventScrollHandler = null;
      }
      
      if (this.preventKeyScrollHandler) {
        document.removeEventListener("keydown", this.preventKeyScrollHandler);
        this.preventKeyScrollHandler = null;
      }
    }
  }

  // 清空模态框输入
  clearModalInputs(modalId) {
    const modal = document.getElementById(modalId);
    const inputs = modal.querySelectorAll("input, textarea");
    inputs.forEach((input) => {
      if (input.type === "color") {
        input.value = "#000000"; // 颜色输入框设置默认黑色
      } else {
        input.value = "";
      }
    });
  }

  // 渲染属性分类
  renderPropertyCategories() {
    const container = document.getElementById("propertyCategories");
    container.innerHTML = "";

    Object.entries(CSS_PROPERTIES).forEach(([categoryKey, category]) => {
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "property-category";
      categoryDiv.innerHTML = `
        <div class="property-category-header">${category.name}</div>
        <div class="property-category-list">
          ${Object.entries(category.properties)
            .map(
              ([propKey, prop]) => `
            <div class="property-item" data-property="${propKey}" data-category="${categoryKey}">
              ${prop.name} (${propKey})
            </div>
          `
            )
            .join("")}
        </div>
      `;

      // 添加属性选择事件
      categoryDiv.addEventListener("click", (e) => {
        if (e.target.classList.contains("property-item")) {
          const property = e.target.dataset.property;
          const category = e.target.dataset.category;
          this.addPropertyEditor(
            property,
            CSS_PROPERTIES[category].properties[property]
          );
          this.hideModal("propertySelectModal");
        }
      });

      container.appendChild(categoryDiv);
    });
  }

  // 添加属性编辑器
  addPropertyEditor(property, config) {
    const container = document.getElementById("cssProperties");
    const editor = document.createElement("div");
    editor.className = "css-property-item";

    let inputHtml = "";
    switch (config.type) {
      case "color":
        inputHtml = `<input type="color" class="form-input property-value" data-property="${property}">`;
        break;
      case "range":
        inputHtml = `<input type="range" class="form-input property-value" data-property="${property}" min="${config.min}" max="${config.max}" step="${config.step}">`;
        break;
      case "select":
        inputHtml = `<select class="form-input property-value" data-property="${property}">
          ${config.options
            .map((option) => `<option value="${option}">${option}</option>`)
            .join("")}
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
    editor.querySelector(".property-remove").addEventListener("click", () => {
      editor.remove();
      // 删除属性时也要清除预览效果
      this.clearPreviewForProperty(property);
    });

    // 添加实时预览事件
    const propertyInput = editor.querySelector(".property-value");
    propertyInput.addEventListener("input", (e) => {
      this.previewStyle(property, e.target.value);
    });

    // 对于select类型，也要监听change事件
    if (config.type === "select") {
      propertyInput.addEventListener("change", (e) => {
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
    const selector = document.getElementById("cssSelector").value;

    if (!selector || !property || !value) {
      return;
    }

    try {
      // 通过background层路由转发消息到content script进行实时预览
      await chrome.runtime.sendMessage({
        action: "pageBeautify",
        type: "PREVIEW_STYLE",
        data: {
          selector: selector,
          property: property,
          value: value,
        },
      });
    } catch (error) {
      console.warn("实时预览失败:", error);
    }
  }

  /**
   * 清除特定属性的预览效果
   * @param {string} property - CSS属性名
   */
  async clearPreviewForProperty(property) {
    const selector = document.getElementById("cssSelector").value;

    if (!selector || !property) {
      return;
    }

    try {
      await chrome.runtime.sendMessage({
        action: "pageBeautify",
        type: "CLEAR_PREVIEW_PROPERTY",
        data: {
          selector: selector,
          property: property,
        },
      });
    } catch (error) {
      console.warn("清除预览失败:", error);
    }
  }

  /**
   * 清除所有预览效果
   */
  async clearAllPreview() {
    try {
      await chrome.runtime.sendMessage({
        action: "pageBeautify",
        type: "CLEAR_ALL_PREVIEW",
      });
    } catch (error) {
      console.warn("清除所有预览失败:", error);
    }
  }

  // 验证选择器
  async validateSelector() {
    const selector = document.getElementById("cssSelector").value;
    const indicator = document.getElementById("selectorStatusIndicator");
    const suggestions = document.getElementById("selectorSuggestions");

    if (!selector.trim()) {
      indicator.className = "selector-status-indicator";
      suggestions.textContent = "";
      suggestions.style.display = "none";
      // 清除高亮
      this.clearSelectorHighlight();
      return;
    }

    console.log("开始验证选择器:", selector);

    try {
      // 通过background层路由转发消息到content script
      const response = await chrome.runtime.sendMessage({
        action: "pageBeautify",
        type: "VALIDATE_SELECTOR",
        data: { selector: selector },
      });

      console.log("验证选择器结果:", response);

      if (response && response.success) {
        if (response.isValid) {
          indicator.className = "selector-status-indicator valid";
          suggestions.textContent = `找到 ${response.elementCount} 个匹配元素`;
          suggestions.className = "selector-suggestions success";
          suggestions.style.display = "block";
        } else {
          indicator.className = "selector-status-indicator invalid";
          suggestions.textContent =
            response.elementCount === 0 ? "未找到匹配元素" : "选择器语法错误";
          suggestions.className = "selector-suggestions error";
          suggestions.style.display = "block";
        }
      } else {
        indicator.className = "selector-status-indicator invalid";
        suggestions.textContent = "无法连接到页面，请确保页面已加载";
        suggestions.className = "selector-suggestions error";
        suggestions.style.display = "block";
      }
    } catch (error) {
      console.error("验证选择器时发生错误:", error);
      indicator.className = "selector-status-indicator invalid";
      suggestions.textContent = "验证失败，请确保页面已加载并刷新后重试";
      suggestions.className = "selector-suggestions error";
      suggestions.style.display = "block";
    }
  }

  /**
   * 清除选择器高亮效果
   */
  async clearSelectorHighlight() {
    try {
      await chrome.runtime.sendMessage({
        action: "pageBeautify",
        type: "CLEAR_SELECTOR_HIGHLIGHT",
        data: {},
      });
    } catch (error) {
      console.log("清除高亮失败:", error);
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
      rules: [],
    };

    theme.groups.push(newGroup);
    window.themeManager.renderGroups(theme);

    // 清空输入
    document.getElementById("groupName").value = "";
    document.getElementById("groupDescription").value = "";
  }

  // 添加或更新CSS规则
  addCSSRule() {
    const selector = document.getElementById("cssSelector").value;
    const properties = {};

    // 收集属性
    document.querySelectorAll(".css-property-item").forEach((editor) => {
      const propertyName = editor.querySelector("input[readonly]").value;
      const propertyValue = editor.querySelector(".property-value").value;

      if (propertyName && propertyValue) {
        properties[propertyName] = propertyValue;
      }
    });

    if (!selector.trim()) {
      Utils.showToast("请输入CSS选择器", "error");
      return;
    }

    if (Object.keys(properties).length === 0) {
      Utils.showToast("请至少添加一个CSS属性", "error");
      return;
    }

    const groupId = this.currentGroupId;
    const theme = window.appState.currentTheme;
    const group = theme.groups.find((g) => g.id === groupId);

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

    // 清除该选择器的预览效果（因为规则已保存）
    this.clearAllPreview();

    // 重新应用当前主题以显示已保存的样式
    setTimeout(() => {
      window.themeManager.applyCurrentTheme();
    }, 100);

    window.themeManager.renderGroups(theme);
    this.hideModal("addRuleModal");
  }

  // 显示添加规则模态框
  showAddRuleModal(groupId) {
    this.currentGroupId = groupId;
    this.currentRuleIndex = null; // 清除编辑模式
    // 重置模态框状态
    this.resetAddRuleModalState();
    this.showModal("addRuleModal");
  }

  // 显示编辑规则模态框
  showEditRuleModal(groupId, ruleIndex, rule) {
    this.currentGroupId = groupId;
    this.currentRuleIndex = ruleIndex;

    // 重置模态框状态
    this.resetAddRuleModalState();

    // 填充现有数据
    const selectorInput = document.getElementById("cssSelector");
    const propertiesContainer = document.getElementById("cssProperties");
    const modalTitle = document.querySelector("#addRuleModal .modal-title");
    const confirmBtn = document.getElementById("confirmAddRule");

    if (modalTitle) {
      modalTitle.textContent = "编辑CSS规则";
    }

    if (confirmBtn) {
      confirmBtn.textContent = "保存修改";
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
          this.addPropertyEditor(prop, { type: "text", name: prop });
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

    this.showModal("addRuleModal");
  }

  // 重置添加规则模态框状态
  resetAddRuleModalState() {
    // 清空输入框
    const selectorInput = document.getElementById("cssSelector");
    const propertiesContainer = document.getElementById("cssProperties");
    const indicator = document.getElementById("selectorStatusIndicator");
    const suggestions = document.getElementById("selectorSuggestions");
    const modalTitle = document.querySelector("#addRuleModal .modal-title");
    const confirmBtn = document.getElementById("confirmAddRule");

    if (selectorInput) {
      selectorInput.value = "";
    }

    if (propertiesContainer) {
      propertiesContainer.innerHTML = "";
    }

    // 重置模态框标题和按钮文本
    if (modalTitle) {
      modalTitle.textContent = "添加CSS规则";
    }

    if (confirmBtn) {
      confirmBtn.textContent = "添加规则";
    }

    // 重置选择器状态指示器
    if (indicator) {
      indicator.className = "selector-status-indicator";
    }

    // 重置建议文本
    if (suggestions) {
      suggestions.textContent = "";
      suggestions.className = "selector-suggestions";
      suggestions.style.display = "none";
    }
  }
}

/**
 * 应用程序入口
 * @class PageBeautifyApp
 * @constructor 无参数
 * @returns {PageBeautifyApp} 应用实例
 * @example
 * const app = new PageBeautifyApp();
 */
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
    this.detectEnvironment();
    this.bindEvents();
    this.setupGlobalReferences();

    // 监听状态变化
    document.addEventListener("themeChanged", (e) => {
      this.onThemeChanged(e.detail);
    });
  }

  /**
   * 检测运行环境并应用相应的样式适配
   * 自动判断是否在Chrome扩展侧栏等窄屏环境中
   */
  detectEnvironment() {
    const isNarrowScreen = window.innerWidth <= 600;
    const isExtensionEnvironment = window.chrome && window.chrome.runtime;
    const isVeryNarrow = window.innerWidth <= 400;

    // 如果是Chrome扩展环境且屏幕很窄，或者屏幕极窄，启用扩展模式
    if ((isExtensionEnvironment && isNarrowScreen) || isVeryNarrow) {
      document.body.classList.add("chrome-extension-mode");
      console.log("检测到窄屏环境，已启用Chrome扩展适配模式");
    }

    // 监听窗口大小变化，动态调整
    window.addEventListener("resize", () => {
      const currentWidth = window.innerWidth;
      const shouldUseExtensionMode =
        (isExtensionEnvironment && currentWidth <= 600) || currentWidth <= 400;

      if (
        shouldUseExtensionMode &&
        !document.body.classList.contains("chrome-extension-mode")
      ) {
        document.body.classList.add("chrome-extension-mode");
        console.log("窗口变窄，启用Chrome扩展适配模式");
      } else if (
        !shouldUseExtensionMode &&
        document.body.classList.contains("chrome-extension-mode")
      ) {
        document.body.classList.remove("chrome-extension-mode");
        console.log("窗口变宽，关闭Chrome扩展适配模式");
      }
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
    document.getElementById("fileInput").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.themeManager.importTheme(file);
        e.target.value = ""; // 清空文件输入
      }
    });

    // 新建主题按钮
    document.getElementById("newThemeBtn").addEventListener("click", () => {
      this.themeManager.createNewTheme();
    });

    document
      .getElementById("createFirstTheme")
      .addEventListener("click", () => {
        this.themeManager.createNewTheme();
      });

    // 保存主题按钮
    document.getElementById("saveThemeBtn").addEventListener("click", () => {
      this.themeManager.saveCurrentTheme();
    });

    // 另存为按钮
    document.getElementById("saveAsThemeBtn").addEventListener("click", () => {
      this.themeManager.saveAsNewTheme();
    });

    // 重置预览按钮 - 清除所有实时预览效果并重新应用当前编辑的主题
    document.getElementById("resetPreviewBtn").addEventListener("click", () => {
      this.modalManager.clearAllPreview();
      // 重新应用当前编辑的主题（而不是存储的主题）
      setTimeout(() => {
        const currentTheme = this.appState.currentTheme;
        if (currentTheme) {
          // 直接应用当前编辑的主题，确保页面显示与编辑器一致
          chrome.runtime.sendMessage(
            {
              action: "pageBeautify",
              type: "APPLY_THEME",
              data: currentTheme,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                Utils.showToast(
                  "重置预览失败: " + chrome.runtime.lastError.message,
                  "error"
                );
              } else if (response && response.success) {
                Utils.showToast("预览已重置，当前编辑主题已应用", "success");
              } else {
                Utils.showToast("重置预览失败", "error");
              }
            }
          );
        } else {
          Utils.showToast("没有当前编辑的主题", "warning");
        }
      }, 100);
    });

    // 导出主题按钮
    document.getElementById("exportThemeBtn").addEventListener("click", () => {
      this.themeManager.exportCurrentTheme();
    });

    // 导入主题按钮
    document.getElementById("importThemeBtn").addEventListener("click", () => {
      this.themeManager.importTheme();
    });

    // 添加组按钮
    document.getElementById("addGroupBtn").addEventListener("click", () => {
      this.modalManager.showModal("addGroupModal");
    });

    // 模态框背景点击关闭
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.modalManager.hideModal(modal.id);
          // 关闭模态框时清除预览效果并重新应用当前编辑的主题
          if (modal.id === "addRuleModal") {
            this.modalManager.clearAllPreview();
            // 重新应用当前编辑的主题（而不是存储的主题）
            setTimeout(() => {
              const currentTheme = this.appState.currentTheme;
              if (currentTheme) {
                chrome.runtime.sendMessage({
                  action: "pageBeautify",
                  type: "APPLY_THEME",
                  data: currentTheme,
                });
              }
            }, 100);
          }
        }
      });
    });
  }

  // 主题变化处理
  onThemeChanged(theme) {
    // 可以在这里添加主题变化时的额外逻辑
    console.log("Theme changed:", theme);
  }
}

// 应用启动
document.addEventListener("DOMContentLoaded", () => {
  new PageBeautifyApp();
});
