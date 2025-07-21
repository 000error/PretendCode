const { app, BrowserWindow, Menu, ipcMain, dialog, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

let mainWindow;

// 禁用硬件加速以提高兼容性
app.disableHardwareAcceleration();

// 设置兼容性选项（修复字体显示问题）
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-ipc-flooding-protection');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('no-first-run');
app.commandLine.appendSwitch('disable-default-apps');
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('disable-plugins');
// 字体渲染优化
app.commandLine.appendSwitch('force-color-profile', 'srgb');
app.commandLine.appendSwitch('disable-lcd-text');
app.commandLine.appendSwitch('disable-font-subpixel-positioning');
app.commandLine.appendSwitch('enable-font-antialiasing');
app.commandLine.appendSwitch('disable-direct-write');
app.commandLine.appendSwitch('disable-directwrite-for-ui');
// DPI和缩放设置
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('disable-pinch');

// 设置应用用户模型ID（Windows）
if (process.platform === 'win32') {
  app.setAppUserModelId('com.example.vscoding-lite');
}

// 注册自定义协议
protocol.registerSchemesAsPrivileged([
  { scheme: 'app-asset', privileges: { standard: true, supportFetchAPI: true, bypassCSP: true } }
]);

app.whenReady().then(() => {
  protocol.handle('app-asset', (request) => {
    const parsedUrl = new url.URL(request.url);
    let filePath;
    if (parsedUrl.pathname.startsWith('/node_modules/')) {
      const relativePath = parsedUrl.pathname.replace('/node_modules/', '');
      filePath = require.resolve(relativePath);
    } else {
      // 移除前导斜杠，但保留app/前缀用于应用资源
      const relativePath = parsedUrl.pathname.replace(/^\/+/, '');
      if (relativePath.startsWith('app/')) {
        // 对于app/开头的路径，移除app/前缀
        const appRelativePath = relativePath.replace(/^app\//, '');
        filePath = path.join(app.getAppPath(), appRelativePath);
      } else {
        filePath = path.join(app.getAppPath(), relativePath);
      }
    }
    return net.fetch(url.pathToFileURL(filePath).toString(), { bypassCustomProtocolHandlers: true });
  });
});

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      enableBlinkFeatures: 'CSSColorSchemeUARendering',
      disableBlinkFeatures: 'Auxclick'
    },
    titleBarStyle: 'hidden', // 隐藏默认标题栏以模拟VSCode
    frame: false, // 无边框窗口
    show: false, // 先不显示，等加载完成后再显示
    backgroundColor: '#1e1e1e', // 设置背景色避免白屏
    thickFrame: false, // 禁用厚边框
    hasShadow: true, // 保持窗口阴影
    skipTaskbar: false, // 显示在任务栏
    resizable: true, // 允许调整大小
    maximizable: true, // 允许最大化
    minimizable: true, // 允许最小化
    closable: true // 允许关闭
  });

  // 加载应用的 index.html
  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 打开开发者工具（开发模式）
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // 当窗口被关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 设置菜单
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-file');
          }
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'All Files', extensions: ['*'] },
                { name: 'Text Files', extensions: ['txt', 'md', 'js', 'html', 'css', 'json'] }
              ]
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              try {
                const content = fs.readFileSync(filePath, 'utf8');
                mainWindow.webContents.send('file-opened', {
                  path: filePath,
                  name: path.basename(filePath),
                  content: content
                });
              } catch (error) {
                console.error('Error reading file:', error);
              }
            }
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-file');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC 事件处理
ipcMain.handle('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow.close();
});

// 获取应用路径 IPC 处理
ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

// 文件操作 IPC 处理
ipcMain.handle('save-file', async (event, fileData) => {
  try {
    if (fileData.path) {
      // 保存到现有路径
      fs.writeFileSync(fileData.path, fileData.content, 'utf8');
      return { success: true, path: fileData.path };
    } else {
      // 另存为新文件
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: fileData.name,
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Text Files', extensions: ['txt', 'md'] },
          { name: 'JavaScript', extensions: ['js'] },
          { name: 'HTML', extensions: ['html'] },
          { name: 'CSS', extensions: ['css'] },
          { name: 'JSON', extensions: ['json'] }
        ]
      });
      
      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, fileData.content, 'utf8');
        return { 
          success: true, 
          path: result.filePath,
          name: path.basename(result.filePath)
        };
      }
    }
    return { success: false };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-file-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt', 'md', 'js', 'html', 'css', 'json', 'py', 'java', 'cpp', 'c'] }
      ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const content = fs.readFileSync(filePath, 'utf8');
      return {
        success: true,
        path: filePath,
        name: path.basename(filePath),
        content: content
      };
    }
    return { success: false };
  } catch (error) {
    console.error('Error opening file:', error);
    return { success: false, error: error.message };
  }
});

// 选择.md文件 IPC 处理
ipcMain.handle('select-md-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择已有的.md文件',
      defaultPath: process.cwd(),
      properties: ['openFile', 'showHiddenFiles'],
      filters: [
        { name: 'Markdown Files (*.md)', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      const stats = fs.statSync(selectedPath);
      return {
        success: true,
        path: selectedPath,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error('Error selecting md file:', error);
    return { success: false, error: error.message };
  }
});

// 选择文件夹 IPC 处理
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择保存文件夹',
      defaultPath: process.cwd(),
      properties: ['openDirectory', 'showHiddenFiles']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      const stats = fs.statSync(selectedPath);
      return {
        success: true,
        path: selectedPath,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error('Error selecting folder:', error);
    return { success: false, error: error.message };
  }
});

// 保存行内容到文件 IPC 处理
ipcMain.handle('save-line-content', async (event, data) => {
  try {
    const { content, savePath, targetFilePath, addNewline = false } = data;
    let filePath;
    
    if (targetFilePath) {
      // 如果指定了目标文件路径，直接使用
      filePath = targetFilePath;
    } else {
      // 如果只有目录路径，生成新的.md文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `saved-content-${timestamp}.md`;
      filePath = path.join(savePath, fileName);
    }
    
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 如果文件已存在，追加内容；否则创建新文件
    let fileContent = '';
    if (fs.existsSync(filePath)) {
      fileContent = fs.readFileSync(filePath, 'utf8');
    } else {
      fileContent = `# 保存的内容\n\n创建时间: ${new Date().toLocaleString()}\n\n`;
    }
    
    // 添加内容，根据addNewline参数决定换行行为
    if (addNewline) {
      // Ctrl+Enter: 添加换行和额外空行用于段落分隔
      if (fileContent.length > 0 && !fileContent.endsWith('\n')) {
        fileContent += '\n';
      }
      fileContent += content + '\n\n';
    } else {
      // Enter: 直接紧跟上次内容后面
      fileContent += content;
    }
    
    fs.writeFileSync(filePath, fileContent, 'utf8');
    
    return {
      success: true,
      filePath: filePath
    };
  } catch (error) {
    console.error('Error saving line content:', error);
    return { success: false, error: error.message };
  }
});

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});