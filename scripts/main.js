// VScoding Lite 主脚本文件
const { ipcRenderer } = require('electron');

// 全局变量
let currentEditor = null;
let openTabs = new Map();
let activeTabId = null;
let replaceSettings = {
    triggerLine: 0,
    savePath: '',
    targetFilePath: '', // 具体的.md文件路径
    enabled: false
};

// DOM 元素
const elements = {
    minimizeBtn: document.getElementById('minimize-btn'),
    maximizeBtn: document.getElementById('maximize-btn'),
    closeBtn: document.getElementById('close-btn'),
    newFileBtn: document.getElementById('new-file-btn'),
    openFileBtn: document.getElementById('open-file-btn'),
    tabBar: document.querySelector('.tab-bar'),
    editorContent: document.querySelector('.editor-content'),
    welcomeScreen: document.getElementById('welcome-tab'),
    monacoEditor: document.getElementById('monaco-editor'),
    fileInfo: document.getElementById('file-info'),
    cursorPosition: document.getElementById('cursor-position'),
    languageMode: document.getElementById('language-mode')
};

// 初始化应用
function initializeApp() {
    console.log('Initializing app...');
    console.log('Monaco editor element:', elements.monacoEditor);
    
    setupWindowControls();
    setupFileOperations();
    setupTabSystem();
    setupActivityBar();
    setupFileTree();
    setupMenuBar();
    loadMonacoEditor();
    
    // 初始化欢迎标签
    openTabs.set('welcome', {
        name: 'Welcome',
        content: '',
        type: 'welcome',
        modified: false
    });
    
    // 创建并激活welcome标签
    createTab('welcome', 'Welcome');
    activeTab = 'welcome';
    switchToTab('welcome');
}

// 设置窗口控制
function setupWindowControls() {
    elements.minimizeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('window-minimize');
    });

    elements.maximizeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('window-maximize');
    });

    elements.closeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('window-close');
    });
}

// 设置文件操作
function setupFileOperations() {
    elements.newFileBtn.addEventListener('click', createNewFile);
    elements.openFileBtn.addEventListener('click', openFile);

    // 监听主进程的菜单事件
    ipcRenderer.on('menu-new-file', createNewFile);
    ipcRenderer.on('menu-save-file', saveCurrentFile);
    ipcRenderer.on('file-opened', (event, fileData) => {
        openFileInEditor(fileData);
    });
}

// 设置标签系统
function setupTabSystem() {
    elements.tabBar.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) {
            e.stopPropagation();
            const tab = e.target.closest('.tab');
            const tabId = tab.dataset.tab;
            closeTab(tabId);
        } else if (e.target.closest('.tab')) {
            const tab = e.target.closest('.tab');
            const tabId = tab.dataset.tab;
            switchToTab(tabId);
        }
    });
}

// 设置活动栏
function setupActivityBar() {
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach(item => {
        item.addEventListener('click', () => {
            // 移除所有活动状态
            activityItems.forEach(i => i.classList.remove('active'));
            // 添加当前活动状态
            item.classList.add('active');
            
            const panel = item.dataset.panel;
            updateSidebarContent(panel);
        });
    });
}

// 设置文件树
function setupFileTree() {
    const fileTreeContainer = document.querySelector('.file-tree');
    
    // 定义文件树结构
    const fileStructure = [
        {
            type: 'folder',
            name: '项目文件',
            children: [
                {
                    type: 'file',
                    name: 'Welcome.md',
                    path: 'welcome'
                },
                {
                    type: 'file',
                    name: 'sample.js',
                    path: 'sample'
                }
            ]
        },
        {
            type: 'file',
            name: 'README.md',
            path: 'readme'
        }
    ];
    
    // 渲染文件树
    renderFileTree(fileTreeContainer, fileStructure);
}

// 渲染文件树 - 平铺所有项目
function renderFileTree(container, files) {
    container.innerHTML = ''; // 清空现有内容

    function flattenItems(items) {
        const flatList = [];
        items.forEach(item => {
            if (item.type === 'folder') {
                // 添加文件夹项
                flatList.push({
                    type: 'folder',
                    name: item.name,
                    path: item.path || ''
                });
                // 递归添加文件夹内的文件
                if (item.children) {
                    flatList.push(...flattenItems(item.children));
                }
            } else {
                flatList.push(item);
            }
        });
        return flatList;
    }

    const flatItems = flattenItems(files);
    
    flatItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = item.type === 'folder' ? 'folder-item' : 'file-item';
        
        const icon = item.type === 'folder' ? 'fas fa-folder' : 'fas fa-file-code';
        itemElement.innerHTML = `
            <i class="${icon}"></i>
            <span>${item.name}</span>
        `;
        
        if (item.type === 'file') {
            itemElement.dataset.file = item.path;
            itemElement.addEventListener('click', () => {
                openSampleFile(item.path);
            });
        }
        
        container.appendChild(itemElement);
    });
}

// 通过路径打开文件
async function openFileByPath(filePath) {
    try {
        const result = await ipcRenderer.invoke('open-file-by-path', filePath);
        if (result.success) {
            openFileInEditor(result);
        }
    } catch (error) {
        console.error('Error opening file by path:', error);
    }
}

// 设置菜单栏
function setupMenuBar() {
    const editMenu = document.getElementById('edit-menu');
    const editDropdown = document.getElementById('edit-dropdown');
    const fileMenu = document.getElementById('file-menu');
    const fileDropdown = document.getElementById('file-dropdown');
    
    // 点击File菜单项时切换下拉菜单显示状态
    fileMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        // 关闭其他菜单
        editDropdown.style.display = 'none';
        const isVisible = fileDropdown.style.display === 'block';
        fileDropdown.style.display = isVisible ? 'none' : 'block';
    });
    
    // 点击Edit菜单项时切换下拉菜单显示状态
    editMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        // 关闭其他菜单
        fileDropdown.style.display = 'none';
        const isVisible = editDropdown.style.display === 'block';
        editDropdown.style.display = isVisible ? 'none' : 'block';
    });
    
    // 点击File下拉菜单项时的处理
    fileDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdownItem = e.target.closest('.dropdown-item');
        if (dropdownItem) {
            const itemId = dropdownItem.id;
            console.log('File action clicked:', itemId);
            
            // 处理文件操作
            if (itemId === 'menu-new-file') {
                createNewFile();
            } else if (itemId === 'menu-open-file') {
                openFile();
            }
            
            fileDropdown.style.display = 'none';
        }
    });
    
    // 点击Edit下拉菜单项时的处理
    editDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdownItem = e.target.closest('.dropdown-item');
        if (dropdownItem) {
            const actionText = dropdownItem.querySelector('span').textContent;
            console.log('Edit action clicked:', actionText);
            
            // 处理替换功能
            if (actionText === '替换') {
                showReplaceModal();
            }
            
            editDropdown.style.display = 'none';
        }
    });
    
    // 点击页面其他地方时关闭所有下拉菜单
    document.addEventListener('click', () => {
        editDropdown.style.display = 'none';
        fileDropdown.style.display = 'none';
    });
    
    // 阻止下拉菜单内部点击事件冒泡
    editDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    fileDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // 初始化替换设置弹窗
    setupReplaceModal();
}

// 设置替换弹窗
function setupReplaceModal() {
    const modal = document.getElementById('replace-modal-overlay');
    const closeBtn = document.getElementById('replace-modal-close');
    const cancelBtn = document.getElementById('cancel-replace-btn');
    const saveBtn = document.getElementById('save-replace-btn');
    // 移除了旧的browse-path-btn，现在使用两个独立的按钮
    const lineNumberInput = document.getElementById('line-number-input');
    const savePathInput = document.getElementById('save-path-input');
    const settingStatus = document.getElementById('setting-status');
    
    // 关闭弹窗事件
    const closeModal = () => {
        modal.style.display = 'none';
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // 点击遮罩层关闭弹窗
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // 选择.md文件按钮
    const browseFileBtn = document.getElementById('browse-file-btn');
    browseFileBtn.addEventListener('click', async () => {
        try {
            const result = await ipcRenderer.invoke('select-md-file');
            if (result.success) {
                if (result.isFile && result.path.endsWith('.md')) {
                    // 用户选择了具体的.md文件
                    replaceSettings.targetFilePath = result.path;
                    // 获取文件所在目录作为保存路径
                    const pathSeparator = result.path.includes('/') ? '/' : '\\';
                    const pathParts = result.path.split(pathSeparator);
                    pathParts.pop(); // 移除文件名
                    replaceSettings.savePath = pathParts.join(pathSeparator);
                    savePathInput.value = result.path;
                    updateSettingStatus();
                } else {
                    alert('请选择有效的.md文件');
                }
            }
        } catch (error) {
            console.error('Error selecting md file:', error);
        }
    });
    
    // 选择文件夹按钮
    const browseFolderBtn = document.getElementById('browse-folder-btn');
    browseFolderBtn.addEventListener('click', async () => {
        try {
            const result = await ipcRenderer.invoke('select-folder');
            if (result.success) {
                if (result.isDirectory) {
                    // 用户选择了文件夹
                    replaceSettings.targetFilePath = '';
                    replaceSettings.savePath = result.path;
                    savePathInput.value = result.path;
                    updateSettingStatus();
                } else {
                    alert('请选择有效的文件夹');
                }
            }
        } catch (error) {
            console.error('Error selecting folder:', error);
        }
    });
    
    // 行数输入变化时更新状态
    lineNumberInput.addEventListener('input', updateSettingStatus);
    savePathInput.addEventListener('input', updateSettingStatus);
    
    // 更新设置状态显示
    function updateSettingStatus() {
        const lineNumber = parseInt(lineNumberInput.value) || 0;
        const savePath = savePathInput.value.trim();
        
        let statusText = '';
        if (lineNumber === 0) {
            statusText = '功能已禁用（行数为0）';
        } else if (!savePath) {
            statusText = `已设置触发行数为第${lineNumber}行，但未选择保存路径`;
        } else {
            if (replaceSettings.targetFilePath) {
                statusText = `功能已启用：第${lineNumber}行触发，保存到指定文件 ${replaceSettings.targetFilePath}`;
            } else {
                statusText = `功能已启用：第${lineNumber}行触发，保存到文件夹 ${savePath}（将自动生成.md文件）`;
            }
        }
        
        settingStatus.querySelector('.status-text').textContent = statusText;
    }
    
    // 保存设置
    saveBtn.addEventListener('click', () => {
        const lineNumber = parseInt(lineNumberInput.value) || 0;
        const savePath = savePathInput.value.trim();
        
        // 更新全局设置
        replaceSettings.triggerLine = lineNumber;
        replaceSettings.savePath = savePath;
        // targetFilePath 已经在浏览按钮事件中设置了
        replaceSettings.enabled = lineNumber > 0 && savePath !== '';
        
        console.log('Replace settings saved:', replaceSettings);
        
        // 如果功能启用，设置编辑器监听
        if (replaceSettings.enabled && currentEditor) {
            setupEditorLineListener();
        }
        
        closeModal();
    });
}

// 显示替换设置弹窗
function showReplaceModal() {
    const modal = document.getElementById('replace-modal-overlay');
    const lineNumberInput = document.getElementById('line-number-input');
    const savePathInput = document.getElementById('save-path-input');
    
    // 加载当前设置
    lineNumberInput.value = replaceSettings.triggerLine;
    savePathInput.value = replaceSettings.savePath;
    
    // 更新状态显示
    const updateStatus = () => {
        const lineNumber = parseInt(lineNumberInput.value) || 0;
        const savePath = savePathInput.value.trim();
        const settingStatus = document.getElementById('setting-status');
        
        let statusText = '';
        if (lineNumber === 0) {
            statusText = '功能已禁用（行数为0）';
        } else if (!savePath) {
            statusText = `已设置触发行数为第${lineNumber}行，但未选择保存路径`;
        } else {
            if (replaceSettings.targetFilePath) {
                statusText = `功能已启用：第${lineNumber}行触发，保存到指定文件 ${replaceSettings.targetFilePath}`;
            } else {
                statusText = `功能已启用：第${lineNumber}行触发，保存到文件夹 ${savePath}（将自动生成.md文件）`;
            }
        }
        
        settingStatus.querySelector('.status-text').textContent = statusText;
    };
    
    updateStatus();
    modal.style.display = 'flex';
}

// 设置编辑器行监听
function setupEditorLineListener() {
    if (!currentEditor || !replaceSettings.enabled) {
        return;
    }
    
    // 移除之前的监听器（如果存在）
    if (currentEditor._replaceKeyListener) {
        currentEditor._replaceKeyListener.dispose();
    }
    
    // 添加键盘事件监听
    currentEditor._replaceKeyListener = currentEditor.onKeyDown((e) => {
        // 检查是否按下回车键
        if (e.keyCode === 3) { // Enter key
            const position = currentEditor.getPosition();
            const currentLine = position.lineNumber;
            
            // 检查是否在目标行
            if (currentLine === replaceSettings.triggerLine) {
                // 获取当前行内容
                const lineContent = currentEditor.getModel().getLineContent(currentLine);
                
                if (lineContent.trim()) {
                    // 阻止默认的回车行为（防止光标跳到下一行）
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // 检查是否按下了Ctrl键（用于控制换行行为）
                    const addNewline = e.ctrlKey;
                    
                    // 保存内容到文件
                    saveLineContentToFile(lineContent, addNewline);
                    
                    // 清空当前行
                    const range = {
                        startLineNumber: currentLine,
                        startColumn: 1,
                        endLineNumber: currentLine,
                        endColumn: lineContent.length + 1
                    };
                    
                    currentEditor.executeEdits('replace-clear-line', [{
                        range: range,
                        text: ''
                    }]);
                    
                    // 将光标重新定位到当前行的开始位置
                    currentEditor.setPosition({
                        lineNumber: currentLine,
                        column: 1
                    });
                }
            }
        }
    });
}

// 保存行内容到文件
async function saveLineContentToFile(content, addNewline = false) {
    try {
        const result = await ipcRenderer.invoke('save-line-content', {
            content: content,
            savePath: replaceSettings.savePath,
            targetFilePath: replaceSettings.targetFilePath,
            addNewline: addNewline
        });
        
        if (result.success) {
            console.log('Line content saved successfully to:', result.filePath);
            // 如果是第一次保存到新生成的文件，更新targetFilePath
            if (!replaceSettings.targetFilePath && result.filePath) {
                replaceSettings.targetFilePath = result.filePath;
                console.log('Target file path updated to:', replaceSettings.targetFilePath);
            }
        } else {
            console.error('Failed to save line content:', result.error);
        }
    } catch (error) {
        console.error('Error saving line content:', error);
    }
}

// 创建新文件
function createNewFile() {
    const fileName = `Untitled-${Date.now()}`;
    const tabId = `file-${Date.now()}`;
    
    openTabs.set(tabId, {
        name: fileName,
        content: '',
        type: 'file',
        modified: false,
        language: 'plaintext'
    });
    
    createTab(tabId, fileName);
    switchToTab(tabId);
}

// 打开文件
async function openFile() {
    try {
        const result = await ipcRenderer.invoke('open-file-dialog');
        if (result.success) {
            openFileInEditor(result);
        }
    } catch (error) {
        console.error('Error opening file:', error);
    }
}

// 在编辑器中打开文件
function openFileInEditor(fileData) {
    // 检查文件是否已经打开
    for (const [tabId, tabData] of openTabs) {
        if (tabData.path === fileData.path) {
            switchToTab(tabId);
            return;
        }
    }
    
    const tabId = `file-${Date.now()}`;
    const language = getLanguageFromFileName(fileData.name);
    
    openTabs.set(tabId, {
        name: fileData.name,
        content: fileData.content,
        type: 'file',
        modified: false,
        language: language,
        path: fileData.path
    });
    
    createTab(tabId, fileData.name);
    switchToTab(tabId);
    
    // 设置编辑器内容和语言
    if (currentEditor) {
        try {
            console.log('Setting editor content for file:', fileData.name, 'Content length:', fileData.content.length);
            currentEditor.setValue(fileData.content || '');
            monaco.editor.setModelLanguage(currentEditor.getModel(), language);
            currentEditor.layout();
            
            // 更新状态栏
            updateStatusBar(openTabs.get(tabId));
        } catch (error) {
            console.error('Error setting editor content in openFileInEditor:', error);
        }
    } else {
        console.warn('Monaco editor not ready when trying to open file:', fileData.name);
    }
}

// 根据文件名获取语言类型
function getLanguageFromFileName(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const languageMap = {
        'js': 'javascript',
        'ts': 'typescript',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'cs': 'csharp',
        'php': 'php',
        'rb': 'ruby',
        'go': 'go',
        'rs': 'rust',
        'sql': 'sql',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'md': 'markdown',
        'txt': 'plaintext'
    };
    return languageMap[ext] || 'plaintext';
}

// 打开示例文件
function openSampleFile(fileId) {
    const sampleFiles = {
        welcome: {
            name: 'Welcome.md',
            content: '# 欢迎使用 VScoding Lite\n\n这是一个基于 Electron 构建的代码编辑器。\n\n## 功能特性\n\n- 🎨 VSCode 风格界面\n- 📝 代码语法高亮\n- 🚀 无需安装，点击即用\n- 💾 文件管理功能\n\n开始编写你的代码吧！\n\n---\n\n坏雷达研究所',
            language: 'markdown'
        },
        sample: {
            name: 'sample.js',
            content: '// JavaScript 示例代码\n\nfunction greetUser(name) {\n    console.log(`Hello, ${name}!`);\n    return `Welcome to VScoding Lite, ${name}!`;\n}\n\n// 调用函数\nconst message = greetUser("Developer");\nconsole.log(message);\n\n// 异步函数示例\nasync function fetchData() {\n    try {\n        const response = await fetch("https://api.example.com/data");\n        const data = await response.json();\n        return data;\n    } catch (error) {\n        console.error("Error fetching data:", error);\n    }\n}',
            language: 'javascript'
        },
        readme: {
            name: 'README.md',
            content: '# VScoding Lite\n\n一个轻量级的代码编辑器，模仿 Visual Studio Code 的外观和基本功能。\n\n## 技术栈\n\n- **Electron**: 跨平台桌面应用框架\n- **Monaco Editor**: 强大的代码编辑器\n- **HTML/CSS/JavaScript**: 前端技术\n\n## 功能特性\n\n### ✅ 已实现\n- VSCode 风格的用户界面\n- 文件标签管理\n- 基本的文件操作\n- 代码语法高亮\n- 自定义标题栏\n\n### 🚧 开发中\n- 文件夹管理\n- 搜索功能\n- 插件系统\n- 主题切换\n\n## 使用方法\n\n1. 下载应用程序\n2. 双击运行（无需安装）\n3. 开始编码！\n\n---\n\n**注意**: 这是一个演示项目，用于学习 Electron 开发。',
            language: 'markdown'
        }
    };
    
    const file = sampleFiles[fileId];
    if (file) {
        const tabId = `sample-${fileId}`;
        
        openTabs.set(tabId, {
            name: file.name,
            content: file.content,
            type: 'file',
            modified: false,
            language: file.language
        });
        
        createTab(tabId, file.name);
        switchToTab(tabId);
    }
}

// 创建标签
function createTab(tabId, fileName) {
    const existingTab = document.querySelector(`[data-tab="${tabId}"]`);
    if (existingTab) {
        return;
    }
    
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.dataset.tab = tabId;
    tab.innerHTML = `
        <span class="tab-label">${fileName}</span>
        <i class="fas fa-times tab-close"></i>
    `;
    
    elements.tabBar.appendChild(tab);
}

// 切换标签
function switchToTab(tabId) {
    // 更新标签状态
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const targetTab = document.querySelector(`[data-tab="${tabId}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    activeTab = tabId;
    const tabData = openTabs.get(tabId);
    
    if (tabData) {
        if (tabData.type === 'welcome') {
            showWelcomeScreen();
        } else {
            showEditor(tabData);
        }
        
        updateStatusBar(tabData);
    }
}

// 关闭标签
function closeTab(tabId) {
    const tab = document.querySelector(`[data-tab="${tabId}"]`);
    if (tab) {
        tab.remove();
    }
    
    openTabs.delete(tabId);
    
    // 如果关闭的是当前活动标签，切换到其他标签
    if (activeTab === tabId) {
        const remainingTabs = document.querySelectorAll('.tab');
        if (remainingTabs.length > 0) {
            const nextTabId = remainingTabs[0].dataset.tab;
            switchToTab(nextTabId);
        } else {
            // 如果没有其他标签，显示欢迎屏幕
            showWelcomeScreen();
        }
    }
}

// 显示欢迎屏幕
function showWelcomeScreen() {
    elements.welcomeScreen.style.display = 'block';
    elements.monacoEditor.style.display = 'none';
}

// 显示编辑器
function showEditor(tabData) {
    elements.welcomeScreen.style.display = 'none';
    elements.monacoEditor.style.display = 'block';
    
    if (currentEditor && tabData) {
        // 确保编辑器已经完全初始化
        setTimeout(() => {
            try {
                currentEditor.setValue(tabData.content || '');
                if (tabData.language) {
                    monaco.editor.setModelLanguage(currentEditor.getModel(), tabData.language);
                }
                // 强制刷新编辑器布局
                currentEditor.layout();
            } catch (error) {
                console.error('Error setting editor content:', error);
            }
        }, 100);
    } else if (!currentEditor) {
        // 如果编辑器还没有加载，等待加载完成后再设置内容
        const checkEditor = setInterval(() => {
            if (currentEditor) {
                clearInterval(checkEditor);
                showEditor(tabData);
            }
        }, 100);
    }
}

// 加载 Monaco Editor
async function loadMonacoEditor() {
    console.log('Loading Monaco Editor...');
    
    // 使用绝对路径加载，确保在任何工作目录下都能正常工作
    const path = require('path');
    // 获取应用根目录路径
    let appPath;
    try {
        // 尝试使用ipcRenderer获取应用路径
        appPath = await ipcRenderer.invoke('get-app-path');
    } catch (error) {
        // 如果失败，使用当前目录的上级目录
        appPath = path.dirname(__dirname);
    }
    const baseUrl = path.join(appPath, 'node_modules/monaco-editor/min/vs').replace(/\\/g, '/');
    const loaderPath = `${baseUrl}/loader.js`;
    const vsPath = baseUrl;
    
    console.log('Monaco paths:', { loaderPath, vsPath, appPath });
    
    const script = document.createElement('script');
    script.src = loaderPath;
    script.onload = () => {
        console.log('Monaco loader script loaded');
        require.config({ paths: { vs: vsPath } });
        require(['vs/editor/editor.main'], () => {
            console.log('Monaco editor main loaded, creating editor...');
            if (!elements.monacoEditor) {
                console.error('Monaco editor container not found!');
                return;
            }
            currentEditor = monaco.editor.create(elements.monacoEditor, {
                value: '',
                language: 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                lineNumbers: 'on',
                lineNumbersMinChars: 4,
                glyphMargin: true,
                folding: true,
                lineDecorationsWidth: 10,
                lineHeight: 20,
                roundedSelection: false,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                minimap: { 
                    enabled: true,
                    side: 'right',
                    showSlider: 'mouseover'
                },
                scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    useShadows: false,
                    verticalHasArrows: false,
                    horizontalHasArrows: false
                },
                renderLineHighlight: 'line',
                selectOnLineNumbers: true,
                cursorBlinking: 'blink',
                cursorSmoothCaretAnimation: true
            });
            
            console.log('Monaco editor created successfully:', currentEditor);
            
            // 监听编辑器变化
            currentEditor.onDidChangeModelContent(() => {
                const tabData = openTabs.get(activeTab);
                if (tabData && tabData.type !== 'welcome') {
                    tabData.modified = true;
                    tabData.content = currentEditor.getValue();
                    updateTabTitle(activeTab);
                }
            });
            
            // 监听光标位置变化
            currentEditor.onDidChangeCursorPosition((e) => {
                updateCursorPosition(e.position);
            });
            
            // 如果替换功能已启用，设置行监听器
            if (replaceSettings.enabled) {
                setupEditorLineListener();
            }
        });
    };
    document.head.appendChild(script);
}

// 更新标签标题
function updateTabTitle(tabId) {
    const tab = document.querySelector(`[data-tab="${tabId}"]`);
    const tabData = openTabs.get(tabId);
    
    if (tab && tabData) {
        const label = tab.querySelector('.tab-label');
        label.textContent = tabData.modified ? `● ${tabData.name}` : tabData.name;
    }
}

// 更新状态栏
function updateStatusBar(tabData) {
    if (elements.fileInfo) {
        elements.fileInfo.innerHTML = `<i class="fas fa-file"></i> ${tabData.name}`;
    }
    
    if (elements.languageMode) {
        elements.languageMode.textContent = tabData.language || 'Plain Text';
    }
}

// 更新光标位置
function updateCursorPosition(position) {
    if (elements.cursorPosition) {
        elements.cursorPosition.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
    }
}



// 保存当前文件
async function saveCurrentFile() {
    const tabData = openTabs.get(activeTab);
    if (tabData && tabData.type !== 'welcome' && currentEditor) {
        try {
            const fileData = {
                name: tabData.name,
                content: currentEditor.getValue(),
                path: tabData.path
            };
            
            const result = await ipcRenderer.invoke('save-file', fileData);
            if (result.success) {
                tabData.modified = false;
                tabData.path = result.path;
                if (result.name) {
                    tabData.name = result.name;
                }
                updateTabTitle(activeTab);
                updateStatusBar(tabData);
                console.log('File saved successfully:', result.path);
            } else {
                console.error('Failed to save file:', result.error);
            }
        } catch (error) {
            console.error('Error saving file:', error);
        }
    }
}

// 更新侧边栏内容
function updateSidebarContent(panel) {
    const sidebarTitle = document.querySelector('.sidebar-title');
    const panelNames = {
        explorer: 'EXPLORER',
        search: 'SEARCH',
        git: 'SOURCE CONTROL',
        debug: 'RUN AND DEBUG',
        extensions: 'EXTENSIONS'
    };
    
    sidebarTitle.textContent = panelNames[panel] || 'EXPLORER';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeApp);

// 导出一些函数供其他模块使用
window.vscodeClone = {
    createNewFile,
    openFile,
    saveCurrentFile,
    switchToTab,
    closeTab
};