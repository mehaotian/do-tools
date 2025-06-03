/**
 * CSS属性库 - 用于自由CSS属性输入的自动补全
 * 包含常用高频CSS属性及其可能的值
 */

/**
 * 常用CSS属性列表 - 按使用频率排序
 */
export const COMMON_CSS_PROPERTIES = [
  /*布局相关 - 最高频*/ 
  "display",
  "position",
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  "z-index",

  // 内边距
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  // 外边距
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",

  // Flexbox - 高频
  "flex",
  "flex-direction",
  "justify-content",
  "align-items",
  "flex-wrap",
  "align-content",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "align-self",
  "gap",
  "row-gap",
  "column-gap",
  "order",

  // Grid - 中高频
  "grid",
  "grid-template-columns",
  "grid-template-rows",
  "grid-area",
  "grid-column",
  "grid-row",
  "grid-gap",
  "grid-auto-flow",
  // 边框
  "border",
  "border-width",
  "border-style",
  "border-color",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-radius",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",

  // 外观样式 - 高频
  "background",
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
  "box-shadow",
  "opacity",
  "color",

  // 文字相关 - 高频
  "font-size",
  "font-weight",
  "font-family",
  "line-height",
  "text-align",
  "text-decoration",
  "text-transform",
  "letter-spacing",
  "word-spacing",

  // 变换和动画 - 中频
  "transform",
  "transition",
  "animation",
  "transform-origin",
  "transition-duration",
  "transition-property",
  "transition-timing-function",

  // 其他常用 - 中频
  "overflow",
  "overflow-x",
  "overflow-y",
  "visibility",
  "cursor",
  "pointer-events",
  "user-select",
  "box-sizing",
  "outline",

  // 伪类和特殊属性 - 低频但重要
  "content",
  "float",
  "clear",
  "vertical-align",
  "white-space",
  "text-overflow",
  "word-break",
  "word-wrap",
];

/**
 * CSS属性值映射 - 常用属性的预设值
 */
export const CSS_PROPERTY_VALUES = {
  // 显示相关
  display: [
    "block",
    "inline",
    "inline-block",
    "flex",
    "inline-flex",
    "grid",
    "inline-grid",
    "none",
    "table",
    "table-cell",
  ],
  position: ["static", "relative", "absolute", "fixed", "sticky"],
  visibility: ["visible", "hidden", "collapse"],
  overflow: ["visible", "hidden", "scroll", "auto"],
  "overflow-x": ["visible", "hidden", "scroll", "auto"],
  "overflow-y": ["visible", "hidden", "scroll", "auto"],

  // Flexbox
  "flex-direction": ["row", "row-reverse", "column", "column-reverse"],
  "flex-wrap": ["nowrap", "wrap", "wrap-reverse"],
  "justify-content": [
    "flex-start",
    "flex-end",
    "center",
    "space-between",
    "space-around",
    "space-evenly",
  ],
  "align-items": ["stretch", "flex-start", "flex-end", "center", "baseline"],
  "align-content": [
    "stretch",
    "flex-start",
    "flex-end",
    "center",
    "space-between",
    "space-around",
    "space-evenly",
  ],
  "align-self": [
    "auto",
    "stretch",
    "flex-start",
    "flex-end",
    "center",
    "baseline",
  ],

  // Grid
  "grid-auto-flow": ["row", "column", "row dense", "column dense"],

  // 背景
  "background-size": ["auto", "cover", "contain", "100%", "100% 100%"],
  "background-repeat": [
    "repeat",
    "no-repeat",
    "repeat-x",
    "repeat-y",
    "space",
    "round",
  ],
  "background-position": [
    "center",
    "top",
    "bottom",
    "left",
    "right",
    "top left",
    "top right",
    "bottom left",
    "bottom right",
  ],
  "background-attachment": ["scroll", "fixed", "local"],

  // 边框
  "border-style": [
    "none",
    "solid",
    "dashed",
    "dotted",
    "double",
    "groove",
    "ridge",
    "inset",
    "outset",
  ],

  // 文字
  "font-weight": [
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
  "text-align": ["left", "center", "right", "justify"],
  "text-decoration": ["none", "underline", "overline", "line-through"],
  "text-transform": ["none", "uppercase", "lowercase", "capitalize"],
  "white-space": ["normal", "nowrap", "pre", "pre-wrap", "pre-line"],
  "word-break": ["normal", "break-all", "keep-all", "break-word"],
  "text-overflow": ["clip", "ellipsis"],

  // 其他
  cursor: [
    "auto",
    "pointer",
    "default",
    "text",
    "move",
    "not-allowed",
    "grab",
    "grabbing",
  ],
  "user-select": ["auto", "none", "text", "all"],
  "pointer-events": ["auto", "none"],
  "box-sizing": ["content-box", "border-box"],
  float: ["none", "left", "right"],
  clear: ["none", "left", "right", "both"],
  "vertical-align": [
    "baseline",
    "top",
    "middle",
    "bottom",
    "text-top",
    "text-bottom",
  ],
};

/**
 * 获取CSS属性建议列表
 * @param {string} input - 用户输入的属性名前缀
 * @param {number} limit - 返回结果数量限制
 * @returns {Array} 匹配的属性列表
 */
export function getPropertySuggestions(input, limit = 10) {
  if (!input || input.length < 1) {
    return COMMON_CSS_PROPERTIES.slice(0, limit);
  }

  const lowerInput = input.toLowerCase();
  const suggestions = [];
  const seen = new Set();

  // 1. 完全前缀匹配优先（如 "bor" 匹配 "border"）
  const exactMatches = COMMON_CSS_PROPERTIES.filter((prop) => {
    const lowerProp = prop.toLowerCase();
    return lowerProp.startsWith(lowerInput);
  });
  exactMatches.forEach(prop => {
    if (!seen.has(prop)) {
      suggestions.push(prop);
      seen.add(prop);
    }
  });

  // 2. 单词边界匹配（如 "bor" 匹配 "border-top", "border-width" 等）
  if (suggestions.length < limit) {
    const wordBoundaryMatches = COMMON_CSS_PROPERTIES.filter((prop) => {
      const lowerProp = prop.toLowerCase();
      // 检查是否在单词边界开始匹配
      const parts = lowerProp.split('-');
      return parts.some(part => part.startsWith(lowerInput)) && !lowerProp.startsWith(lowerInput);
    });
    wordBoundaryMatches.forEach(prop => {
      if (!seen.has(prop) && suggestions.length < limit) {
        suggestions.push(prop);
        seen.add(prop);
      }
    });
  }

  // 3. 包含匹配（如 "bor" 匹配包含 "bor" 的其他属性）
  if (suggestions.length < limit) {
    const containsMatches = COMMON_CSS_PROPERTIES.filter((prop) => {
      const lowerProp = prop.toLowerCase();
      return lowerProp.includes(lowerInput) && !seen.has(prop);
    });
    containsMatches.forEach(prop => {
      if (suggestions.length < limit) {
        suggestions.push(prop);
        seen.add(prop);
      }
    });
  }

  return suggestions.slice(0, limit);
}

/**
 * 获取属性值建议列表
 * @param {string} property - CSS属性名
 * @param {string} input - 用户输入的值
 * @param {number} limit - 返回结果数量限制
 * @returns {Array} 匹配的属性值列表
 */
export function getValueSuggestions(property, input = "", limit = 8) {
  const values = CSS_PROPERTY_VALUES[property];
  if (!values) {
    return [];
  }

  if (!input || input.length < 1) {
    return values.slice(0, limit);
  }

  const lowerInput = input.toLowerCase();
  const suggestions = [];

  // 精确匹配优先
  const exactMatches = values.filter((value) =>
    value.toLowerCase().startsWith(lowerInput)
  );
  suggestions.push(...exactMatches);

  // 包含匹配
  if (suggestions.length < limit) {
    const containsMatches = values.filter(
      (value) =>
        value.toLowerCase().includes(lowerInput) &&
        !value.toLowerCase().startsWith(lowerInput)
    );
    suggestions.push(...containsMatches);
  }

  return suggestions.slice(0, limit);
}

/**
 * 检查是否为有效的CSS属性
 * @param {string} property - 属性名
 * @returns {boolean} 是否为有效属性
 */
export function isValidCSSProperty(property) {
  return (
    COMMON_CSS_PROPERTIES.includes(property) ||
    property.startsWith("-webkit-") ||
    property.startsWith("-moz-") ||
    property.startsWith("-ms-") ||
    property.startsWith("--")
  ); // CSS变量
}
