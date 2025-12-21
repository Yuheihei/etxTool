const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

// 生成一个专业的托盘图标
async function generateTrayIcon() {
  try {
    // 创建一个64x64的图像
    const icon = new Jimp(64, 64, 0x00000000); // 透明背景
    
    // 绘制一个圆角矩形作为背景
    const bgColor = Jimp.cssColorToHex('#1E90FF'); // 道奇蓝
    
    // 绘制圆角矩形背景
    for (let x = 8; x < 56; x++) {
      for (let y = 8; y < 56; y++) {
        // 计算到中心的距离
        const centerX = 32;
        const centerY = 32;
        const distX = Math.abs(x - centerX);
        const distY = Math.abs(y - centerY);
        
        // 圆角矩形判断
        if ((distX <= 20 && distY <= 24) || 
            (distX <= 24 && distY <= 20) ||
            (distX > 20 && distY > 20 && Math.sqrt((distX - 20) ** 2 + (distY - 20) ** 2) <= 4)) {
          icon.setPixelColor(bgColor, x, y);
        }
      }
    }
    
    // 尝试添加文字 "ETX"，如果字体加载失败则跳过
    try {
      const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
      icon.print(font, 12, 24, 'ETX');
    } catch (fontError) {
      console.warn('字体加载失败，使用纯色图标:', fontError.message);
      // 添加一个简单的白色矩形作为标识
      for (let x = 20; x < 44; x++) {
        for (let y = 28; y < 36; y++) {
          icon.setPixelColor(0xFFFFFFFF, x, y);
        }
      }
    }
    
    // 保存为PNG
    const iconPath = path.join(__dirname, 'icon.png');
    await icon.writeAsync(iconPath);
    
    console.log('新托盘图标已生成:', iconPath);
    return iconPath;
  } catch (error) {
    console.error('生成图标失败:', error);
    throw error;
  }
}

// 生成多个尺寸的图标
async function generateMultipleIconSizes() {
  try {
    // 创建基础64x64图标
    const baseIcon = new Jimp(64, 64, 0x00000000); // 透明背景
    
    // 绘制圆角矩形背景
    const bgColor = Jimp.cssColorToHex('#1E90FF'); // 道奇蓝
    
    for (let x = 8; x < 56; x++) {
      for (let y = 8; y < 56; y++) {
        const centerX = 32;
        const centerY = 32;
        const distX = Math.abs(x - centerX);
        const distY = Math.abs(y - centerY);
        
        if ((distX <= 20 && distY <= 24) || 
            (distX <= 24 && distY <= 20) ||
            (distX > 20 && distY > 20 && Math.sqrt((distX - 20) ** 2 + (distY - 20) ** 2) <= 4)) {
          baseIcon.setPixelColor(bgColor, x, y);
        }
      }
    }
    
    // 尝试添加文字 "ETX"，如果字体加载失败则跳过
    try {
      const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
      baseIcon.print(font, 12, 24, 'ETX');
    } catch (fontError) {
      console.warn('字体加载失败，使用纯色图标:', fontError.message);
      // 添加一个简单的白色矩形作为标识
      for (let x = 20; x < 44; x++) {
        for (let y = 28; y < 36; y++) {
          baseIcon.setPixelColor(0xFFFFFFFF, x, y);
        }
      }
    }
    
    // 生成不同尺寸的图标
    const sizes = [16, 22, 32, 64, 128, 256];
    const iconDir = path.join(__dirname, 'icons');
    
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir);
    }
    
    for (const size of sizes) {
      const resizedIcon = baseIcon.clone().resize(size, size);
      const iconPath = path.join(iconDir, `icon-${size}x${size}.png`);
      await resizedIcon.writeAsync(iconPath);
      console.log(`已生成 ${size}x${size} 图标:`, iconPath);
    }
    
    // 保存默认图标
    const defaultIconPath = path.join(__dirname, 'icon.png');
    await baseIcon.writeAsync(defaultIconPath);
    console.log('默认图标已保存:', defaultIconPath);
    
    return { defaultIconPath, iconDir };
  } catch (error) {
    console.error('生成多尺寸图标失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateMultipleIconSizes().catch(console.error);
}

module.exports = { generateTrayIcon, generateMultipleIconSizes };