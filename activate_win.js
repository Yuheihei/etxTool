const { exec } = require('child_process');
const os = require('os');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

/**
 * 跨平台通过 PID 激活窗口
 * @param {number|string} pid 进程 ID
 */
async function activateWindowByPID(pid) {
    const platform = os.platform();

    if (platform === 'win32') {
        // Windows: 使用 VBScript 激活指定 PID 窗口（比 PowerShell 快很多）
        const vbsScript = `
Set WshShell = CreateObject("WScript.Shell")
WshShell.AppActivate ${pid}
`;
        // 使用 mshta.exe 执行 VBScript（比 PowerShell 快）
        const command = `mshta.exe "vbscript:Execute(${JSON.stringify(vbsScript).replace(/"/g, '""')}&window.close)"`;

        try {
            await execAsync(command, { timeout: 3000 });
            console.log(`已成功聚焦 PID 为 ${pid} 的窗口 (Windows)`);
        } catch (error) {
            console.error(`激活窗口失败: ${error.message}`);
        }
    }
    else if (platform === 'darwin') {
        // macOS: 使用 AppleScript 将指定 PID 的进程设为最前
        const command = `osascript -e 'tell application "System Events" to set frontmost of first process whose unix id is ${pid} to true'`;
        try {
            await execAsync(command, { timeout: 5000 });
            console.log(`已成功聚焦 PID 为 ${pid} 的窗口 (macOS)`);
        } catch (error) {
            console.error(`激活窗口失败: ${error.message}`);
        }
    }
    else {
        console.error(`不支持的平台: ${platform}`);
    }
}

// 导出函数供其他模块使用
module.exports = { activateWindowByPID };