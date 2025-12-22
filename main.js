const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const activeWin = require('active-win');

// 导入键盘模拟模块
const { sendTextToETX } = require('./keyboard.js');

// 保持对窗口对象的全局引用
let inputWindow = null;
let settingsWindow = null;
let tray = null;
let isDev = process.argv.includes('--dev');

// 存储上次鼠标位置
let lastCursorPosition = null;

// 存储目标窗口的进程ID（用于Windows平台激活窗口）
let targetWindowProcessId = null;

// 配置文件路径
const configPath = path.join(os.homedir(), '.etxtool', 'config.json');

// 默认配置
let config = {
  hotkey: 'F2',
  autostart: false,
  opacity: 80,
  theme: 'light',
  windowHeight: 120,
  windowWidth: 600,
  pasteMethod: 'ctrlShiftV', // 默认使用Ctrl+Shift+V粘贴
  restoreClipboard: false // 默认不恢复剪贴板
};

// 历史记录配置
const historyPath = path.join(os.homedir(), '.etxtool', 'history.json');
const maxHistoryItems = 100; // 最多保存100条历史记录
let inputHistory = [];

// 加载配置
function loadConfig() {
  try {
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      config = { ...config, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('加载配置失败:', error);
  }
}

// 保存配置
function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('保存配置失败:', error);
  }
}

// 加载历史记录
function loadHistory() {
  try {
    const configDir = path.dirname(historyPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf8');
      inputHistory = JSON.parse(data);
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
    inputHistory = [];
  }
}

// 保存历史记录
function saveHistory() {
  try {
    fs.writeFileSync(historyPath, JSON.stringify(inputHistory, null, 2));
  } catch (error) {
    console.error('保存历史记录失败:', error);
  }
}

// 添加历史记录
function addToHistory(text) {
  if (!text || !text.trim()) return;
  
  const trimmedText = text.trim();
  
  // 移除重复项（如果已存在）
  inputHistory = inputHistory.filter(item => item !== trimmedText);
  
  // 添加到开头
  inputHistory.unshift(trimmedText);
  
  // 限制历史记录数量
  if (inputHistory.length > maxHistoryItems) {
    inputHistory = inputHistory.slice(0, maxHistoryItems);
  }
  
  // 立即保存到文件
  saveHistory();
  
  console.log('历史记录已实时保存:', trimmedText);
}

// 创建输入窗口
async function createInputWindow() {
  // 在Windows平台，显示输入窗口前先获取当前活动窗口的PID
  if (process.platform === 'win32') {
    try {
      const activeWindow = await activeWin();
      if (activeWindow && activeWindow.owner.processId) {
        targetWindowProcessId = activeWindow.owner.processId;
        console.log('保存目标窗口进程ID:', targetWindowProcessId);
      }
    } catch (error) {
      console.error('获取目标窗口PID失败:', error);
      targetWindowProcessId = null;
    }
  }

  if (inputWindow) {
    positionWindowAtCursor();
  // 延迟一丁点时间再显示，给 OS 响应坐标变更的时间
  setTimeout(() => {
    if (inputWindow && !inputWindow.isDestroyed()) {
      console.log('输入窗口已存在，显示并聚焦');
      inputWindow.show();
      inputWindow.focus();
      inputWindow.webContents.send('history-reload');
    }
  }, 100);
    
    return;
  }

  // 根据平台调整窗口设置
  const windowOptions = {
    width: parseInt(config.windowWidth) || 600,
    height: parseInt(config.windowHeight) || 120,
    alwaysOnTop: true,
    skipTaskbar: true,
    animate: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  };

  // 所有平台都使用无边框透明窗口
  windowOptions.frame = false;
  windowOptions.transparent = true;
  windowOptions.roundedCorners = true;
  // 应用透明度设置
  windowOptions.opacity = Math.max(config.opacity / 100, 0.5);
  
  // macOS特殊设置，确保在全屏应用上方显示但不遮挡输入法
  if (process.platform === 'darwin') {
    windowOptions.alwaysOnTop = true;
    windowOptions.skipTaskbar = true;
    windowOptions.floating = true;
    windowOptions.hasShadow = false;
    // 使用正常层级而不是最高层级，避免遮挡输入法候选栏
    windowOptions.level = 'floating';
  }

  inputWindow = new BrowserWindow(windowOptions);

  inputWindow.loadFile('input.html');
  
  // 开发模式下打开开发者工具
  if (isDev) {
    inputWindow.webContents.openDevTools();
  }

  inputWindow.on('closed', () => {
    inputWindow = null;
  });

  // 窗口失焦时隐藏（除了macOS，因为macOS有不同的窗口行为）
  if (process.platform !== 'darwin') {
    // 窗口失焦时隐藏（除了macOS，因为macOS有不同的窗口行为）
    if (process.platform !== 'darwin') {
      inputWindow.on('blur', () => {
        if (inputWindow && !inputWindow.isDestroyed()) {
          inputWindow.hide();
        }
      });
    }
  }

  // 窗口准备好后定位到鼠标位置
  inputWindow.once('ready-to-show', () => {
    // 先显示窗口，然后定位
    // inputWindow.show();
    positionWindowAtCursor();
    // macOS特殊处理：立即设置窗口层级但不遮挡输入法
    if (process.platform === 'darwin') {
      inputWindow.setAlwaysOnTop(true, 'floating');
    }
   
    // setTimeout(() => {
    //   inputWindow.show();
    //   inputWindow.webContents.send('history-reload');
    // }, 100); // 延迟100ms确保窗口完全准备好
  });
}

// 创建设置窗口
function createSettingsWindow() {
  console.log('开始创建设置窗口');
  
  if (settingsWindow) {
    console.log('设置窗口已存在，显示并聚焦');
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  console.log('创建新的设置窗口');
  try {
    settingsWindow = new BrowserWindow({
      width: 500,
      height: 700,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    console.log('设置窗口创建成功，加载HTML文件');
    settingsWindow.loadFile('settings.html');
    
    // 开发模式下打开开发者工具
    if (isDev) {
      settingsWindow.webContents.openDevTools();
    }

    settingsWindow.on('closed', () => {
      console.log('设置窗口已关闭');
      settingsWindow = null;
    });
    
    console.log('设置窗口初始化完成');
  } catch (error) {
    console.error('创建设置窗口时发生错误:', error);
  }
}

// 将窗口定位到鼠标位置附近
function positionWindowAtCursor() {
  if (!inputWindow || inputWindow.isDestroyed()) return;
  
  try {
    
      const { screen } = require('electron');
      const cursorPosition = screen.getCursorScreenPoint();
      const currentScreen = screen.getDisplayNearestPoint(cursorPosition);
      const { width, height } = inputWindow.getBounds();
      const { workArea } = currentScreen;
    
    
    // 计算窗口位置（优先显示在鼠标右下方）
    let x = cursorPosition.x + 20;
    let y = cursorPosition.y + 20;
    
    // 确保窗口不超出屏幕边界
    console.log('屏幕工作区域:', workArea);
    
    // macOS特殊处理：为输入法候选框预留空间
    let imeCandidateHeight = 0;
    if (process.platform === 'darwin') {
      // 为输入法候选框预留150像素的高度
      imeCandidateHeight = 150;
    }
    
    // 处理右边界 - 如果超出则显示在左侧
    if (x + width > workArea.x + workArea.width) {
      x = cursorPosition.x - width - 20;
      // 如果左侧也不够空间，则靠右对齐
      if (x < workArea.x) {
        x = workArea.x + workArea.width - width - 10;
      }
    }
    
    // 处理下边界 - 如果超出则显示在上方，考虑输入法候选框高度
    if (y + height + imeCandidateHeight > workArea.y + workArea.height) {
      y = cursorPosition.y - height - 20;
      // 如果上方也不够空间，则靠下对齐，但要为输入法候选框留空间
      if (y < workArea.y) {
        y = workArea.y + workArea.height - height - imeCandidateHeight - 10;
      }
    }
    
    // 处理左边界
    if (x < workArea.x) {
      x = workArea.x + 10;
    }
    
    // 处理上边界
    if (y < workArea.y) {
      y = workArea.y + 10;
    }
    
    // 设置窗口位置并确保窗口可见
    inputWindow.setPosition(Math.floor(x), Math.floor(y), false);
    
    // // macOS特殊处理：确保窗口在最前面但不遮挡输入法
    // if (process.platform === 'darwin') {
    //   // 设置窗口层级，避免遮挡输入法候选栏
    //   inputWindow.setAlwaysOnTop(true, 'floating');
    // }
    
    // // 确保窗口显示并聚焦
    // if (!inputWindow.isVisible()) {
    //   inputWindow.show();
    //   inputWindow.focus();
    // }
    
    // // 确保窗口聚焦但不改变位置
    // setTimeout(() => {
    //   if (inputWindow && !inputWindow.isDestroyed()) {
    //     inputWindow.focus();
    //     // macOS上再次确保窗口层级正确但不遮挡输入法
    //     if (process.platform === 'darwin') {
    //       inputWindow.setAlwaysOnTop(true, 'floating');
    //     }
    //   }
    // }, 10);
    
    // console.log(`窗口定位到: ${Math.floor(x)}, ${Math.floor(y)}`);
    // console.log(`窗口大小: ${width}x${height}`);
    // if (process.platform === 'darwin') {
    //   console.log(`为输入法候选框预留了 ${imeCandidateHeight} 像素高度`);
    // }
  } catch (error) {
    console.error('定位窗口失败:', error);
  }
}

// 创建系统托盘
function createTray() {
  // 如果已经存在托盘，先销毁
  if (tray) {
    tray.destroy();
  }

  try {
    console.log('开始创建系统托盘...');
    
    // 使用icon.png作为托盘图标
    const iconPath = path.join(__dirname, 'icon.png');
    let trayIcon;
    
    if (fs.existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath);
      console.log('使用icon.png作为托盘图标');
      
      // 调整图标尺寸以适应系统托盘
      if (process.platform === 'win32') {
        trayIcon = trayIcon.resize({ width: 32, height: 32 });
      } else if (process.platform === 'darwin') {
        trayIcon = trayIcon.resize({ width: 22, height: 22 });
        trayIcon.setTemplateImage(true);
      } else {
        trayIcon = trayIcon.resize({ width: 32, height: 32 });
      }
    } else {
      console.log('图标文件不存在，创建默认图标');
      const iconSize = 32;
      const iconData = Buffer.alloc(iconSize * iconSize * 4); // RGBA
      
      // 填充蓝色背景
      for (let i = 0; i < iconData.length; i += 4) {
        iconData[i] = 30;     // R
        iconData[i + 1] = 144; // G
        iconData[i + 2] = 255; // B
        iconData[i + 3] = 255; // A
      }
      
      trayIcon = nativeImage.createFromBuffer(iconData, { width: iconSize, height: iconSize });
    }

    // 创建托盘实例
    tray = new Tray(trayIcon);
    console.log('托盘实例创建成功');

    // 创建简单的上下文菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `显示输入窗口 (${config.hotkey})`,
        click: () => {
          createInputWindow();
        }
      },
      {
        label: '设置',
        click: () => {
          createSettingsWindow();
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.quit();
        }
      }
    ]);

    tray.setToolTip('ETX输入工具');
    
    // 设置上下文菜单
    tray.setContextMenu(contextMenu);
    console.log('托盘上下文菜单已设置');
    
    // 为所有平台添加事件监听
    tray.on('click', () => {
      console.log('托盘左键点击');
      createInputWindow();
    });
    
    tray.on('right-click', (event, bounds) => {
      console.log('托盘右键点击');
      // 在某些情况下手动弹出菜单
      if (process.platform !== 'win32') {
        tray.popUpContextMenu(contextMenu);
      }
    });
    
    console.log('系统托盘创建成功');
  } catch (error) {
    console.error('创建系统托盘失败:', error);
  }
}

// 更新托盘菜单
function updateTrayMenu() {
  if (!tray || tray.isDestroyed()) {
    createTray();
    return;
  }

  try {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `显示输入窗口 (${config.hotkey})`,
        click: () => {
          createInputWindow();
        }
      },
      {
        label: '设置',
        click: () => {
          createSettingsWindow();
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    console.log('托盘菜单已更新');
  } catch (error) {
    console.error('更新托盘菜单失败:', error);
  }
}

// 创建默认图标
function createDefaultIcon() {
  // 使用Electron的nativeImage创建一个简单的蓝色图标
  const iconSize = 64;
  const iconData = Buffer.alloc(iconSize * iconSize * 4); // RGBA
  
  // 填充蓝色背景
  for (let i = 0; i < iconData.length; i += 4) {
    iconData[i] = 30;     // R
    iconData[i + 1] = 144; // G
    iconData[i + 2] = 255; // B
    iconData[i + 3] = 255; // A
  }
  
  return nativeImage.createFromBuffer(iconData, { width: iconSize, height: iconSize });
}

// 设置开机启动
function setAutoStart(enable) {
  if (process.platform === 'win32') {
    // Windows平台设置
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath,
      args: []
    });
  } else if (process.platform === 'darwin') {
    // macOS平台设置
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: true,
      path: process.execPath,
      args: []
    });
  } else {
    // Linux平台设置
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath,
      args: []
    });
  }
  
  console.log(`开机启动已${enable ? '启用' : '禁用'} (${process.platform})`);
}

// 注册全局快捷键
function registerGlobalShortcut() {
  // 先注销之前的快捷键
  globalShortcut.unregisterAll();
  
  // 注册新的快捷键
  const ret = globalShortcut.register(config.hotkey, () => {
    console.log('快捷键被触发');
    createInputWindow();
  });

  if (!ret) {
    console.error('快捷键注册失败');
  } else {
    console.log(`快捷键 ${config.hotkey} 注册成功`);
  }
  
  
}

// IPC 处理程序
ipcMain.handle('get-config', () => {
  return config;
});

ipcMain.handle('save-config', (event, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig();
  registerGlobalShortcut();
  
  // 更新托盘菜单以显示新的快捷键
  updateTrayMenu();
  
  // 如果输入窗口存在，更新透明度，确保最低透明度为50%
  if (inputWindow && !inputWindow.isDestroyed()) {
    inputWindow.setOpacity(Math.max(config.opacity / 100, 0.5));
  }
  
  // 如果输入窗口存在，更新窗口大小
  if (inputWindow && !inputWindow.isDestroyed()) {
    const width = parseInt(config.windowWidth) || 600;
    const height = parseInt(config.windowHeight) || 120;
    inputWindow.setSize(width, height, true);
  }
  
  // 如果输入窗口存在，通知主题更新
  if (inputWindow && !inputWindow.isDestroyed()) {
    inputWindow.webContents.send('theme-updated', config.theme);
  }
  
  return config;
});

ipcMain.handle('send-text', async (event, { text, pasteMethod }) => {
  // 实现发送文本到ETX的功能
  console.log('发送文本:', text, '粘贴方式:', pasteMethod || config.pasteMethod);
  
  // 如果没有传入粘贴方式参数，则使用配置中的默认值
  const method = pasteMethod || config.pasteMethod;
  
  try {
    // 添加到历史记录
    addToHistory(text);
    
    // 通知渲染进程重新加载历史记录
    if (inputWindow && !inputWindow.isDestroyed()) {
      inputWindow.webContents.send('history-reload');
      inputWindow.webContents.send('clear-input');
    }

    await sendTextToETX(text, method, config.restoreClipboard, targetWindowProcessId);
    
    // 隐藏输入窗口
    if (inputWindow && !inputWindow.isDestroyed()) {
      inputWindow.hide();
    }
  } catch (error) {
    console.error('发送文本失败:', error);
  }
});

// 历史记录相关的IPC处理
ipcMain.handle('get-history', () => {
  return inputHistory;
});

ipcMain.handle('add-to-history', (event, text) => {
  addToHistory(text);
});

ipcMain.handle('hide-input-window', () => {
  if (inputWindow && !inputWindow.isDestroyed()) {
    inputWindow.hide();
  }
});

ipcMain.handle('open-settings', () => {
  createSettingsWindow();
});



// 应用程序就绪时
app.whenReady().then(() => {
  loadConfig();
  loadHistory(); // 加载历史记录
  createTray();
  registerGlobalShortcut();
  
  // 设置开机启动
  setAutoStart(config.autostart);
});

// 所有窗口关闭时
app.on('window-all-closed', () => {
  // 如果有系统托盘，不退出应用程序
  // 这样用户可以通过系统托盘重新打开窗口
  if (tray && !tray.isDestroyed()) {
    console.log('所有窗口已关闭，但系统托盘仍在运行，应用程序保持活跃');
  } else {
    // 在 macOS 上，应用程序通常会保持活跃状态
    // 在其他平台上，如果没有窗口打开且没有托盘，则退出应用程序
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});

// 应用程序激活时
app.on('activate', () => {
  // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
  // 通常会重新创建一个窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createInputWindow();
  }
});

// 应用程序即将退出时
app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll();
});

// 防止多个实例运行
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 当运行第二个实例时，将会聚焦到主窗口
    if (inputWindow) {
      if (inputWindow.isMinimized()) inputWindow.restore();
      inputWindow.focus();
    }
  });
}