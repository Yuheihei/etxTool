const { clipboard } = require('electron');
const { keyboard, Key } = require('@nut-tree/nut-js');

// 自动粘贴功能 - 使用优化的鼠标控制
const { leftClick, middleClick } = require('./mouse-control.js');

async function autoPaste(text, pasteMethod = 'middleClick') {
  try {
    console.log('开始自动粘贴流程，文本:', text, '方式:', pasteMethod);
    
    // 确保文本在剪贴板中 - 直接写入，不验证
    const { clipboard } = require('electron');
    console.log('写入文本到剪贴板:', text);
    clipboard.writeText(text);
    
    // 增加延迟确保剪贴板操作完成
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 验证剪贴板内容
    const verifyClipboard = clipboard.readText();
    console.log('验证剪贴板内容:', verifyClipboard);
    
    // 如果剪贴板内容仍然不匹配，再次尝试
    if (verifyClipboard !== text) {
      console.log('剪贴板内容不匹配，再次尝试写入');
      clipboard.writeText(text);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const finalCheck = clipboard.readText();
      console.log('最终检查剪贴板内容:', finalCheck);
      
      if (finalCheck !== text) {
        console.error('无法将文本写入剪贴板');
        return false;
      }
    }
    
    // 根据平台决定是否需要先左键点击
    try {
      // macOS需要先左键点击切换窗口焦点，Windows不需要
      if (process.platform === 'darwin') {
        console.log('macOS平台，执行鼠标左键点击切换窗口焦点');
        await leftClick();
        console.log('鼠标左键点击成功');
        
        // 增加延迟确保窗口焦点切换完成
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        console.log('Windows/Linux平台，跳过左键点击');
      }
      
      // 根据选择的方式执行粘贴
      switch (pasteMethod) {
        case 'middleClick':
          // 执行鼠标中键点击进行粘贴
          console.log('执行鼠标中键点击');
          await middleClick();
          console.log('鼠标中键点击成功');
          break;
          
        case 'ctrlV':
          // 执行 Ctrl+V 粘贴
          console.log('执行 Ctrl+V 粘贴');
          await keyboard.pressKey(Key.LeftControl);
          await keyboard.pressKey(Key.V);
          await keyboard.releaseKey(Key.V);
          await keyboard.releaseKey(Key.LeftControl);
          console.log('Ctrl+V 粘贴成功');
          break;
          
        case 'ctrlShiftV':
          // 执行 Ctrl+Shift+V 粘贴
          console.log('执行 Ctrl+Shift+V 粘贴');
          await keyboard.pressKey(Key.LeftControl);
          await keyboard.pressKey(Key.LeftShift);
          await keyboard.pressKey(Key.V);
          await keyboard.releaseKey(Key.V);
          await keyboard.releaseKey(Key.LeftShift);
          await keyboard.releaseKey(Key.LeftControl);
          console.log('Ctrl+Shift+V 粘贴成功');
          break;
          
        default:
          // 默认使用鼠标中键
          console.log('执行默认鼠标中键点击');
          await middleClick();
          console.log('鼠标中键点击成功');
      }
      
      // 再次验证剪贴板内容，确保没有在粘贴过程中被改变
      const afterPasteClipboard = clipboard.readText();
      console.log('粘贴后剪贴板内容:', afterPasteClipboard);
      
      return true;
    } catch (error) {
      console.error('粘贴操作失败:', error);
      return false;
    }
  } catch (error) {
    console.error('自动粘贴出错:', error);
    return false;
  }
}

module.exports = { autoPaste };