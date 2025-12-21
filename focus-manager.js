// 跨平台焦点管理模块 - 使用npm的active-win和系统原生命令
const activeWin = require('active-win');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const execAsync = promisify(exec);

// 获取当前活动窗口信息
async function getActiveWindowInfo() {
  try {
    console.log(`[${new Date().toISOString()}] 开始获取活动窗口信息，平台: ${process.platform}`);
    
    const activeWindow = await activeWin();
    
    if (!activeWindow) {
      console.warn(`[${new Date().toISOString()}] 未找到活动窗口`);
      return null;
    }
    
    const windowInfo = {
      title: activeWindow.title,
      owner: {
        name: activeWindow.owner.name,
        path: activeWindow.owner.path,
        bundleId: activeWindow.owner.bundleId
      },
      bounds: activeWindow.bounds,
      memoryUsage: activeWindow.memoryUsage,
      platform: process.platform,
      timestamp: Date.now()
    };
    
    console.log(`[${new Date().toISOString()}] 获取活动窗口成功:`, {
      title: windowInfo.title,
      ownerName: windowInfo.owner.name,
      ownerPath: windowInfo.owner.path,
      bounds: windowInfo.bounds,
      platform: windowInfo.platform
    });
    
    return windowInfo;
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 获取活动窗口失败:`, error.message);
    console.error(`[${new Date().toISOString()}] 错误详情:`, error);
    return null;
  }
}

// 跨平台窗口焦点切换
async function focusWindow(targetTitle) {
  try {
    const platform = process.platform;
    console.log(`[${new Date().toISOString()}] 开始切换窗口焦点，平台: ${platform}`);
    console.log(`[${new Date().toISOString()}] 目标窗口标题: "${targetTitle}"`);
    
    if (platform === 'win32') {
      // Windows: 使用activatewin.ps1脚本
      const scriptPath = path.join(__dirname, 'activatewin.ps1');
      const psCommand = `& "${scriptPath}" -WindowTitle "${targetTitle}"`;
      console.log(`[${new Date().toISOString()}] 执行PowerShell脚本: ${psCommand}`);
      
      const { stdout, stderr } = await execAsync(`powershell -Command "${psCommand}"`);
      
      console.log(`[${new Date().toISOString()}] PowerShell脚本输出:`, stdout.trim());
      if (stderr) {
        console.error(`[${new Date().toISOString()}] PowerShell脚本错误:`, stderr);
      }
      
      console.log(`[${new Date().toISOString()}] Windows窗口焦点切换完成`);
      return true;
      
    } else if (platform === 'darwin') {
      // macOS: 使用activatewin.scpt脚本
      const scriptPath = path.join(__dirname, 'activatewin.scpt');
      const command = `osascript "${scriptPath}" "${targetTitle}"`;
      console.log(`[${new Date().toISOString()}] 执行macOS脚本: ${command}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      console.log(`[${new Date().toISOString()}] macOS脚本输出:`, stdout.trim());
      if (stderr) {
        console.error(`[${new Date().toISOString()}] macOS脚本错误:`, stderr);
      }
      
      console.log(`[${new Date().toISOString()}] macOS窗口焦点切换完成`);
      return true;
      
    } else {
      console.warn(`[${new Date().toISOString()}] 不支持的平台: ${platform}`);
      return false;
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 窗口焦点切换失败:`, error.message);
    return false;
  }
}

// 恢复到指定窗口
async function restoreToWindow(windowInfo) {
  try {
    if (!windowInfo) {
      console.error(`[${new Date().toISOString()}] 没有窗口信息，无法恢复`);
      return false;
    }
    
    console.log(`[${new Date().toISOString()}] 开始恢复窗口:`, {
      title: windowInfo.title,
      ownerName: windowInfo.owner.name
    });
    
    // 检查时间是否太旧（超过60秒就放弃）
    const timeDiff = Date.now() - windowInfo.timestamp;
    if (timeDiff > 60000) {
      console.log(`[${new Date().toISOString()}] 窗口信息太旧（${timeDiff}ms），放弃恢复`);
      return false;
    }
    
    // 直接使用窗口标题进行切换
    if (windowInfo.title && windowInfo.title !== 'Active Window') {
      console.log(`[${new Date().toISOString()}] 使用窗口标题切换焦点: "${windowInfo.title}"`);
      return await focusWindow(windowInfo.title);
    }
    
    console.warn(`[${new Date().toISOString()}] 没有有效的窗口标题，无法恢复`);
    return false;
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 恢复窗口失败:`, error.message);
    return false;
  }
}

// 记录当前焦点信息（简化版）
async function recordFocusInfo() {
  try {
    console.log(`[${new Date().toISOString()}] 开始记录焦点信息`);
    
    const windowInfo = await getActiveWindowInfo();
    
    if (windowInfo) {
      console.log(`[${new Date().toISOString()}] 焦点信息记录成功:`, {
        title: windowInfo.title,
        ownerName: windowInfo.owner.name
      });
      return windowInfo;
    } else {
      console.warn(`[${new Date().toISOString()}] 无法获取焦点信息`);
      return null;
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 记录焦点信息失败:`, error);
    return null;
  }
}



// 测试功能
async function testFocusManager() {
  try {
    console.log(`[${new Date().toISOString()}] 开始测试焦点管理功能`);
    
    // 测试获取活动窗口
    const activeWindow = await getActiveWindowInfo();
    if (activeWindow) {
      console.log(`[${new Date().toISOString()}] 测试获取活动窗口成功:`, activeWindow.title);
      
      // 测试恢复窗口
      const restoreResult = await restoreToWindow(activeWindow);
      console.log(`[${new Date().toISOString()}] 测试恢复窗口结果:`, restoreResult);
    } else {
      console.warn(`[${new Date().toISOString()}] 测试获取活动窗口失败`);
    }
    
    console.log(`[${new Date().toISOString()}] 焦点管理功能测试完成`);
    return true;
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 焦点管理功能测试失败:`, error);
    return false;
  }
}

module.exports = {
  getActiveWindowInfo,
  focusWindow,
  restoreToWindow,
  recordFocusInfo,
  testFocusManager
};