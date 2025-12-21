// 键盘模拟模块
const { clipboard } = require('electron');
const { autoPaste } = require('./auto-paste.js');

// 检查是否包含中文字符
function containsChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

// 发送文本到ETX
async function sendTextToETX(text, pasteMethod = 'middleClick', restoreClipboard = false) {
  try {
    console.log('准备发送文本:', text, '粘贴方式:', pasteMethod, '恢复剪贴板:', restoreClipboard);
    
    let previousClipboard = '';
    
    // 只有在需要恢复剪贴板时才保存当前内容
    if (restoreClipboard) {
      previousClipboard = clipboard.readText();
      console.log('保存的剪贴板内容:', previousClipboard);
    }
    
    // 尝试自动粘贴（autoPaste函数内部会处理剪贴板写入）
    const pasteSuccess = await autoPaste(text, pasteMethod);
    
    if (!pasteSuccess) {
      console.log('自动粘贴失败，需要手动粘贴');
    }
    
    // 只有在配置要求恢复剪贴板时才恢复
    if (restoreClipboard) {
      return new Promise((resolve) => {
        // 延迟恢复之前的剪贴板内容，给粘贴操作足够时间完成
        setTimeout(() => {
          try {
            console.log('恢复剪贴板内容');
            clipboard.writeText(previousClipboard);
            
            // 验证剪贴板是否已恢复
            const restoredClipboard = clipboard.readText();
            if (restoredClipboard === previousClipboard) {
              console.log('剪贴板内容已成功恢复');
            } else {
              console.warn('剪贴板内容可能未正确恢复');
            }
            
            resolve(true);
          } catch (error) {
            console.error('恢复剪贴板内容时出错:', error);
            resolve(false);
          }
        }, 2000);
      });
    } else {
      console.log('不恢复剪贴板内容');
      return true;
    }
  } catch (error) {
    console.error('发送文本失败:', error);
    return false;
  }
}

module.exports = { sendTextToETX, containsChinese };