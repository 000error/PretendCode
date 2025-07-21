// 窗口控制按钮修复脚本
// 专门解决Electron应用中最大化、最小化、关闭按钮显示问题

(function() {
    'use strict';
    
    // 等待DOM加载完成
    function initWindowControlsFix() {
        // 窗口控制按钮的Unicode字符映射
        const controlIcons = {
            minimize: '🗕',  // 最小化
            maximize: '🗖',  // 最大化
            restore: '🗗',   // 还原
            close: '🗙'      // 关闭
        };
        
        // 备用字符（如果Unicode不支持）
        const fallbackIcons = {
            minimize: '−',
            maximize: '□',
            restore: '❐',
            close: '✕'
        };
        
        // 检测并修复窗口控制按钮
        function fixWindowControls() {
            // 查找所有可能的窗口控制按钮
            const selectors = [
                '.window-controls button',
                '.titlebar-button',
                '.electron-titlebar button',
                '[title*="最小化"]',
                '[title*="minimize"]',
                '[title*="最大化"]',
                '[title*="maximize"]',
                '[title*="还原"]',
                '[title*="restore"]',
                '[title*="关闭"]',
                '[title*="close"]',
                '.codicon-chrome-minimize',
                '.codicon-chrome-maximize',
                '.codicon-chrome-restore',
                '.codicon-chrome-close'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    fixButtonIcon(element);
                });
            });
        }
        
        // 修复单个按钮图标
        function fixButtonIcon(button) {
            if (!button) return;
            
            const title = button.title || button.getAttribute('aria-label') || '';
            const className = button.className || '';
            
            let iconType = '';
            
            // 根据标题或类名确定按钮类型
            if (title.includes('最小化') || title.includes('minimize') || className.includes('minimize')) {
                iconType = 'minimize';
            } else if (title.includes('最大化') || title.includes('maximize') || className.includes('maximize')) {
                iconType = 'maximize';
            } else if (title.includes('还原') || title.includes('restore') || className.includes('restore')) {
                iconType = 'restore';
            } else if (title.includes('关闭') || title.includes('close') || className.includes('close')) {
                iconType = 'close';
            }
            
            if (iconType) {
                // 设置按钮内容
                const icon = controlIcons[iconType] || fallbackIcons[iconType];
                
                // 清除现有内容并设置新图标
                button.innerHTML = '';
                button.textContent = icon;
                
                // 设置样式
                button.style.fontFamily = "'Segoe UI Symbol', 'Segoe MDL2 Assets', 'Webdings', 'Wingdings', monospace";
                button.style.fontSize = '16px';
                button.style.lineHeight = '1';
                button.style.textAlign = 'center';
                button.style.verticalAlign = 'middle';
                button.style.display = 'inline-block';
                button.style.width = '46px';
                button.style.height = '32px';
                button.style.border = 'none';
                button.style.background = 'transparent';
                button.style.color = '#cccccc';
                button.style.cursor = 'pointer';
                
                // 添加悬停效果
                button.addEventListener('mouseenter', function() {
                    this.style.backgroundColor = iconType === 'close' ? '#e81123' : '#404040';
                });
                
                button.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = 'transparent';
                });
                
                console.log(`Fixed ${iconType} button:`, button);
            }
        }
        
        // 监听DOM变化，动态修复新添加的按钮
        function observeChanges() {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // 检查新添加的元素是否包含窗口控制按钮
                                const buttons = node.querySelectorAll ? 
                                    node.querySelectorAll('.window-controls button, .titlebar-button, .electron-titlebar button') : [];
                                buttons.forEach(fixButtonIcon);
                                
                                // 检查元素本身是否是窗口控制按钮
                                if (node.classList && (node.classList.contains('titlebar-button') || 
                                    node.classList.contains('window-controls'))) {
                                    fixButtonIcon(node);
                                }
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
        
        // 初始化修复
        fixWindowControls();
        
        // 延迟再次修复（确保所有元素都已加载）
        setTimeout(fixWindowControls, 1000);
        setTimeout(fixWindowControls, 3000);
        
        // 开始监听DOM变化
        observeChanges();
        
        console.log('Window controls fix initialized');
    }
    
    // 当DOM准备就绪时初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWindowControlsFix);
    } else {
        initWindowControlsFix();
    }
    
    // 当窗口加载完成时再次初始化
    window.addEventListener('load', function() {
        setTimeout(initWindowControlsFix, 500);
    });
    
})();