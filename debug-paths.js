// 调试工具 - 检查打包环境和文件路径
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

console.log('=== ETX调试信息 ===');
console.log('平台:', process.platform);
console.log('Node版本:', process.version);
console.log('Electron版本:', process.versions.electron);

// 检查应用路径
try {
  const appPath = app.getAppPath();
  console.log('应用路径:', appPath);
  
  // 检查关键文件是否存在
  const criticalFiles = [
    'activatewin.ps1',
    'activatewin.scpt',
    'main.js',
    'focus-manager.js',
    'keyboard.js'
  ];
  
  console.log('\n=== 文件检查 ===');
  criticalFiles.forEach(file => {
    const filePath = path.join(appPath, file);
    const exists = fs.existsSync(filePath);
    console.log(`${file}: ${exists ? '✓' : '✗'} (${filePath})`);
  });
  
  // 检查PowerShell脚本内容
  const psScriptPath = path.join(appPath, 'activatewin.ps1');
  if (fs.existsSync(psScriptPath)) {
    const stats = fs.statSync(psScriptPath);
    console.log('\n=== PowerShell脚本信息 ===');
    console.log('文件大小:', stats.size, 'bytes');
    console.log('修改时间:', stats.mtime);
    console.log('是否可读:', fs.accessSync(psScriptPath, fs.constants.R_OK) ? '是' : '否');
  }
  
} catch (error) {
  console.error('调试过程中出错:', error);
}

console.log('==================');