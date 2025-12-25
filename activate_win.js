const koffi = require('koffi');
const { exec } = require('child_process');
const os = require('os');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Windows 平台直接通过窗口句柄激活窗口
 * @param {number} hwnd 窗口句柄
 */
async function activateWindowByHandle(hwnd) {
    if (os.platform() !== 'win32') {
        console.log('非Windows平台，不支持通过句柄激活窗口');
        return;
    }

    try {
        const user32 = koffi.load('user32.dll');
        const SetForegroundWindow = user32.func('bool SetForegroundWindow(intptr_t hWnd)');

        console.log('激活窗口句柄:', hwnd);
        const result = SetForegroundWindow(hwnd);

        if (result) {
            console.log('窗口激活成功');
        } else {
            console.error('窗口激活失败');
        }
    } catch (error) {
        console.error(`激活窗口失败: ${error.message}`);
        throw error;
    }
}

/**
 * macOS/Linux 平台通过进程ID激活窗口
 * @param {number} pid 进程 ID
 */
async function activateWindowByPID(pid) {
    const platform = os.platform();
    let command = '';

    if (platform === 'darwin') {
        // macOS: 使用 AppleScript 将指定 PID 的进程设为最前
        command = `osascript -e 'tell application "System Events" to set frontmost of first process whose unix id is ${pid} to true'`;
    } else if (platform === 'linux') {
        // Linux: 使用 wmctrl 激活窗口
        command = `wmctrl -ia ${pid}`;
    } else {
        console.error(`不支持的平台: ${platform}`);
        return;
    }

    try {
        await execAsync(command, { timeout: 5000 });
        console.log(`已成功激活 PID 为 ${pid} 的窗口 (${platform})`);
    } catch (error) {
        console.error(`激活窗口失败: ${error.message}`);
    }
}

// 导出函数供其他模块使用
module.exports = { activateWindowByHandle, activateWindowByPID };