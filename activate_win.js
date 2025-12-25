const { exec } = require('child_process');
const os = require('os');

/**
 * 跨平台通过 PID 激活窗口
 * @param {number|string} pid 进程 ID
 */
function activateWindowByPID(pid) {
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

    exec(command, (error) => {
        if (error) {
            console.error(`激活失败: ${error.message}`);
            return;
        }
        console.log(`已尝试聚焦 PID 为 ${pid} 的窗口 (${platform})`);
    });
}

// 导出函数供其他模块使用
module.exports = { activateWindowByPID };