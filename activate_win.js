const { exec } = require('child_process');

/**
 * 通过 PID 激活窗口并执行粘贴
 * @param {number|string} pid 进程 ID
 */
function activateAndPasteByPID(pid) {
    // 构建 PowerShell 命令
    // 注意：在 JS 字符串中，^ 符号不需要特殊转义，但整个命令需要包裹在引号内
    const psCommand = `powershell -Command "$ws = New-Object -ComObject WScript.Shell; if($ws.AppActivate(${pid})){ Start-Sleep -Milliseconds 500; $ws.SendKeys('^v') }"`;

    exec(psCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`执行出错: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`标准错误输出: ${stderr}`);
            return;
        }
        console.log(`成功指令已发送至 PID: ${pid}`);
    });
}

// 从命令行获取 PID 参数：node activate-paste.js 15332
// const targetPID = process.argv[2];

// if (!targetPID) {
//     console.log("用法: node activate-paste.js <PID>");
// } else {
//     activateAndPasteByPID(targetPID);
// }

// 导出函数供其他模块使用
module.exports = { activateAndPasteByPID };