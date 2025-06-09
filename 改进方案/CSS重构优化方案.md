# CSS重构优化方案

## 当前状况分析

通过对LinuxDO-UI项目的CSS文件分析，发现以下问题：

1. **重复的样式规则**：多个CSS文件中存在相似或重复的样式定义
2. **缺乏统一的命名规范**：不同文件使用不同的命名风格（BEM、驼峰、连字符等）
3. **未使用CSS预处理器**：没有利用Sass/Less等预处理器的变量和混合功能
4. **媒体查询重复**：响应式样式中存在重复的媒体查询
5. **缺乏模块化结构**：CSS组织不够模块化，难以维护

## 改进方案

### 1. 创建CSS变量系统

**问题**：颜色、字体、间距等值在多个文件中重复定义。

**解决方案**：创建CSS变量（自定义属性）系统。

```css
/* css/variables.css */
:root {
  /* 颜色系统 */
  --color-primary: #4285f4;
  --color-primary-light: #5e97f6;
  --color-primary-dark: #3367d6;
  
  --color-secondary: #34a853;
  --color-secondary-light: #46b865;
  --color-secondary-dark: #2d9249;
  
  --color-accent: #fbbc05;
  --color-accent-light: #fcc934;
  --color-accent-dark: #f9a825;
  
  --color-error: #ea4335;
  --color-warning: #fbbc05;
  --color-success: #34a853;
  --color-info: #4285f4;
  
  --color-text-primary: rgba(0, 0, 0, 0.87);
  --color-text-secondary: rgba(0, 0, 0, 0.6);
  --color-text-disabled: rgba(0, 0, 0, 0.38);
  
  --color-background-light: #ffffff;
  --color-background-grey: #f5f5f5;
  --color-background-dark: #212121;
  
  --color-border-light: rgba(0, 0, 0, 0.12);
  --color-border-medium: rgba(0, 0, 0, 0.24);
  
  /* 字体系统 */
  --font-family-base: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
  --font-family-monospace: 'Roboto Mono', Consolas, Monaco, 'Andale Mono', monospace;
  
  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-md: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */
  --font-size-xxl: 1.5rem;   /* 24px */
  
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  
  /* 间距系统 */
  --spacing-xxs: 0.25rem;  /* 4px */
  --spacing-xs: 0.5rem;    /* 8px */
  --spacing-sm: 0.75rem;   /* 12px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-xxl: 3rem;     /* 48px */
  
  /* 边框系统 */
  --border-radius-sm: 0.125rem;  /* 2px */
  --border-radius-md: 0.25rem;   /* 4px */
  --border-radius-lg: 0.5rem;    /* 8px */
  --border-radius-pill: 9999px;
  
  /* 阴影系统 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* 过渡系统 */
  --transition-fast: 150ms;
  --transition-normal: 250ms;
  --transition-slow: 350ms;
  --transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Z-index系统 */
  --z-index-dropdown: 1000;
  --z-index-sticky: 1020;
  --z-index-fixed: 1030;
  --z-index-modal-backdrop: 1040;
  --z-index-modal: 1050;
  --z-index-popover: 1060;
  --z-index-tooltip: 1070;
}

/* 暗色主题变量 */
[data-theme="dark"] {
  --color-text-primary: rgba(255, 255, 255, 0.87);
  --color-text-secondary: rgba(255, 255, 255, 0.6);
  --color-text-disabled: rgba(255, 255, 255, 0.38);
  
  --color-background-light: #212121;
  --color-background-grey: #303030;
  --color-background-dark: #121212;
  
  --color-border-light: rgba(255, 255, 255, 0.12);
  --color-border-medium: rgba(255, 255, 255, 0.24);
}
```

### 2. 创建CSS工具类库

**问题**：常见样式模式在多个地方重复实现。

**解决方案**：创建工具类库，提供可复用的样式类。

```css
/* css/utilities.css */
/* 布局工具类 */
.d-flex { display: flex; }
.d-inline-flex { display: inline-flex; }
.d-block { display: block; }
.d-inline-block { display: inline-block; }
.d-none { display: none; }

.flex-row { flex-direction: row; }
.flex-column { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }

.justify-start { justify-content: flex-start; }
.justify-end { justify-content: flex-end; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }

.items-start { align-items: flex-start; }
.items-end { align-items: flex-end; }
.items-center { align-items: center; }
.items-baseline { align-items: baseline; }
.items-stretch { align-items: stretch; }

.self-start { align-self: flex-start; }
.self-end { align-self: flex-end; }
.self-center { align-self: center; }
.self-baseline { align-self: baseline; }
.self-stretch { align-self: stretch; }

.flex-1 { flex: 1; }
.flex-auto { flex: auto; }
.flex-none { flex: none; }

/* 间距工具类 */
.m-0 { margin: 0; }
.m-xxs { margin: var(--spacing-xxs); }
.m-xs { margin: var(--spacing-xs); }
.m-sm { margin: var(--spacing-sm); }
.m-md { margin: var(--spacing-md); }
.m-lg { margin: var(--spacing-lg); }
.m-xl { margin: var(--spacing-xl); }
.m-xxl { margin: var(--spacing-xxl); }

.mx-0 { margin-left: 0; margin-right: 0; }
.mx-xxs { margin-left: var(--spacing-xxs); margin-right: var(--spacing-xxs); }
.mx-xs { margin-left: var(--spacing-xs); margin-right: var(--spacing-xs); }
.mx-sm { margin-left: var(--spacing-sm); margin-right: var(--spacing-sm); }
.mx-md { margin-left: var(--spacing-md); margin-right: var(--spacing-md); }
.mx-lg { margin-left: var(--spacing-lg); margin-right: var(--spacing-lg); }
.mx-xl { margin-left: var(--spacing-xl); margin-right: var(--spacing-xl); }
.mx-xxl { margin-left: var(--spacing-xxl); margin-right: var(--spacing-xxl); }

.my-0 { margin-top: 0; margin-bottom: 0; }
.my-xxs { margin-top: var(--spacing-xxs); margin-bottom: var(--spacing-xxs); }
.my-xs { margin-top: var(--spacing-xs); margin-bottom: var(--spacing-xs); }
.my-sm { margin-top: var(--spacing-sm); margin-bottom: var(--spacing-sm); }
.my-md { margin-top: var(--spacing-md); margin-bottom: var(--spacing-md); }
.my-lg { margin-top: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
.my-xl { margin-top: var(--spacing-xl); margin-bottom: var(--spacing-xl); }
.my-xxl { margin-top: var(--spacing-xxl); margin-bottom: var(--spacing-xxl); }

/* 类似地添加mt, mr, mb, ml (上右下左) */
/* 类似地添加p, px, py, pt, pr, pb, pl (内边距) */

/* 文本工具类 */
.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-md { font-size: var(--font-size-md); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-xxl { font-size: var(--font-size-xxl); }

.font-light { font-weight: var(--font-weight-light); }
.font-regular { font-weight: var(--font-weight-regular); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-bold { font-weight: var(--font-weight-bold); }

.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }

.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-disabled { color: var(--color-text-disabled); }

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-break {
  overflow-wrap: break-word;
  word-break: break-word;
}

/* 背景工具类 */
.bg-light { background-color: var(--color-background-light); }
.bg-grey { background-color: var(--color-background-grey); }
.bg-dark { background-color: var(--color-background-dark); }
.bg-primary { background-color: var(--color-primary); }
.bg-secondary { background-color: var(--color-secondary); }
.bg-accent { background-color: var(--color-accent); }
.bg-error { background-color: var(--color-error); }
.bg-warning { background-color: var(--color-warning); }
.bg-success { background-color: var(--color-success); }
.bg-info { background-color: var(--color-info); }

/* 边框工具类 */
.border { border: 1px solid var(--color-border-light); }
.border-0 { border: 0; }
.border-top { border-top: 1px solid var(--color-border-light); }
.border-right { border-right: 1px solid var(--color-border-light); }
.border-bottom { border-bottom: 1px solid var(--color-border-light); }
.border-left { border-left: 1px solid var(--color-border-light); }

.rounded-sm { border-radius: var(--border-radius-sm); }
.rounded-md { border-radius: var(--border-radius-md); }
.rounded-lg { border-radius: var(--border-radius-lg); }
.rounded-pill { border-radius: var(--border-radius-pill); }

/* 阴影工具类 */
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }
.shadow-none { box-shadow: none; }

/* 位置工具类 */
.position-relative { position: relative; }
.position-absolute { position: absolute; }
.position-fixed { position: fixed; }
.position-sticky { position: sticky; }

.top-0 { top: 0; }
.right-0 { right: 0; }
.bottom-0 { bottom: 0; }
.left-0 { left: 0; }

.w-100 { width: 100%; }
.h-100 { height: 100%; }

/* 可见性工具类 */
.visible { visibility: visible; }
.invisible { visibility: hidden; }
.opacity-0 { opacity: 0; }
.opacity-25 { opacity: 0.25; }
.opacity-50 { opacity: 0.5; }
.opacity-75 { opacity: 0.75; }
.opacity-100 { opacity: 1; }

/* 过渡工具类 */
.transition { 
  transition: all var(--transition-normal) var(--transition-timing);
}
.transition-fast { 
  transition: all var(--transition-fast) var(--transition-timing);
}
.transition-slow { 
  transition: all var(--transition-slow) var(--transition-timing);
}
```

### 3. 创建组件CSS模块

**问题**：组件样式分散在多个文件中，难以维护。

**解决方案**：为每个组件创建独立的CSS模块，使用BEM命名规范。

```css
/* css/components/button.css */
/**
 * 按钮组件
 * 使用BEM命名规范: block__element--modifier
 */

/* 基础按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast) var(--transition-timing);
  border: 1px solid transparent;
  user-select: none;
}

/* 按钮变体 */
.btn--primary {
  background-color: var(--color-primary);
  color: white;
}

.btn--primary:hover {
  background-color: var(--color-primary-dark);
}

.btn--secondary {
  background-color: var(--color-secondary);
  color: white;
}

.btn--secondary:hover {
  background-color: var(--color-secondary-dark);
}

.btn--outline {
  background-color: transparent;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn--outline:hover {
  background-color: var(--color-primary);
  color: white;
}

.btn--text {
  background-color: transparent;
  border-color: transparent;
  color: var(--color-primary);
  padding: var(--spacing-xxs) var(--spacing-xs);
}

.btn--text:hover {
  background-color: rgba(66, 133, 244, 0.1);
}

/* 按钮尺寸 */
.btn--sm {
  padding: var(--spacing-xxs) var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.btn--lg {
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-md);
}

/* 按钮状态 */
.btn:disabled,
.btn--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.btn--loading {
  position: relative;
  color: transparent;
}

.btn--loading::after {
  content: "";
  position: absolute;
  width: 1em;
  height: 1em;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: btn-spinner 0.75s linear infinite;
}

@keyframes btn-spinner {
  to { transform: rotate(360deg); }
}

/* 按钮图标 */
.btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn__icon--left {
  margin-right: var(--spacing-xxs);
}

.btn__icon--right {
  margin-left: var(--spacing-xxs);
}
```

```css
/* css/components/card.css */
/**
 * 卡片组件
 */

.card {
  background-color: var(--color-background-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.card__header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
}

.card__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.card__subtitle {
  margin: var(--spacing-xxs) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.card__body {
  padding: var(--spacing-md);
}

.card__footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}

/* 卡片变体 */
.card--flat {
  box-shadow: none;
  border: 1px solid var(--color-border-light);
}

.card--hover:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  transition: all var(--transition-fast) var(--transition-timing);
}
```

### 4. 创建布局系统

**问题**：布局相关的CSS重复定义。

**解决方案**：创建统一的布局系统。

```css
/* css/layout.css */
/**
 * 布局系统
 */

/* 容器 */
.container {
  width: 100%;
  padding-right: var(--spacing-md);
  padding-left: var(--spacing-md);
  margin-right: auto;
  margin-left: auto;
}

@media (min-width: 576px) {
  .container {
    max-width: 540px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
}

@media (min-width: 992px) {
  .container {
    max-width: 960px;
  }
}

@media (min-width: 1200px) {
  .container {
    max-width: 1140px;
  }
}

.container-fluid {
  width: 100%;
  padding-right: var(--spacing-md);
  padding-left: var(--spacing-md);
  margin-right: auto;
  margin-left: auto;
}

/* 网格系统 */
.row {
  display: flex;
  flex-wrap: wrap;
  margin-right: calc(var(--spacing-md) * -1);
  margin-left: calc(var(--spacing-md) * -1);
}

.col {
  position: relative;
  width: 100%;
  padding-right: var(--spacing-md);
  padding-left: var(--spacing-md);
  flex-basis: 0;
  flex-grow: 1;
  max-width: 100%;
}

/* 定义12列网格系统 */
.col-1 { flex: 0 0 8.333333%; max-width: 8.333333%; }
.col-2 { flex: 0 0 16.666667%; max-width: 16.666667%; }
.col-3 { flex: 0 0 25%; max-width: 25%; }
.col-4 { flex: 0 0 33.333333%; max-width: 33.333333%; }
.col-5 { flex: 0 0 41.666667%; max-width: 41.666667%; }
.col-6 { flex: 0 0 50%; max-width: 50%; }
.col-7 { flex: 0 0 58.333333%; max-width: 58.333333%; }
.col-8 { flex: 0 0 66.666667%; max-width: 66.666667%; }
.col-9 { flex: 0 0 75%; max-width: 75%; }
.col-10 { flex: 0 0 83.333333%; max-width: 83.333333%; }
.col-11 { flex: 0 0 91.666667%; max-width: 91.666667%; }
.col-12 { flex: 0 0 100%; max-width: 100%; }

/* 响应式列 */
@media (min-width: 576px) {
  .col-sm-1 { flex: 0 0 8.333333%; max-width: 8.333333%; }
  .col-sm-2 { flex: 0 0 16.666667%; max-width: 16.666667%; }
  /* ... 其他sm列 ... */
  .col-sm-12 { flex: 0 0 100%; max-width: 100%; }
}

@media (min-width: 768px) {
  .col-md-1 { flex: 0 0 8.333333%; max-width: 8.333333%; }
  .col-md-2 { flex: 0 0 16.666667%; max-width: 16.666667%; }
  /* ... 其他md列 ... */
  .col-md-12 { flex: 0 0 100%; max-width: 100%; }
}

@media (min-width: 992px) {
  .col-lg-1 { flex: 0 0 8.333333%; max-width: 8.333333%; }
  .col-lg-2 { flex: 0 0 16.666667%; max-width: 16.666667%; }
  /* ... 其他lg列 ... */
  .col-lg-12 { flex: 0 0 100%; max-width: 100%; }
}

@media (min-width: 1200px) {
  .col-xl-1 { flex: 0 0 8.333333%; max-width: 8.333333%; }
  .col-xl-2 { flex: 0 0 16.666667%; max-width: 16.666667%; }
  /* ... 其他xl列 ... */
  .col-xl-12 { flex: 0 0 100%; max-width: 100%; }
}
```

### 5. 创建主题系统

**问题**：主题相关的样式分散，难以管理。

**解决方案**：创建统一的主题系统。

```css
/* css/themes.css */
/**
 * 主题系统
 */

/* 默认主题 */
:root {
  /* 基础变量在variables.css中定义 */
}

/* 暗色主题 */
[data-theme="dark"] {
  /* 暗色主题变量在variables.css中定义 */
}

/* 护眼主题 */
[data-theme="eye-care"] {
  --color-background-light: #f0f5e6;
  --color-background-grey: #e6ebd9;
  --color-background-dark: #d9e0cc;
  
  --color-text-primary: rgba(0, 0, 0, 0.75);
  --color-text-secondary: rgba(0, 0, 0, 0.6);
  
  --color-primary: #5d9e5f;
  --color-primary-light: #6fb171;
  --color-primary-dark: #4c8a4e;
}

/* 高对比度主题 */
[data-theme="high-contrast"] {
  --color-background-light: #ffffff;
  --color-background-grey: #f0f0f0;
  --color-background-dark: #000000;
  
  --color-text-primary: #000000;
  --color-text-secondary: #333333;
  --color-text-disabled: #666666;
  
  --color-primary: #0000cc;
  --color-primary-light: #0000ff;
  --color-primary-dark: #000099;
  
  --color-border-light: #000000;
  --color-border-medium: #000000;
  
  --shadow-sm: 0 0 0 1px #000000;
  --shadow-md: 0 0 0 2px #000000;
  --shadow-lg: 0 0 0 3px #000000;
  --shadow-xl: 0 0 0 4px #000000;
}
```

### 6. 优化媒体查询

**问题**：媒体查询分散在多个文件中，导致重复和不一致。

**解决方案**：创建统一的媒体查询混合器。

```css
/* css/media-queries.css */
/**
 * 媒体查询系统
 */

/* 断点变量 */
:root {
  --breakpoint-xs: 0;
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
}

/* 响应式显示类 */
.d-none { display: none !important; }
.d-block { display: block !important; }

@media (min-width: 576px) {
  .d-sm-none { display: none !important; }
  .d-sm-block { display: block !important; }
}

@media (min-width: 768px) {
  .d-md-none { display: none !important; }
  .d-md-block { display: block !important; }
}

@media (min-width: 992px) {
  .d-lg-none { display: none !important; }
  .d-lg-block { display: block !important; }
}

@media (min-width: 1200px) {
  .d-xl-none { display: none !important; }
  .d-xl-block { display: block !important; }
}

/* 打印样式 */
@media print {
  .d-print-none { display: none !important; }
  .d-print-block { display: block !important; }
}
```

### 7. 创建主CSS入口文件

**问题**：CSS文件加载顺序不明确，可能导致样式覆盖问题。

**解决方案**：创建主CSS入口文件，明确导入顺序。

```css
/* css/main.css */
/**
 * 主CSS入口文件
 * 按照依赖关系顺序导入所有CSS模块
 */

/* 基础 */
@import 'variables.css';
@import 'reset.css';
@import 'base.css';

/* 布局 */
@import 'layout.css';
@import 'media-queries.css';

/* 工具类 */
@import 'utilities.css';

/* 组件 */
@import 'components/button.css';
@import 'components/card.css';
@import 'components/form.css';
@import 'components/modal.css';
@import 'components/toast.css';
@import 'components/tabs.css';
@import 'components/dropdown.css';
@import 'components/free-css-input.css';
@import 'components/background-helper.css';

/* 页面特定样式 */
@import 'pages/settings.css';
@import 'pages/page-beautify.css';

/* 主题 */
@import 'themes.css';

/* 打印样式 */
@import 'print.css';
```

### 8. 实现CSS模块化加载

**问题**：所有CSS一次性加载，影响性能。

**解决方案**：实现CSS模块化加载。

```html
<!-- 在HTML文件中实现CSS模块化加载 -->
<head>
  <!-- 关键CSS -->
  <link rel="stylesheet" href="css/critical.css">
  
  <!-- 延迟加载非关键CSS -->
  <link rel="stylesheet" href="css/non-critical.css" media="print" onload="this.media='all'">
  
  <!-- 按需加载特定页面CSS -->
  <script>
    // 检测当前页面
    const currentPage = document.body.dataset.page;
    
    if (currentPage === 'settings') {
      loadCSS('css/pages/settings.css');
    } else if (currentPage === 'page-beautify') {
      loadCSS('css/pages/page-beautify.css');
    }
    
    // 加载CSS辅助函数
    function loadCSS(href) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  </script>
</head>
```

## 实施路径

1. **CSS变量系统（1天）**
   - 创建variables.css
   - 提取所有颜色、字体、间距等常量

2. **工具类库（1-2天）**
   - 创建utilities.css
   - 实现常用工具类

3. **组件模块化（2-3天）**
   - 为每个组件创建独立CSS文件
   - 应用BEM命名规范

4. **布局系统（1天）**
   - 创建layout.css
   - 实现网格系统和容器

5. **主题系统（1天）**
   - 创建themes.css
   - 实现主题切换机制

6. **媒体查询优化（0.5天）**
   - 创建media-queries.css
   - 统一响应式断点

7. **CSS入口文件（0.5天）**
   - 创建main.css
   - 组织导入顺序

8. **模块化加载（1天）**
   - 实现关键CSS内联
   - 配置延迟加载和按需加载

## 优势与收益

1. **减少代码重复**：通过变量和工具类减少重复样式定义
2. **提高可维护性**：模块化结构和命名规范使代码更易维护
3. **增强可扩展性**：组件化设计便于添加新功能
4. **提高性能**：优化CSS加载策略，减少阻塞渲染的CSS
5. **统一设计语言**：变量系统确保设计一致性
6. **简化主题切换**：主题系统使主题切换更加简单

## 注意事项

- CSS变量在IE11中不受支持，需要考虑兼容性方案
- 工具类应适度使用，避免HTML过度膨胀
- 重构过程应分阶段进行，每次更改后进行充分测试
- 保持现有类名的向后兼容性，避免破坏现有功能
- 考虑使用PostCSS等工具自动处理前缀和优化
