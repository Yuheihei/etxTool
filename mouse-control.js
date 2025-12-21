// 鼠标和键盘控制模块 - 使用nut.js库
const { mouse, Button, Point, keyboard, Key } = require('@nut-tree/nut-js');

// 配置nut.js
mouse.config.mouseSpeed = 1000;

// 模拟鼠标左键点击
async function leftClick() {
  try {
    console.log('使用nut.js执行鼠标左键点击');
    
    // 获取当前鼠标位置
    const currentPos = await mouse.getPosition();
    console.log('当前鼠标位置:', currentPos);
    
    // 模拟鼠标左键点击
    await mouse.click(Button.LEFT);
    console.log('nut.js鼠标左键点击成功');
    
    return true;
  } catch (error) {
    console.error('nut.js鼠标左键点击失败:', error);
    throw error;
  }
}

// 模拟鼠标中键点击 - 使用更稳定的方式
async function middleClick() {
  try {
    console.log('使用nut.js执行鼠标中键点击');
    
    // 获取当前鼠标位置
    const currentPos = await mouse.getPosition();
    console.log('当前鼠标位置:', currentPos);
    
    // 使用更稳定的方式模拟中键点击
    // 先按下中键
    await mouse.pressButton(Button.MIDDLE);
    // 短暂延迟确保按下动作完成
    await new Promise(resolve => setTimeout(resolve, 50));
    // 释放中键
    await mouse.releaseButton(Button.MIDDLE);
    
    console.log('nut.js鼠标中键点击成功');
    
    return true;
  } catch (error) {
    console.error('nut.js鼠标中键点击失败:', error);
    throw error;
  }
}

// 获取鼠标位置
async function getMousePosition() {
  try {
    const position = await mouse.getPosition();
    return { x: position.x, y: position.y };
  } catch (error) {
    console.error('获取鼠标位置失败:', error);
    throw error;
  }
}

module.exports = { leftClick, middleClick, getMousePosition };