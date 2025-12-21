# ETX输入工具 - Vue+Electron版本

## 项目概述

ETX输入工具是一个基于Electron和Vue 3开发的跨平台桌面应用程序，旨在提供便捷的远程文本输入功能。该应用程序通过全局快捷键唤醒，支持将文本快速发送到ETX环境，特别适用于需要频繁输入文本到特定应用场景的用户。

### 核心功能
- 全局快捷键监听（默认F2）快速唤醒输入窗口
- 置顶的透明输入窗口，自动定位到鼠标位置
- 智能文本剪贴板管理和自动粘贴功能
- 系统托盘集成和菜单操作
- 可自定义的快捷键和开机启动设置
- 支持浅色/深色主题切换
- 窗口透明度和尺寸可调节
- 跨平台支持（Windows、macOS、Linux）

### 技术架构
- **前端框架**: Vue 3 + HTML + CSS
- **桌面框架**: Electron 33.2.1
- **UI组件**: 自定义组件，采用Material Design风格
- **跨平台支持**: electron-builder打包工具
- **依赖库**: 
  - vue@3.5.13 (前端框架)
  - jimp@0.22.10 (图像处理)
  - @nut-tree/nut-js@3.1.2 (鼠标键盘控制)

## 项目结构

```
etx-electron/
├── main.js                  # Electron主进程，应用程序入口
├── preload.js               # 预加载脚本，提供安全的IPC通信
├── input.html               # 输入窗口界面（Vue 3应用）
├── settings.html            # 设置窗口界面（Vue 3应用）
├── keyboard.js              # 键盘模拟和文本发送模块
├── auto-paste.js            # 自动粘贴功能模块
├── mouse-control.js         # 鼠标控制模块
├── icon.js                  # 图标生成脚本
├── create-icon.js           # 图标创建脚本
├── create-simple-icon.js    # 简单图标创建脚本
├── download-icon.js         # 图标下载脚本
├── generate-tray-icon.js    # 托盘图标生成脚本
├── simple-icon.js           # 简单图标处理脚本
├── icon.png                 # 应用程序图标
├── package.json             # 项目配置和依赖
├── package-lock.json        # 依赖锁定文件
├── README.md                # 项目说明文档
├── IFLOW.md                 # 项目开发文档
├── start.sh                 # Linux/macOS启动脚本
├── start.bat                # Windows启动脚本
├── .gitignore               # Git忽略文件配置
├── query                    # 查询文件
├── robotjs-env/             # Python虚拟环境目录
└── dist/                    # 打包输出目录
```

## 构建和运行

### 开发环境
1. 安装依赖：
```bash
npm install
```

2. 开发模式运行：
```bash
npm run dev
```

3. 生产模式运行：
```bash
npm start
```

### 构建打包
1. 构建所有平台：
```bash
npm run build:all
```

2. 构建Windows版本：
```bash
npm run build:win
```

3. 构建macOS版本：
```bash
npm run build:mac
```

4. 通用构建命令：
```bash
npm run build
```

### 测试
项目目前没有配置测试框架，测试命令为：
```bash
npm test
```

## 开发约定

### 代码风格
- 使用ES6+语法
- 采用模块化开发模式
- Vue组件使用Composition API
- 代码注释使用中文，面向中文开发者
- 使用contextBridge确保主进程和渲染进程的安全通信

### 文件命名
- JavaScript文件使用小写字母和连字符（kebab-case）
- HTML文件使用小写字母和连字符
- 配置文件使用标准命名（package.json等）
- 图标相关脚本使用描述性命名

### 目录结构约定
- 主进程文件放在根目录
- 界面文件（HTML）放在根目录
- 工具模块按功能分类，命名明确
- 资源文件（图标等）放在根目录
- 构建输出放在dist目录

### IPC通信约定
- 使用contextBridge确保安全性
- 主进程和渲染进程通信通过ipcMain和ipcRenderer
- API命名采用驼峰命名法
- 错误处理统一使用try-catch
- 暴露的API包括：getConfig, saveConfig, sendText, hideInputWindow, openSettings, onThemeUpdated, onClearInput

### 平台兼容性
- Windows和Linux使用无边框透明窗口
- macOS使用原生标题栏
- 不同平台的托盘图标尺寸自动适配
- 开机启动功能适配不同平台的设置方式
- 配置文件统一存储在用户主目录的.etxtool文件夹中

## 核心模块说明

### 键盘模拟模块 (keyboard.js)
- 提供文本发送到ETX的核心功能
- 支持中文字符检测和处理
- 集成自动粘贴功能
- 剪贴板内容保护和恢复
- 使用正则表达式检测中文字符：`/[\u4e00-\u9fff]/`

### 自动粘贴模块 (auto-paste.js)
- 智能剪贴板管理
- 多次验证确保文本正确写入
- 支持鼠标点击粘贴操作
- 完善的错误处理和重试机制
- 增加延迟确保剪贴板操作完成（300ms延迟）

### 鼠标控制模块 (mouse-control.js)
- 基于@nut-tree/nut-js库实现
- 支持左键和中键点击
- 可配置的鼠标移动速度（设置为1000）
- 跨平台兼容的鼠标操作
- 使用nut.js的Point、Button、Key等API

### 图标管理模块
- icon.js: 主图标生成脚本
- create-icon.js: 图标创建功能
- generate-tray-icon.js: 托盘图标生成
- download-icon.js: 图标下载功能
- simple-icon.js: 简单图标处理
- create-simple-icon.js: 简单图标创建
- 支持多尺寸和多格式图标生成

## 开发注意事项

1. **安全性**: 使用contextBridge隔离主进程和渲染进程，避免直接暴露Node.js API
2. **跨平台兼容**: 注意不同平台的窗口行为和系统API差异
3. **资源管理**: 及时释放窗口资源，避免内存泄漏
4. **用户体验**: 窗口定位要考虑屏幕边界，确保完全可见
5. **配置管理**: 用户配置存储在用户主目录的.etxtool文件夹中
6. **依赖管理**: 注意@nut-tree/nut-js库的平台兼容性要求
7. **剪贴板操作**: 使用适当的延迟确保剪贴板操作完成
8. **Vue集成**: 使用CDN方式引入Vue 3，通过Vue.createApp创建应用实例

## 扩展开发

### 添加新功能
1. 在主进程（main.js）中添加IPC处理程序
2. 在preload.js中暴露安全的API
3. 在Vue组件中调用API实现功能
4. 更新配置文件结构（如需要）

### 修改UI界面
1. 编辑对应的HTML文件（input.html或settings.html）
2. 使用Vue 3的响应式数据管理状态
3. 遵循现有的CSS样式约定
4. 确保跨平台兼容性

### 调试技巧
1. 使用`--dev`参数启动开发模式
2. 查看控制台输出进行调试
3. 使用Electron DevTools检查界面元素
4. 检查配置文件内容确认设置保存状态
5. 监控剪贴板操作和鼠标控制日志
6. 检查IPC通信是否正常

## 构建配置

### electron-builder配置
- 应用ID: com.etx.input-tool
- 产品名称: ETX输入工具
- 输出目录: dist
- Windows目标: NSIS安装程序
- macOS目标: DMG磁盘映像
- NSIS配置：
  - oneClick: false（允许自定义安装目录）
  - allowToChangeInstallationDirectory: true
  - createDesktopShortcut: true
  - createStartMenuShortcut: true
- 图标文件: icon.png
- macOS分类: public.app-category.productivity

## 版本信息

- 当前版本: 1.0.0
- Electron版本: 33.2.1
- Vue版本: 3.5.13
- 构建工具: electron-builder 25.1.8
- 主要依赖:
  - @nut-tree/nut-js: 3.1.2
  - jimp: 0.22.10
  - vue: 3.5.13

## 项目特色

### 现代化UI设计
- 采用毛玻璃效果和渐变背景
- Material Design风格的界面元素
- 支持浅色/深色主题动态切换
- 圆角设计和阴影效果

### 高效的文本输入
- 智能剪贴板管理，保护原有内容
- 多重验证机制确保文本正确传输
- 支持中文字符的特殊处理
- 自动粘贴功能，提升输入效率

### 跨平台兼容性
- 统一的代码基础，适配不同操作系统
- 平台特定的功能适配（托盘、开机启动等）
- 灵活的窗口管理策略
- 完善的错误处理机制