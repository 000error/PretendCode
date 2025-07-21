# 🕶️ VScoding Lite -假装在写代码： 打工人的隐蔽写作助手

一个专为**打工人**设计的摸鱼写作神器！

## 💼 这是什么软件？

外观完全模仿 VSCode，让你在办公室里看起来像在认真写代码，实际上编辑器里暗藏机关。你可以在特殊行里写自己的私人内容，并可以实时保存到本地.md文件中。

## 🎭 核心功能：伪装模式

### 表面功能
- ✅ 真实的代码编辑器界面
- ✅ 可以正常编辑和查看任何文件
- ✅ 完全像 VSCode 的外观和操作
- ✅ 同事路过时毫无破绽

### 隐藏功能
这就是软件的精髓所在！

**🔧 工作原理：**
1. **设置隐蔽行**：你可以指定某一行（比如第10行）作为"隐蔽区域"
2. **正常编码**：在其他行正常写工作代码，正常显示你写的代码
3. **偷偷记录**：在指定行写你的私人内容（吐槽老板、记录想法、写日记等）
4. **一键隐藏**：有人来了？按个回车键，私人内容瞬间消失并保存到本地
5. **完美伪装**：屏幕上只剩下正常的工作代码

**📋 具体使用方法：**
将整个压缩包（dist-portable-fixed）复制粘贴到本地即可。

## 快速启动
1. 解压到任意目录
2. 双击 dist-portable-fixed\win-unpacked\VScoding Lite.exe 运行
3. 无需安装，即开即用

#### 第一步：激活隐蔽模式
1. 启动 VScoding Lite 应用。直接双击文件夹内的 dist-final-fixed\VScoding Lite-win32-x64\VScoding Lite.exe，打开软件。
2. 新建或打开一个代码文件（建议使用 `.js`、`.py`、`.cpp` 等常见格式）
3. 点击菜单栏中的 **Edit** 按钮
4. 在下拉菜单中选择 **替换** 选项
5. 在弹出的替换设置弹窗中配置：
   - **触发行数**：设置在第几行按回车键时触发隐藏功能（推荐第8-15行,更具隐蔽性）
   - **保存路径**：选择内容保存位置（可选择具体.md文件或文件夹）
6. 点击"保存设置"完成功能激活

#### 第二步：开始隐蔽写作
1. **定位到隐蔽行**：光标放到你设置的隐蔽行上（比如第10行）
2. **写入私人内容**：在该行输入你的私人内容，格式如下：
   ```javascript
   // 今天老板又在会议上瞎指挥，完全不懂技术还要装专家...
   ```
3. **触发保存**：随时在该行按下回车键，内容会自动保存到指定位置并清空当前行
4. **换行保存**：按 `Ctrl+回车` 可以在保存时添加换行符


**💡 使用技巧：**
- 当有同事或领导靠近时，快速执行回车操作
- 隐蔽内容建议写成注释格式，更加自然
- 熟练掌握回车键操作，确保紧急情况下快速隐藏
- 定期检查保存的文件，管理隐蔽内容
- 可以选择不同的保存路径，分类管理不同内容


## 🎯 项目特色

- 🎨 **VSCode 风格界面** - 完全模仿 VSCode 的深色主题和布局
- 🚀 **便携式运行** - 无需安装，无需管理员权限，下载即用
- 📝 **代码编辑** - 集成 Monaco Editor，支持语法高亮
- 🗂️ **文件管理** - 支持文件打开、新建、保存等基本操作
- ⚡ **轻量快速** - 启动迅速，占用资源少

## 🛠️ 技术栈

- **Electron** - 跨平台桌面应用框架
- **Monaco Editor** - 微软开源的代码编辑器（VSCode 同款）
- **HTML/CSS/JavaScript** - 前端技术栈
- **Node.js** - 后端运行环境
  


## 📁 项目结构

```
disguise_writing/
├── main.js                      # Electron 主进程
├── index.html                   # 主页面
├── package.json                 # 项目配置
├── README.md                    # 项目说明
├── 使用说明.txt                 # 用户使用说明
├── assets/                      # 资源文件
│   └── icon.svg                 # 应用图标
├── styles/                      # 样式文件
│   └── main.css                 # 主样式
├── scripts/                     # 脚本文件
│   ├── main.js                  # 主脚本
│   ├── font-fallback.js         # 字体回退脚本
│   └── window-controls-fix.js   # 窗口控制按钮修复脚本
├── fonts/                       # 字体文件
│   ├── fontawesome-local.css    # 本地化Font Awesome样式
│   └── ui-icons.css             # UI图标样式
└── dist-portable-fixed/         # 最终打包结果
    ├── VScoding Lite 1.0.0.exe  # 便携版可执行文件
    ├── win-unpacked/            # 解包后的应用文件
    ├── 使用说明.txt             # 使用说明文档
    └── 字体修复技术说明.md      # 技术说明文档
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Visual Studio Code](https://code.visualstudio.com/) - 界面设计灵感
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器核心
- [Electron](https://www.electronjs.org/) - 跨平台应用框架
- [Font Awesome](https://fontawesome.com/) - 图标库

---

**注意**: 这是一个学习项目，用于演示 Electron 应用开发。如需生产环境使用，请进行充分测试。