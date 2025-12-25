const { clipboard } = require('electron');
const { keyboard, Key } = require('@nut-tree/nut-js');
const { activateWindowByHandle } = require('./activate_win.js');

// 自动粘贴功能 - 使用优化的鼠标控制
const { leftClick, middleClick } = require('./mouse-control.js');

// 激活窗口函数 - 仅在Windows平台使用
async function activateCurrentWindow(windowHandle) {
  if (process.platform !== 'win32') {
    console.log('非Windows平台，跳过窗口激活');
    return true;
  }

  if (!windowHandle) {
    console.log('未提供目标窗口句柄，跳过窗口激活');
    return false;
  }

  try {
    console.log('激活目标窗口，句柄:', windowHandle);

    // 等待窗口激活完成
    await activateWindowByHandle(windowHandle);

    return true;
  } catch (error) {
    console.error('激活窗口失败:', error);
    return false;
  }
}

async function autoPaste(text, pasteMethod = 'middleClick', targetWindowHandle = null) {
  try {
    console.log('开始自动粘贴流程，文本:', text, '方式:', pasteMethod);

    // 确保文本在剪贴板中 - 直接写入
    const { clipboard } = require('electron');
    console.log('写入文本到剪贴板:', text);
    clipboard.writeText(text);

    // 立即验证剪贴板内容（不需要延迟，writeText是同步的）
    const verifyClipboard = clipboard.readText();
    console.log('验证剪贴板内容:', verifyClipboard);

    // 根据平台决定是否需要先激活窗口
    if (process.platform === 'win32' && targetWindowHandle) {
      console.log('Windows平台，激活目标窗口');
      await activateCurrentWindow(targetWindowHandle);
    } else if (process.platform === 'darwin') {
      console.log('macOS平台，执行鼠标左键点击切换窗口焦点');
      await leftClick();
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
    console.error('自动粘贴出错:', error);
    return false;
  }
}

module.exports = { autoPaste, activateCurrentWindow };