// 键盘模拟模块
const { spawn } = require('child_process');
const path = require('path');

// 检查是否包含中文字符
function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

// 发送文本到ETX
async function sendTextToETX(text, config = {}) {
  try {
    console.log('准备发送文本:', text);
    console.log('使用配置:', config);
    
    // 如果使用API切换方式且有焦点窗口信息，直接调用PowerShell脚本
    if (config.focusSwitchMethod === 'api' && config.lastFocusedWindow) {
      const scriptPath = path.join(__dirname, 'activatewin.ps1');
      
      console.log('使用spawn执行PowerShell脚本发送文本');
      
      // 根据粘贴选项映射到PowerShell脚本的PasteMethod参数
    // 1: Ctrl+V, 2: Ctrl+Shift+V, 3: 鼠标中键(Shift+Insert)
    let pasteMethodCode = 1; // 默认Ctrl+V
    if (config.pasteMethod === 'ctrl-shift-v') {
        pasteMethodCode = 2;
    } else if (config.pasteMethod === 'mouse-middle') {
        pasteMethodCode = 3;
    }

    const psScriptPath = scriptPath;
    
    // 1. 将参数分别转为 Base64 (UTF-16LE 编码)
    // 使用 utf16le 是为了与 PowerShell 默认的 Unicode 字符串完美对齐
    const b64Title = Buffer.from(config.lastFocusedWindow.title, 'utf16le').toString('base64');
    const b64Text = Buffer.from(text, 'utf16le').toString('base64');

    // 2. 构造命令：此时参数里全是安全的字母和数字，不再有空格和引号的烦恼
    const fullCommand = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}" -Base64Title "${b64Title}" -Base64Text "${b64Text}" -PasteMethod ${pasteMethodCode}`;

    return new Promise((resolve, reject) => {
        const { exec } = require('child_process');
        exec(fullCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('执行失败:', error);
                resolve(false);
                return;
            }
            if (stderr) {
                console.error('PowerShell脚本错误:', stderr);
            }
            console.log('结果:', stdout.trim());
            resolve(true);
        });
    });
    } else {
      console.log('未使用API切换方式或无焦点窗口信息，跳过发送');
      return false;
    }
  } catch (error) {
    console.error('发送文本失败:', error);
    return false;
  }
}

module.exports = { sendTextToETX, containsChinese };