// 键盘模拟模块
const { clipboard } = require('electron');
const { autoPaste } = require('./auto-paste.js');

// 检查是否包含中文字符
function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

// 发送文本到ETX
async function sendTextToETX(text) {
  try {
    console.log('准备发送文本:', text);
    
    // 保存当前剪贴板内容
    const previousClipboard = clipboard.readText();
    console.log('保存的剪贴板内容:', previousClipboard);
    
    // 尝试自动粘贴（autoPaste函数内部会处理剪贴板写入）
    const pasteSuccess = await autoPaste(text);
    
    if (!pasteSuccess) {
      console.log('自动粘贴失败，需要手动粘贴');
    }
    
    // 延迟恢复之前的剪贴板内容，给粘贴操作足够时间完成
    setTimeout(() => {
      console.log('恢复剪贴板内容');
      clipboard.writeText(previousClipboard);
    }, 2000);
    
    return true;
  } catch (error) {
    console.error('发送文本失败:', error);
    return false;
  }
}

module.exports = { sendTextToETX, containsChinese };