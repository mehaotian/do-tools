/**
 * 页面美化工具 - 入口文件
 * 导入新的模块化结构，保持向后兼容性
 */

// 导入主应用
import app from './page-beautify-app.js';

// 兼容性：保持原有的全局变量名
window.pageBeautifyApp = app;

// 导出应用实例
export default app;

