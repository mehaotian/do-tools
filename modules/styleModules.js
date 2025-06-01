/**
 * 具体样式模块实现
 * 包含各种页面元素的美化样式
 */

import { BaseStyleModule } from './baseStyleModule.js';

/**
 * 导航栏样式模块
 */
class NavbarStyleModule extends BaseStyleModule {
  constructor() {
    super('navbar', [
      '.d-header-wrap .d-header',
      'nav',
      '.navbar',
      '.header',
      '.site-header'
    ]);
  }

  /**
   * 获取需要备份的样式属性
   */
  getBackupProperties() {
    return [
      'background-image',
      'background-size',
      'backdrop-filter',
      'background-color',
      'transition',
      'position',
      'z-index',
      'border',
      'box-shadow'
    ];
  }

  /**
   * 应用导航栏毛玻璃效果
   * @param {Object} config - 配置参数
   * @param {boolean} config.enabled - 是否启用
   * @param {number} config.blur - 模糊强度
   * @param {number} config.size - 点阵大小
   * @param {number} config.transparent - 透明区域大小
   * @param {string} config.color - 背景颜色
   */
  async apply(config) {
    const elements = this.getTargetElements();
    
    if (!config.enabled) {
      return this.remove();
    }

    const {
      blur = 4,
      size = 4,
      transparent = 1,
      color = 'rgba(255, 255, 255, 0.1)'
    } = config;

    const styles = {
      'background-image': `radial-gradient(transparent ${transparent}px, ${color} ${transparent}px)`,
      'background-size': `${size}px ${size}px`,
      'backdrop-filter': `saturate(50%) blur(${blur}px)`,
      'background-color': 'transparent',
      'transition': 'all 0.3s ease',
      'position': 'relative',
      'z-index': '1000'
    };

    elements.forEach(element => {
      Object.assign(element.style, styles);
      element.classList.add('page-beautify-navbar');
    });
  }

  /**
   * 移除导航栏样式
   */
  async remove() {
    const elements = this.getTargetElements();
    
    elements.forEach(element => {
      // 移除添加的类名
      element.classList.remove('page-beautify-navbar');
      
      // 移除内联样式
      const properties = this.getBackupProperties();
      properties.forEach(prop => {
        element.style.removeProperty(prop);
      });
    });
  }
}

/**
 * 主体内容样式模块
 */
class BodyStyleModule extends BaseStyleModule {
  constructor() {
    super('body', ['body']);
  }

  getBackupProperties() {
    return [
      'background-color',
      'color',
      'font-family',
      'font-size',
      'line-height',
      'transition'
    ];
  }

  /**
   * 应用主体样式
   * @param {Object} config - 配置参数
   */
  async apply(config) {
    const elements = this.getTargetElements();
    
    const {
      backgroundColor = '#ffffff',
      textColor = '#333333',
      fontFamily = 'system-ui, -apple-system, sans-serif',
      fontSize = '16px',
      lineHeight = '1.6'
    } = config;

    const styles = {
      'background-color': backgroundColor,
      'color': textColor,
      'font-family': fontFamily,
      'font-size': fontSize,
      'line-height': lineHeight,
      'transition': 'all 0.3s ease'
    };

    elements.forEach(element => {
      Object.assign(element.style, styles);
      element.classList.add('page-beautify-body');
    });
  }

  async remove() {
    const elements = this.getTargetElements();
    
    elements.forEach(element => {
      element.classList.remove('page-beautify-body');
      
      const properties = this.getBackupProperties();
      properties.forEach(prop => {
        element.style.removeProperty(prop);
      });
    });
  }
}

/**
 * 容器样式模块
 */
class ContainerStyleModule extends BaseStyleModule {
  constructor() {
    super('container', [
      '.container',
      '.main-content',
      '#main',
      '.content',
      '.wrapper',
      '.page-content'
    ]);
  }

  getBackupProperties() {
    return [
      'max-width',
      'margin',
      'padding',
      'border-radius',
      'box-shadow',
      'background-color',
      'transition'
    ];
  }

  /**
   * 应用容器样式
   * @param {Object} config - 配置参数
   */
  async apply(config) {
    const elements = this.getTargetElements();
    
    const {
      maxWidth = '1200px',
      centerContent = true,
      borderRadius = '8px',
      enableShadow = true,
      backgroundColor = 'transparent',
      padding = '20px'
    } = config;

    const styles = {
      'max-width': maxWidth,
      'margin': centerContent ? '0 auto' : 'initial',
      'padding': padding,
      'border-radius': borderRadius,
      'background-color': backgroundColor,
      'transition': 'all 0.3s ease'
    };

    if (enableShadow) {
      styles['box-shadow'] = '0 4px 12px rgba(0, 0, 0, 0.1)';
    }

    elements.forEach(element => {
      Object.assign(element.style, styles);
      element.classList.add('page-beautify-container');
    });
  }

  async remove() {
    const elements = this.getTargetElements();
    
    elements.forEach(element => {
      element.classList.remove('page-beautify-container');
      
      const properties = this.getBackupProperties();
      properties.forEach(prop => {
        element.style.removeProperty(prop);
      });
    });
  }
}

/**
 * 卡片样式模块
 */
class CardStyleModule extends BaseStyleModule {
  constructor() {
    super('cards', [
      '.card',
      '.feature-item',
      '.item',
      '.post',
      '.article',
      '.widget'
    ]);
  }

  getBackupProperties() {
    return [
      'border-radius',
      'box-shadow',
      'background-color',
      'border',
      'transition',
      'transform',
      'padding',
      'margin'
    ];
  }

  /**
   * 应用卡片样式
   * @param {Object} config - 配置参数
   */
  async apply(config) {
    const elements = this.getTargetElements();
    
    const {
      borderRadius = '12px',
      backgroundColor = '#ffffff',
      enableShadow = true,
      enableHover = true,
      shadowColor = 'rgba(0, 0, 0, 0.1)',
      padding = '16px',
      margin = '8px'
    } = config;

    const styles = {
      'border-radius': borderRadius,
      'background-color': backgroundColor,
      'transition': 'all 0.3s ease',
      'padding': padding,
      'margin': margin
    };

    if (enableShadow) {
      styles['box-shadow'] = `0 2px 8px ${shadowColor}`;
    }

    elements.forEach(element => {
      Object.assign(element.style, styles);
      element.classList.add('page-beautify-card');
      
      if (enableHover) {
        element.addEventListener('mouseenter', this.handleCardHover);
        element.addEventListener('mouseleave', this.handleCardLeave);
      }
    });
  }

  /**
   * 卡片悬停效果
   */
  handleCardHover = (event) => {
    event.target.style.transform = 'translateY(-2px)';
    event.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
  }

  /**
   * 卡片离开效果
   */
  handleCardLeave = (event) => {
    event.target.style.transform = 'translateY(0)';
    event.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  }

  async remove() {
    const elements = this.getTargetElements();
    
    elements.forEach(element => {
      element.classList.remove('page-beautify-card');
      
      // 移除事件监听器
      element.removeEventListener('mouseenter', this.handleCardHover);
      element.removeEventListener('mouseleave', this.handleCardLeave);
      
      const properties = this.getBackupProperties();
      properties.forEach(prop => {
        element.style.removeProperty(prop);
      });
    });
  }
}

/**
 * 链接样式模块
 */
class LinkStyleModule extends BaseStyleModule {
  constructor() {
    super('links', ['a']);
  }

  getBackupProperties() {
    return [
      'color',
      'text-decoration',
      'transition',
      'border-radius',
      'padding'
    ];
  }

  /**
   * 应用链接样式
   * @param {Object} config - 配置参数
   */
  async apply(config) {
    const elements = this.getTargetElements();
    
    const {
      color = '#0066cc',
      hoverColor = '#0052a3',
      textDecoration = 'none',
      enableHoverEffect = true
    } = config;

    const styles = {
      'color': color,
      'text-decoration': textDecoration,
      'transition': 'all 0.2s ease'
    };

    elements.forEach(element => {
      Object.assign(element.style, styles);
      element.classList.add('page-beautify-link');
      
      if (enableHoverEffect) {
        element.addEventListener('mouseenter', () => {
          element.style.color = hoverColor;
        });
        element.addEventListener('mouseleave', () => {
          element.style.color = color;
        });
      }
    });
  }

  async remove() {
    const elements = this.getTargetElements();
    
    elements.forEach(element => {
      element.classList.remove('page-beautify-link');
      
      const properties = this.getBackupProperties();
      properties.forEach(prop => {
        element.style.removeProperty(prop);
      });
    });
  }
}

/**
 * 文本样式模块
 */
class TextStyleModule extends BaseStyleModule {
  constructor() {
    super('text', [
      'p', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      '.text', '.content-text'
    ]);
  }

  getBackupProperties() {
    return [
      'font-size',
      'line-height',
      'color',
      'font-weight',
      'letter-spacing',
      'text-shadow'
    ];
  }

  /**
   * 应用文本样式
   * @param {Object} config - 配置参数
   */
  async apply(config) {
    const elements = this.getTargetElements();
    
    const {
      fontSize = '16px',
      lineHeight = '1.6',
      color = '#333333',
      letterSpacing = 'normal',
      enableTextShadow = false
    } = config;

    const styles = {
      'font-size': fontSize,
      'line-height': lineHeight,
      'color': color,
      'letter-spacing': letterSpacing
    };

    if (enableTextShadow) {
      styles['text-shadow'] = '0 1px 2px rgba(0, 0, 0, 0.1)';
    }

    elements.forEach(element => {
      Object.assign(element.style, styles);
      element.classList.add('page-beautify-text');
    });
  }

  async remove() {
    const elements = this.getTargetElements();
    
    elements.forEach(element => {
      element.classList.remove('page-beautify-text');
      
      const properties = this.getBackupProperties();
      properties.forEach(prop => {
        element.style.removeProperty(prop);
      });
    });
  }
}

export {
  NavbarStyleModule,
  BodyStyleModule,
  ContainerStyleModule,
  CardStyleModule,
  LinkStyleModule,
  TextStyleModule
};