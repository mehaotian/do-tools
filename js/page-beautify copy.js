/**
 * 页面美化功能管理器
 * 用于调整当前页面的样式和主题
 */

import { ChromeAPIManager  } from '../modules/featureHandlers.js';
class PageBeautifyManager {
    constructor() {
        // 尝试获取目标页面的引用（父窗口或当前窗口）
        this.targetWindow = window.parent !== window ? window.parent : window;
        this.targetDocument = this.targetWindow.document;
        
        this.currentSettings = {
            // 导航栏毛玻璃效果设置
            navbar: {
                enabled: false,
                blur: 4,
                size: 4,
                transparent: 1,
                color: '#ffffff'
            },
            theme: 'default',
            fontSize: 16,
            lineHeight: 1.5,
            fontFamily: 'system',
            backgroundColor: '#ffffff',
            textColor: '#333333',
            linkColor: '#0066cc',
            pageWidth: 1200,
            centerContent: true,
            borderRadius: 8,
            enableShadow: true,
            enableAnimation: true,
            enableBlur: false
        };
        
        this.themePresets = {
            default: {
                backgroundColor: '#ffffff',
                textColor: '#333333',
                linkColor: '#0066cc'
            },
            dark: {
                backgroundColor: '#1a1a1a',
                textColor: '#e0e0e0',
                linkColor: '#66b3ff'
            },
            blue: {
                backgroundColor: '#f0f8ff',
                textColor: '#1e3a8a',
                linkColor: '#3b82f6'
            },
            green: {
                backgroundColor: '#f0fff4',
                textColor: '#166534',
                linkColor: '#22c55e'
            },
            purple: {
                backgroundColor: '#faf5ff',
                textColor: '#581c87',
                linkColor: '#a855f7'
            },
            warm: {
                backgroundColor: '#fffbf0',
                textColor: '#92400e',
                linkColor: '#f59e0b'
            }
        };
        
        this.targetSelectors = {
            body: 'body',
            container: '.container, .main-content, #main, .content',
            text: 'p, span, div, h1, h2, h3, h4, h5, h6',
            links: 'a',
            cards: '.card, .feature-item, .item',
            navbar: '.d-header-wrap .d-header'
        };
        
        // 获取目标页面引用（父窗口或当前窗口）
        this.targetWindow = window.parent !== window ? window.parent : window;
        this.targetDocument = this.targetWindow.document;
        
        this.init();
    }
    
    /**
     * 初始化页面美化管理器
     */
    init() {
        // this.loadSettings();
        this.bindEvents();
        this.checkNavbarElements();
        this.applyCurrentSettings();
        this.updateUIControls();
    }
    
    /**
     * 检测目标页面中的导航栏元素
     */
    checkNavbarElements() {
        this.sendMessageToContentScript('CHECK_NAVBAR_ELEMENTS').then((response) => {
            const hasNavbar = response && response.hasNavbar;
            this.updateNavbarStatus(hasNavbar);
            
            if (hasNavbar) {
                console.log(`找到导航栏元素`);
            } else {
                console.log('未找到导航栏元素');
            }
        }).catch((error) => {
            console.warn('无法检测导航栏元素:', error);
            this.updateNavbarStatus(false);
        });
    }
    
    /**
     * 更新导航栏状态指示器
     */
    updateNavbarStatus(hasNavbar) {
        const statusIndicator = document.querySelector('.navbar-status-indicator');
        if (statusIndicator) {
            statusIndicator.className = `navbar-status-indicator ${hasNavbar ? 'available' : 'unavailable'}`;
            statusIndicator.title = hasNavbar ? '检测到导航栏元素，可以应用效果' : '未检测到导航栏元素，无法应用效果';
        }
        
        // 禁用/启用导航栏相关控件
        const navbarToggle = document.getElementById('centerContentToggle');
        if (navbarToggle) {
            navbarToggle.style.opacity = hasNavbar ? '1' : '0.5';
            navbarToggle.style.pointerEvents = hasNavbar ? 'auto' : 'none';
        }
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 主题预设选择
        document.querySelectorAll('.theme-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.selectThemePreset(theme);
            });
        });
        
        // 导航栏毛玻璃效果开关
        const navbarToggle = document.getElementById('centerContentToggle');
        if (navbarToggle) {
            navbarToggle.addEventListener('click', () => {
                this.toggleNavbarGlassEffect();
            });
        }
        
        // 导航栏参数滑块
        const navbarParams = ['navbarBlur', 'navbarSize', 'navbarTransparent'];
        navbarParams.forEach(paramId => {
            const slider = document.getElementById(paramId);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const param = paramId.replace('navbar', '').toLowerCase();
                    const value = parseFloat(e.target.value);
                    this.updateNavbarGlassParam(param, value);
                    this.updateRangeValue(paramId, value + 'px');
                });
            }
        });
        
        // 导航栏颜色选择器
        const navbarColorPicker = document.getElementById('navbarColor');
        if (navbarColorPicker) {
            navbarColorPicker.addEventListener('input', (e) => {
                this.updateNavbarGlassParam('color', e.target.value);
            });
        }
        
        // 配置导入导出事件
        const exportConfigBtn = document.getElementById('exportConfigBtn');
        if (exportConfigBtn) {
            exportConfigBtn.addEventListener('click', () => {
                this.saveSettingsToFile();
                this.showToast('配置已导出', 'success');
            });
        }
        
        const importConfigBtn = document.getElementById('importConfigBtn');
        const importConfigInput = document.getElementById('importConfigInput');
        if (importConfigBtn && importConfigInput) {
            importConfigBtn.addEventListener('click', () => {
                importConfigInput.click();
            });
            
            importConfigInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.loadSettingsFromFile(file).then(() => {
                        // 重新检测导航栏元素
                        this.checkNavbarElements();
                    }).catch((error) => {
                        console.error('配置加载失败:', error);
                    });
                }
                // 清空文件输入，允许重复选择同一文件
                e.target.value = '';
            });
        }
        
        // 字体大小滑块
        const fontSizeSlider = document.getElementById('fontSize');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                this.updateSetting('fontSize', parseInt(e.target.value));
                this.updateRangeValue('fontSize', e.target.value + 'px');
            });
        }
        
        // 行间距滑块
        const lineHeightSlider = document.getElementById('lineHeight');
        if (lineHeightSlider) {
            lineHeightSlider.addEventListener('input', (e) => {
                this.updateSetting('lineHeight', parseFloat(e.target.value) / 100);
                this.updateRangeValue('lineHeight', (parseFloat(e.target.value) / 100).toFixed(1));
            });
        }
        
        // 页面宽度滑块
        const pageWidthSlider = document.getElementById('pageWidth');
        if (pageWidthSlider) {
            pageWidthSlider.addEventListener('input', (e) => {
                this.updateSetting('pageWidth', parseInt(e.target.value));
                this.updateRangeValue('pageWidth', e.target.value + 'px');
            });
        }
        
        // 圆角滑块
        const borderRadiusSlider = document.getElementById('borderRadius');
        if (borderRadiusSlider) {
            borderRadiusSlider.addEventListener('input', (e) => {
                this.updateSetting('borderRadius', parseInt(e.target.value));
                this.updateRangeValue('borderRadius', e.target.value + 'px');
            });
        }
        
        // 颜色选择器
        const colorInputs = ['backgroundColor', 'textColor', 'linkColor'];
        colorInputs.forEach(colorType => {
            const colorInput = document.getElementById(colorType);
            if (colorInput) {
                colorInput.addEventListener('input', (e) => {
                    this.updateSetting(colorType, e.target.value);
                });
            }
        });
        
        // 开关控件
        const toggles = ['centerContent', 'enableShadow', 'enableAnimation', 'enableBlur'];
        toggles.forEach(toggleType => {
            const toggle = document.getElementById(toggleType + 'Toggle');
            if (toggle) {
                toggle.addEventListener('click', () => {
                    this.toggleSetting(toggleType);
                });
            }
        });
        
        // 应用和重置按钮
        const applyBtn = document.getElementById('applyStyles');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyStyles();
            });
        }
        
        const resetBtn = document.getElementById('resetStyles');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetStyles();
            });
        }
    }
    
    /**
     * 切换导航栏毛玻璃效果
     */
    toggleNavbarGlassEffect() {
        this.currentSettings.navbar.enabled = !this.currentSettings.navbar.enabled;
        
        this.sendMessageToContentScript('TOGGLE_NAVBAR_EFFECT', {
            enabled: this.currentSettings.navbar.enabled
        }).catch((error) => {
            console.warn('切换导航栏效果失败:', error);
        });
        
        this.updateToggleState('centerContentToggle', this.currentSettings.navbar.enabled);
        this.toggleNavbarSettings(this.currentSettings.navbar.enabled);
        this.saveSettings();
    }
    
    /**
     * 显示/隐藏导航栏参数设置
     */
    toggleNavbarSettings(show) {
        const settingIds = ['navbarBlurSettings', 'navbarSizeSettings', 'navbarTransparentSettings', 'navbarColorSettings'];
        settingIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = show ? 'flex' : 'none';
            }
        });
    }
    
    /**
     * 应用导航栏毛玻璃效果
     */
    applyNavbarGlassEffect() {
        // 通过消息传递给内容脚本
        this.sendMessageToContentScript('APPLY_NAVBAR_EFFECT', {
            settings: this.currentSettings.navbar
        }).then((response) => {
            if (response && response.success) {
                console.log('已应用导航栏毛玻璃效果到目标页面');
            } else {
                console.warn('应用导航栏效果失败');
            }
        }).catch((error) => {
            console.warn('无法与目标页面通信:', error);
            this.showToast('无法与目标页面通信，请确保页面已加载', 'error');
        });
    }
    
    /**
     * 更新导航栏毛玻璃效果参数
     */
    updateNavbarGlassParam(param, value) {
        this.currentSettings.navbar[param] = value;
        this.saveSettings();
        
        // 如果毛玻璃效果已启用，立即应用新参数实现实时预览
        if (this.currentSettings.navbar.enabled) {
            this.sendMessageToContentScript('UPDATE_NAVBAR_PARAM', {
                param: param,
                value: value
            }).catch((error) => {
                console.warn('更新参数失败:', error);
            });
        }
        
        console.log(`导航栏参数 ${param} 已更新为: ${value}`);
    }
    
    /**
     * 向内容脚本发送消息
     * @param {string} type - 消息类型
     * @param {Object} data - 消息数据
     * @returns {Promise} - 返回Promise处理响应
     */
    async sendMessageToContentScript(type, data = {}) {
        try {
            // const response = await FeatureHandlers.sendMessage({
            //     action: 'pageBeautify',
            //     type: type,
            //     data: data
            // });
            const response  = await ChromeAPIManager.sendMessage({ action: "pageBeautify" });
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error || '消息发送失败');
            }
        } catch (error) {
            console.error('发送消息到内容脚本失败:', error);
            throw error;
        }
    }
    
    /**
     * 选择主题预设
     */
    selectThemePreset(theme) {
        // 移除所有主题预设的选中状态
        document.querySelectorAll('.theme-preset').forEach(preset => {
            preset.classList.remove('active');
        });
        
        // 添加选中状态
        const selectedPreset = document.querySelector(`[data-theme="${theme}"]`);
        if (selectedPreset) {
            selectedPreset.classList.add('active');
        }
        
        // 应用主题
        this.currentSettings.theme = theme;
        const themeColors = this.themePresets[theme];
        if (themeColors) {
            Object.assign(this.currentSettings, themeColors);
            this.updateColorInputs();
            this.applyCurrentSettings();
        }
        
        this.saveSettings();
    }
    
    /**
     * 更新设置
     */
    updateSetting(key, value) {
        this.currentSettings[key] = value;
        this.applyCurrentSettings();
        this.saveSettings();
    }
    
    /**
     * 切换开关设置
     */
    toggleSetting(key) {
        this.currentSettings[key] = !this.currentSettings[key];
        this.updateToggleState(key + 'Toggle', this.currentSettings[key]);
        this.applyCurrentSettings();
        this.saveSettings();
    }
    
    /**
     * 更新滑块显示值
     */
    updateRangeValue(id, value) {
        const valueElement = document.getElementById(id + 'Value');
        if (valueElement) {
            valueElement.textContent = value;
        }
    }
    
    /**
     * 更新开关状态
     */
    updateToggleState(toggleId, isActive) {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            toggle.classList.toggle('active', isActive);
        }
    }
    
    /**
     * 更新颜色输入框
     */
    updateColorInputs() {
        const colorInputs = ['backgroundColor', 'textColor', 'linkColor'];
        colorInputs.forEach(colorType => {
            const input = document.getElementById(colorType);
            if (input) {
                input.value = this.currentSettings[colorType];
            }
        });
    }
    
    /**
     * 应用当前设置
     */
    applyCurrentSettings() {
        this.applyNavbarGlassEffect();
        this.applyGeneralStyles();
    }
    
    /**
     * 应用通用样式
     */
    applyGeneralStyles() {
        const { 
            fontSize, 
            lineHeight, 
            backgroundColor, 
            textColor, 
            linkColor, 
            pageWidth, 
            centerContent, 
            borderRadius, 
            enableShadow, 
            enableAnimation 
        } = this.currentSettings;
        
        // 应用基础样式
        document.body.style.fontSize = fontSize + 'px';
        document.body.style.lineHeight = lineHeight;
        document.body.style.backgroundColor = backgroundColor;
        document.body.style.color = textColor;
        
        // 应用链接颜色
        const links = document.querySelectorAll(this.targetSelectors.links);
        links.forEach(link => {
            link.style.color = linkColor;
        });
        
        // 应用容器样式
        const containers = document.querySelectorAll(this.targetSelectors.container);
        containers.forEach(container => {
            if (centerContent) {
                container.style.maxWidth = pageWidth + 'px';
                container.style.margin = '0 auto';
            } else {
                container.style.maxWidth = 'none';
                container.style.margin = '0';
            }
            
            if (enableShadow) {
                container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            } else {
                container.style.boxShadow = 'none';
            }
            
            container.style.borderRadius = borderRadius + 'px';
            
            if (enableAnimation) {
                container.style.transition = 'all 0.3s ease';
            } else {
                container.style.transition = 'none';
            }
        });
        
        // 应用卡片样式
        const cards = document.querySelectorAll(this.targetSelectors.cards);
        cards.forEach(card => {
            card.style.borderRadius = borderRadius + 'px';
            
            if (enableShadow) {
                card.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            } else {
                card.style.boxShadow = 'none';
            }
            
            if (enableAnimation) {
                card.style.transition = 'all 0.3s ease';
            } else {
                card.style.transition = 'none';
            }
        });
    }
    
    /**
     * 应用样式到页面
     */
    applyStyles() {
        this.applyCurrentSettings();
        this.showToast('样式已应用', 'success');
    }
    
    /**
     * 重置所有样式
     */
    resetStyles() {
        // 重置设置为默认值
        this.currentSettings = {
            navbar: {
                enabled: false,
                blur: 4,
                size: 4,
                transparent: 1,
                color: '#ffffff'
            },
            theme: 'default',
            fontSize: 16,
            lineHeight: 1.5,
            fontFamily: 'system',
            backgroundColor: '#ffffff',
            textColor: '#333333',
            linkColor: '#0066cc',
            pageWidth: 1200,
            centerContent: true,
            borderRadius: 8,
            enableShadow: true,
            enableAnimation: true,
            enableBlur: false
        };
        
        // 移除所有应用的样式
        this.removeAllStyles();
        
        // 更新UI控件状态
        this.updateUIControls();
        
        // 保存设置
        this.saveSettings();
        
        this.showToast('样式已重置', 'info');
    }
    
    /**
     * 移除所有应用的样式
     */
    removeAllStyles() {
        // 移除导航栏样式
        const navbarElements = document.querySelectorAll(this.targetSelectors.navbar);
        navbarElements.forEach(element => {
            element.style.removeProperty('background-image');
            element.style.removeProperty('background-size');
            element.style.removeProperty('backdrop-filter');
        });
        
        // 移除body样式
        document.body.style.removeProperty('font-size');
        document.body.style.removeProperty('line-height');
        document.body.style.removeProperty('background-color');
        document.body.style.removeProperty('color');
        
        // 移除其他元素样式
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            element.style.removeProperty('color');
            element.style.removeProperty('max-width');
            element.style.removeProperty('margin');
            element.style.removeProperty('box-shadow');
            element.style.removeProperty('border-radius');
            element.style.removeProperty('transition');
        });
    }
    
    /**
     * 更新UI控件状态
     */
    updateUIControls() {
        // 更新主题选择
        document.querySelectorAll('.theme-preset').forEach(preset => {
            preset.classList.remove('active');
        });
        const currentTheme = document.querySelector(`[data-theme="${this.currentSettings.theme}"]`);
        if (currentTheme) {
            currentTheme.classList.add('active');
        }
        
        // 更新开关状态
        this.updateToggleState('centerContentToggle', this.currentSettings.navbar.enabled);
        this.toggleNavbarSettings(this.currentSettings.navbar.enabled);
        
        // 更新导航栏参数控件
        this.updateNavbarControls();
        
        // 更新颜色输入框
        this.updateColorInputs();
        
        // 更新滑块值
        const sliders = {
            'fontSize': this.currentSettings.fontSize + 'px',
            'lineHeight': this.currentSettings.lineHeight,
            'pageWidth': this.currentSettings.pageWidth + 'px',
            'borderRadius': this.currentSettings.borderRadius + 'px'
        };
        
        Object.entries(sliders).forEach(([id, value]) => {
            const slider = document.getElementById(id);
            const valueDisplay = document.getElementById(id + 'Value');
            if (slider && valueDisplay) {
                if (id === 'fontSize') slider.value = this.currentSettings.fontSize;
                if (id === 'lineHeight') slider.value = this.currentSettings.lineHeight * 100;
                if (id === 'pageWidth') slider.value = this.currentSettings.pageWidth;
                if (id === 'borderRadius') slider.value = this.currentSettings.borderRadius;
                valueDisplay.textContent = value;
            }
        });
    }
    
    /**
     * 更新导航栏参数控件
     */
    updateNavbarControls() {
        const { navbar } = this.currentSettings;
        
        // 更新滑块值
        const navbarSliders = {
            'navbarBlur': { value: navbar.blur, unit: 'px' },
            'navbarSize': { value: navbar.size, unit: 'px' },
            'navbarTransparent': { value: navbar.transparent, unit: 'px' }
        };
        
        Object.entries(navbarSliders).forEach(([id, config]) => {
            const slider = document.getElementById(id);
            const valueDisplay = document.getElementById(id + 'Value');
            if (slider && valueDisplay) {
                slider.value = config.value;
                valueDisplay.textContent = config.value + config.unit;
            }
        });
        
        // 更新颜色选择器
        const colorPicker = document.getElementById('navbarColor');
        if (colorPicker) {
            colorPicker.value = navbar.color;
        }
    }
    
    /**
     * 保存设置到本地存储
     */
    saveSettings() {
        try {
            localStorage.setItem('pageBeautifySettings', JSON.stringify(this.currentSettings));
        } catch (error) {
            console.warn('无法保存设置到本地存储:', error);
        }
    }
    
    /**
     * 保存配置到本地JSON文件
     */
    saveSettingsToFile() {
        try {
            const configData = {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                settings: this.currentSettings,
                targetSelectors: this.targetSelectors
            };
            
            const dataStr = JSON.stringify(configData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `page-beautify-config-${new Date().toISOString().slice(0, 10)}.json`;
            
            // 自动下载（静默保存）
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(link.href);
            
            console.log('配置已保存到JSON文件');
        } catch (error) {
            console.warn('无法保存配置到文件:', error);
        }
    }
    
    /**
     * 从JSON文件加载配置
     */
    loadSettingsFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const configData = JSON.parse(e.target.result);
                    if (configData.settings) {
                        this.currentSettings = { ...this.currentSettings, ...configData.settings };
                        this.applyCurrentSettings();
                        this.updateUIControls();
                        this.saveSettings();
                        this.showToast('配置加载成功', 'success');
                        resolve(configData);
                    } else {
                        throw new Error('无效的配置文件格式');
                    }
                } catch (error) {
                    this.showToast('配置文件格式错误', 'error');
                    reject(error);
                }
            };
            reader.onerror = () => {
                this.showToast('文件读取失败', 'error');
                reject(new Error('文件读取失败'));
            };
            reader.readAsText(file);
        });
    }
    
    /**
     * 从本地存储加载设置
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('pageBeautifySettings');
            if (saved) {
                const settings = JSON.parse(saved);
                // 合并设置，确保新增的设置项有默认值
                this.currentSettings = { ...this.currentSettings, ...settings };
                
                // 确保导航栏设置存在
                if (!this.currentSettings.navbar) {
                    this.currentSettings.navbar = {
                        enabled: false,
                        blur: 4,
                        size: 4,
                        transparent: 1,
                        color: '#ffffff'
                    };
                }
            }
        } catch (error) {
            console.warn('无法从本地存储加载设置:', error);
        }
    }
    
    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // 添加样式
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease'
        });
        
        // 设置背景颜色
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        toast.style.backgroundColor = colors[type] || colors.info;
        
        // 添加到页面
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);
        
        // 自动移除
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// 当页面加载完成时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pageBeautifyManager = new PageBeautifyManager();
    });
} else {
    window.pageBeautifyManager = new PageBeautifyManager();
}