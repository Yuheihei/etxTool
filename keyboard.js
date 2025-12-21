// 键盘模拟模块
const { exec } = require('child_process');
const path = require('path');
const { app } = require('electron');

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
      // 使用app.getAppPath()获取应用路径，确保在打包后能正确找到脚本
      const appPath = app.getAppPath();
      const scriptPath = path.join(appPath, 'activatewin.ps1');
      
      // 根据粘贴选项映射到PowerShell脚本的PasteMethod参数
      // 1: Ctrl+V, 2: Ctrl+Shift+V, 3: 鼠标中键(Shift+Insert)
      let pasteMethodCode = 1;
      if (config.pasteMethod === 'ctrl-shift-v') {
        pasteMethodCode = 2;
      } else if (config.pasteMethod === 'mouse-middle') {
        pasteMethodCode = 3;
      }

      // 将参数分别转为 Base64 (UTF-16LE 编码)
      const b64Title = Buffer.from(config.lastFocusedWindow.title, 'utf16le').toString('base64');
      const b64Text = Buffer.from(text, 'utf16le').toString('base64');

      // 构造命令，增加执行策略和调试信息
      const fullCommand = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -Base64Title "${b64Title}" -Base64Text "${b64Text}" -PasteMethod ${pasteMethodCode}`;

      return new Promise((resolve, reject) => {
        console.log('=== PowerShell调试信息 ===');
        console.log('应用路径:', appPath);
        console.log('脚本路径:', scriptPath);
        console.log('脚本是否存在:', require('fs').existsSync(scriptPath));
        console.log('执行命令:', fullCommand);
        console.log('========================');
        
        exec(fullCommand, { timeout: 10000 }, (error, stdout, stderr) => {
          if (error) {
            console.error('=== PowerShell执行失败 ===');
            console.error('错误信息:', error.message);
            console.error('错误代码:', error.code);
            console.error('错误信号:', error.signal);
            console.error('标准错误:', stderr);
            console.error('标准输出:', stdout);
            console.error('========================');
            
            // 尝试备选方案：使用更宽松的执行策略
            if (error.code === 1 && stderr.includes('execution')) {
              console.log('尝试使用备选执行策略...');
              const fallbackCommand = `powershell.exe -NoProfile -ExecutionPolicy Unrestricted -File "${scriptPath}" -Base64Title "${b64Title}" -Base64Text "${b64Text}" -PasteMethod ${pasteMethodCode}`;
              
              exec(fallbackCommand, { timeout: 10000 }, (fallbackError, fallbackStdout, fallbackStderr) => {
                if (fallbackError) {
                  console.error('备选方案也失败:', fallbackError);
                  resolve(false);
                } else {
                  console.log('备选方案成功:', fallbackStdout.trim());
                  resolve(true);
                }
              });
            } else {
              resolve(false);
            }
            return;
          }
          
          if (stderr) {
            console.warn('PowerShell脚本警告:', stderr);
          }
          console.log('PowerShell脚本成功执行，输出:', stdout.trim());
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