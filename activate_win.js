const koffi = require('koffi');
const os = require('os');

/**
 * Windows 平台直接通过窗口句柄激活窗口
 * @param {number} hwnd 窗口句柄
 */
async function activateWindowByHandle(hwnd) {
    if (os.platform() !== 'win32') {
        console.log('非Windows平台，不支持直接激活窗口');
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

// 导出函数供其他模块使用
module.exports = { activateWindowByHandle };