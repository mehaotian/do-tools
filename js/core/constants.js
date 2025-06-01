/**
 * 页面美化功能的常量定义
 * 包含CSS属性配置、预设主题等核心数据
 */

/**
 * CSS属性配置 - 定义可编辑的CSS属性及其类型
 */
export const CSS_PROPERTIES = {
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

/**
 * CSS属性分组配置 - 用于属性编辑器的分类显示
 */
export const CSS_PROPERTY_GROUPS = {
  layout: {
    name: "布局",
    properties: {
      display: { name: "显示方式", type: "select", options: ["block", "inline", "inline-block", "flex", "grid", "none"] },
      position: { name: "定位方式", type: "select", options: ["static", "relative", "absolute", "fixed", "sticky"] },
      width: { name: "宽度", type: "text" },
      height: { name: "高度", type: "text" },
      margin: { name: "外边距", type: "text" },
      padding: { name: "内边距", type: "text" },
      top: { name: "顶部距离", type: "text" },
      left: { name: "左侧距离", type: "text" },
      right: { name: "右侧距离", type: "text" },
      bottom: { name: "底部距离", type: "text" },
      "z-index": { name: "层级", type: "text" }
    }
  },
  appearance: {
    name: "外观",
    properties: {
      "background-color": { name: "背景颜色", type: "color" },
      "background-image": { name: "背景图片", type: "text" },
      "background-size": { name: "背景尺寸", type: "select", options: ["auto", "cover", "contain", "100%", "100% 100%"] },
      "background-repeat": { name: "背景重复", type: "select", options: ["repeat", "no-repeat", "repeat-x", "repeat-y"] },
      "background-position": { name: "背景位置", type: "select", options: ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"] },
      color: { name: "文字颜色", type: "color" },
      border: { name: "边框", type: "text" },
      "border-radius": { name: "圆角", type: "text" },
      "box-shadow": { name: "阴影", type: "text" },
      opacity: { name: "透明度", type: "range", min: 0, max: 1, step: 0.1 }
    }
  },
  typography: {
    name: "文字",
    properties: {
      "font-size": { name: "字体大小", type: "text" },
      "font-weight": { name: "字体粗细", type: "select", options: ["normal", "bold", "lighter", "bolder", "100", "200", "300", "400", "500", "600", "700", "800", "900"] },
      "font-family": { name: "字体", type: "text" },
      "line-height": { name: "行高", type: "text" },
      "text-align": { name: "文字对齐", type: "select", options: ["left", "center", "right", "justify"] },
      "text-decoration": { name: "文字装饰", type: "select", options: ["none", "underline", "overline", "line-through"] },
      "text-transform": { name: "文字转换", type: "select", options: ["none", "uppercase", "lowercase", "capitalize"] },
      "letter-spacing": { name: "字母间距", type: "text" },
      "word-spacing": { name: "单词间距", type: "text" }
    }
  },
  effects: {
    name: "效果",
    properties: {
      transform: { name: "变换", type: "text" },
      transition: { name: "过渡", type: "text" },
      animation: { name: "动画", type: "text" },
      filter: { name: "滤镜", type: "text" },
      "backdrop-filter": { name: "背景滤镜", type: "text" }
    }
  }
};

/**
 * 预设主题配置
 */
export const PRESET_THEMES = [
  {
    id: "none",
    name: "无主题",
    description: "清除所有样式修改",
    groups: []
  },
  {
    id: "modern-light",
    name: "现代浅色",
    description: "简洁现代的浅色主题",
    groups: [
      {
        id: "body-style",
        name: "页面基础",
        description: "页面整体样式",
        rules: [
          {
            selector: "body",
            properties: {
              "background-color": "#f8fafc",
              "font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              "line-height": "1.6",
              color: "#334155"
            }
          }
        ]
      }
    ]
  },
  {
    id: "modern-dark",
    name: "现代深色",
    description: "优雅的深色主题",
    groups: [
      {
        id: "body-style",
        name: "页面基础",
        description: "页面整体样式",
        rules: [
          {
            selector: "body",
            properties: {
              "background-color": "#0f172a",
              "font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              "line-height": "1.6",
              color: "#e2e8f0"
            }
          }
        ]
      }
    ]
  }
];

/**
 * 应用配置常量
 */
export const APP_CONFIG = {
  // 存储键名
  STORAGE_KEYS: {
    CUSTOM_THEMES: 'customThemes',
    APPLIED_THEME_ID: 'appliedThemeId'
  },
  
  // UI配置
  UI: {
    TOAST_DURATION: 3000,
    MODAL_ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300
  },
  
  // 验证规则
  VALIDATION: {
    MAX_THEME_NAME_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 200,
    MAX_SELECTOR_LENGTH: 500
  },
  
  // 重试配置
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  }
};