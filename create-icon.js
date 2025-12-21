const fs = require('fs');
const path = require('path');
const { nativeImage } = require('electron');

// 创建一个简单的图标
const createIconFile = () => {
  const iconPath = path.join(__dirname, 'icon.png');
  
  // 创建一个64x64的蓝色圆形图标
  const size = 64;
  const iconData = Buffer.alloc(size * size * 4); // RGBA
  
  // 填充透明背景
  for (let i = 0; i < iconData.length; i += 4) {
    iconData[i] = 0;       // R
    iconData[i + 1] = 0;   // G
    iconData[i + 2] = 0;   // B
    iconData[i + 3] = 0;   // A (透明)
  }
  
  // 绘制蓝色圆形
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 4;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= radius) {
        const index = (y * size + x) * 4;
        iconData[index] = 30;     // R
        iconData[index + 1] = 144; // G
        iconData[index + 2] = 255; // B
        iconData[index + 3] = 255; // A (不透明)
      }
    }
  }
  
  // 使用Electron的nativeImage创建PNG
  const image = nativeImage.createFromBuffer(iconData, { width: size, height: size });
  const pngBuffer = image.toPNG();
  
  fs.writeFileSync(iconPath, pngBuffer);
  console.log('图标文件已创建:', iconPath);
  return iconPath;
};

// 如果图标不存在，创建一个
if (!fs.existsSync(path.join(__dirname, 'icon.png'))) {
  createIconFile();
}

module.exports = { createIconFile };