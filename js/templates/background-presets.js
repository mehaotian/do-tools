/**
 * 背景样式预设模板
 * 提供常用的背景样式配置，方便用户快速应用
 */

export const BACKGROUND_PRESETS = {
  // 纯色背景
  solidColors: {
    name: "纯色背景",
    presets: [
      {
        name: "白色背景",
        styles: {
          "background-color": "#ffffff",
          "background-image": "none"
        }
      },
      {
        name: "黑色背景",
        styles: {
          "background-color": "#000000",
          "background-image": "none"
        }
      },
      {
        name: "蓝色背景",
        styles: {
          "background-color": "#3b82f6",
          "background-image": "none"
        }
      },
      {
        name: "绿色背景",
        styles: {
          "background-color": "#10b981",
          "background-image": "none"
        }
      },
      {
        name: "红色背景",
        styles: {
          "background-color": "#ef4444",
          "background-image": "none"
        }
      }
    ]
  },

  // 渐变背景
  gradients: {
    name: "渐变背景",
    presets: [
      {
        name: "蓝紫渐变",
        styles: {
          "background-image": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "background-size": "cover",
          "background-repeat": "no-repeat"
        }
      },
      {
        name: "橙红渐变",
        styles: {
          "background-image": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          "background-size": "cover",
          "background-repeat": "no-repeat"
        }
      },
      {
        name: "绿蓝渐变",
        styles: {
          "background-image": "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          "background-size": "cover",
          "background-repeat": "no-repeat"
        }
      },
      {
        name: "彩虹渐变",
        styles: {
          "background-image": "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)",
          "background-size": "cover",
          "background-repeat": "no-repeat"
        }
      },
      {
        name: "径向渐变",
        styles: {
          "background-image": "radial-gradient(circle, #667eea 0%, #764ba2 100%)",
          "background-size": "cover",
          "background-repeat": "no-repeat"
        }
      }
    ]
  },

  // 图案背景
  patterns: {
    name: "图案背景",
    presets: [
      {
        name: "点状图案",
        styles: {
          "background-image": "radial-gradient(circle, #000 1px, transparent 1px)",
          "background-size": "20px 20px",
          "background-repeat": "repeat",
          "background-color": "#ffffff"
        }
      },
      {
        name: "网格图案",
        styles: {
          "background-image": "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          "background-size": "20px 20px",
          "background-repeat": "repeat",
          "background-color": "#ffffff"
        }
      },
      {
        name: "斜纹图案",
        styles: {
          "background-image": "repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)",
          "background-color": "#ffffff"
        }
      },
      {
        name: "波浪图案",
        styles: {
          "background-image": "url('data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 20\'><path d=\'M0 10 Q25 0 50 10 T100 10 V20 H0 Z\' fill=\'rgba(0,0,0,0.1)\'/></svg>')",
          "background-size": "100px 20px",
          "background-repeat": "repeat-x",
          "background-color": "#ffffff"
        }
      }
    ]
  },

  // 透明背景
  transparent: {
    name: "透明背景",
    presets: [
      {
        name: "半透明白色",
        styles: {
          "background-color": "rgba(255, 255, 255, 0.5)",
          "background-image": "none"
        }
      },
      {
        name: "半透明黑色",
        styles: {
          "background-color": "rgba(0, 0, 0, 0.5)",
          "background-image": "none"
        }
      },
      {
        name: "毛玻璃效果",
        styles: {
          "background-color": "rgba(255, 255, 255, 0.2)",
          "backdrop-filter": "blur(10px)",
          "background-image": "none"
        }
      },
      {
        name: "完全透明",
        styles: {
          "background-color": "transparent",
          "background-image": "none"
        }
      }
    ]
  },

  // 特殊效果
  special: {
    name: "特殊效果",
    presets: [
      {
        name: "动态渐变",
        styles: {
          "background-image": "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)",
          "background-size": "400% 400%",
          "animation": "gradient 15s ease infinite"
        }
      },
      {
        name: "霓虹效果",
        styles: {
          "background-color": "#000",
          "background-image": "linear-gradient(45deg, transparent 30%, rgba(255, 0, 150, 0.5) 50%, transparent 70%)",
          "background-size": "20px 20px"
        }
      },
      {
        name: "纸张纹理",
        styles: {
          "background-color": "#f4f4f4",
          "background-image": "url('data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'><defs><pattern id=\'paper\' x=\'0\' y=\'0\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'><circle cx=\'50\' cy=\'50\' r=\'1\' fill=\'rgba(0,0,0,0.05)\'/></pattern></defs><rect width=\'100\' height=\'100\' fill=\'url(%23paper)\'/></svg>')"
        }
      }
    ]
  }
};

/**
 * 获取所有背景预设
 * @returns {Array} 背景预设列表
 */
export function getAllBackgroundPresets() {
  const allPresets = [];
  
  Object.values(BACKGROUND_PRESETS).forEach(category => {
    category.presets.forEach(preset => {
      allPresets.push({
        ...preset,
        category: category.name
      });
    });
  });
  
  return allPresets;
}

/**
 * 根据分类获取背景预设
 * @param {string} categoryKey - 分类键名
 * @returns {Array} 指定分类的背景预设
 */
export function getBackgroundPresetsByCategory(categoryKey) {
  return BACKGROUND_PRESETS[categoryKey]?.presets || [];
}

/**
 * 搜索背景预设
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 匹配的背景预设
 */
export function searchBackgroundPresets(keyword) {
  const allPresets = getAllBackgroundPresets();
  const lowerKeyword = keyword.toLowerCase();
  
  return allPresets.filter(preset => 
    preset.name.toLowerCase().includes(lowerKeyword) ||
    preset.category.toLowerCase().includes(lowerKeyword)
  );
}