// 字体回退和检测脚本
(function() {
    'use strict';
    
    // 字体检测函数
    function detectFont(fontName) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // 设置基准字体
        context.font = '72px monospace';
        const baselineWidth = context.measureText('测试文字').width;
        
        // 测试目标字体
        context.font = `72px ${fontName}, monospace`;
        const testWidth = context.measureText('测试文字').width;
        
        return baselineWidth !== testWidth;
    }
    
    // 可用的中文字体列表（按优先级排序）
    const chineseFonts = [
        'Microsoft YaHei UI',
        'Microsoft YaHei',
        'SimHei',
        'SimSun',
        'NSimSun',
        'FangSong',
        'KaiTi',
        'DengXian',
        'Microsoft JhengHei',
        'PMingLiU',
        'MingLiU'
    ];
    
    // 可用的英文字体列表
    const englishFonts = [
        'Segoe UI',
        'Segoe UI Historic',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Arial Unicode MS',
        'Lucida Sans Unicode',
        'Tahoma',
        'Arial',
        'Helvetica',
        'Verdana'
    ];
    
    // 检测并应用最佳字体
    function applyBestFont() {
        const availableFonts = [];
        
        // 检测中文字体
        for (const font of chineseFonts) {
            if (detectFont(font)) {
                availableFonts.push(font);
            }
        }
        
        // 检测英文字体
        for (const font of englishFonts) {
            if (detectFont(font)) {
                availableFonts.push(font);
            }
        }
        
        // 添加通用回退字体
        availableFonts.push('sans-serif', 'serif', 'monospace');
        
        // 构建字体族字符串
        const fontFamily = availableFonts.map(font => 
            font.includes(' ') ? `"${font}"` : font
        ).join(', ');
        
        // 应用到文档
        const style = document.createElement('style');
        style.textContent = `
            * {
                font-family: ${fontFamily} !important;
            }
            
            /* 特殊元素的字体设置 */
            .menu-item, .dropdown-item span, .tab-label, 
            .sidebar-title, .welcome-content, .action-item,
            .file-name, .folder-name, button, input, textarea {
                font-family: ${fontFamily} !important;
            }
            
            /* 确保图标字体不受影响 */
            [class*="fa-"]::before {
                font-family: 'Segoe UI Symbol', 'Segoe UI Emoji', 'Segoe UI', ${fontFamily} !important;
            }
        `;
        
        document.head.appendChild(style);
        
        console.log('Applied font family:', fontFamily);
    }
    
    // 字符编码检测和修复
    function fixCharacterEncoding() {
        // 确保页面使用UTF-8编码
        const metaCharset = document.querySelector('meta[charset]');
        if (metaCharset) {
            metaCharset.setAttribute('charset', 'UTF-8');
        }
        
        // 添加额外的编码声明
        const metaContentType = document.querySelector('meta[http-equiv="Content-Type"]');
        if (metaContentType) {
            metaContentType.setAttribute('content', 'text/html; charset=utf-8');
        }
        
        // 设置文档语言
        document.documentElement.lang = 'zh-CN';
    }
    
    // 文本渲染优化
    function optimizeTextRendering() {
        const style = document.createElement('style');
        style.textContent = `
            body {
                text-rendering: optimizeLegibility;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                font-feature-settings: "liga" 1, "kern" 1;
                font-variant-ligatures: common-ligatures;
                font-synthesis: weight style;
                unicode-bidi: embed;
                direction: ltr;
            }
            
            /* 针对不同操作系统的优化 */
            @media screen and (-webkit-min-device-pixel-ratio: 0) {
                body {
                    -webkit-font-smoothing: subpixel-antialiased;
                }
            }
            
            /* Windows特定优化 */
            @media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {
                body {
                    text-rendering: auto;
                    -ms-text-size-adjust: 100%;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // 初始化函数
    function initialize() {
        try {
            fixCharacterEncoding();
            optimizeTextRendering();
            applyBestFont();
            
            console.log('Font fallback system initialized successfully');
        } catch (error) {
            console.error('Font fallback initialization failed:', error);
        }
    }
    
    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // 导出到全局作用域（用于调试）
    window.fontFallback = {
        detectFont,
        applyBestFont,
        initialize
    };
})();