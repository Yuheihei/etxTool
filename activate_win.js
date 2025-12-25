const { exec } = require('child_process');
const os = require('os');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * 跨平台通过 PID 激活窗口
 * @param {number|string} pid 进程 ID
 */
async function activateWindowByPID(pid) {
    const platform = os.platform();
    let command = '';

    if (platform === 'win32') {
        // Windows: 使用 PowerShell 激活指定 PID 窗口
        command = `powershell -Command "(New-Object -ComObject WScript.Shell).AppActivate(${pid})"`;
    }
    else if (platform === 'darwin') {
        // macOS: 使用 AppleScript 将指定 PID 的进程设为最前
        command = `osascript -e 'tell application "System Events" to set frontmost of first process whose unix id is ${pid} to true'`;
    }
    else {
        console.error(`不支持的平台: ${platform}`);
        return;
    }

    try {
        await execAsync(command, { timeout: 5000 });
        console.log(`已成功聚焦 PID 为 ${pid} 的窗口 (${platform})`);
    } catch (error) {
        console.error(`激活窗口失败: ${error.message}`);
    }
}

// 导出函数供其他模块使用
module.exports = { activateWindowByPID };