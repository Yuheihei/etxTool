const fs = require('fs');
const path = require('path');

// 创建一个简单的PNG图标
function createSimpleIcon() {
  // 16x16像素的蓝色图标PNG数据
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x3C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0x99, 0x63, 0xFC, 0x0F, 0xC4, 0x00,
    0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0A, 0xF5,
    0x33, 0x9E, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
    0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  const iconPath = path.join(__dirname, 'icon.png');
  fs.writeFileSync(iconPath, pngData);
  console.log('简单图标已创建:', iconPath);
  return iconPath;
}

// 创建一个更好的64x64图标
function createBetterIcon() {
  // 64x64像素的蓝色圆形图标
  const width = 64;
  const height = 64;
  
  // 创建一个简单的蓝色圆形PNG
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // 绘制蓝色圆形背景
  ctx.fillStyle = '#1E90FF';
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, 2 * Math.PI);
  ctx.fill();
  
  // 添加文字
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ETX', 32, 32);
  
  // 保存为PNG
  const iconPath = path.join(__dirname, 'icon.png');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(iconPath, buffer);
  
  console.log('新图标已创建:', iconPath);
  return iconPath;
}

// 使用Node.js内置模块创建图标
function createIconWithNode() {
  const width = 64;
  const height = 64;
  
  // 创建一个简单的蓝色方块PNG
  // PNG文件头
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);  // width
  ihdrData.writeUInt32BE(height, 4); // height
  ihdrData[8] = 8;    // bit depth
  ihdrData[9] = 2;    // color type (RGB)
  ihdrData[10] = 0;   // compression
  ihdrData[11] = 0;   // filter
  ihdrData[12] = 0;   // interlace
  
  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // length
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.from([ihdrCrc >>> 24, ihdrCrc >>> 16, ihdrCrc >>> 8, ihdrCrc])
  ]);
  
  // 创建图像数据 (64x64 RGB)
  const imageData = Buffer.alloc(width * height * 3);
  for (let i = 0; i < imageData.length; i += 3) {
    imageData[i] = 30;     // R
    imageData[i + 1] = 144; // G
    imageData[i + 2] = 255; // B
  }
  
  // IDAT chunk (简化版，实际需要压缩)
  const idatData = zlib.deflateSync(imageData);
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), idatData]));
  const idatChunk = Buffer.concat([
    Buffer.from([idatData.length >>> 24, idatData.length >>> 16, idatData.length >>> 8, idatData.length]),
    Buffer.from('IDAT'),
    idatData,
    Buffer.from([idatCrc >>> 24, idatCrc >>> 16, idatCrc >>> 8, idatCrc])
  ]);
  
  // IEND chunk
  const iendCrc = crc32(Buffer.from('IEND'));
  const iendChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('IEND'),
    Buffer.from([iendCrc >>> 24, iendCrc >>> 16, iendCrc >>> 8, iendCrc])
  ]);
  
  // 组合完整的PNG
  const pngData = Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
  
  const iconPath = path.join(__dirname, 'icon.png');
  fs.writeFileSync(iconPath, pngData);
  
  console.log('Node.js创建的图标已保存:', iconPath);
  return iconPath;
}

// 简单的CRC32实现
function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// 尝试使用不同的方法创建图标
try {
  createSimpleIcon();
} catch (error) {
  console.error('创建简单图标失败:', error);
  
  try {
    // 尝试使用create-icon.js中的方法
    const { createIconFile } = require('./create-icon.js');
    createIconFile();
  } catch (error2) {
    console.error('使用create-icon.js也失败:', error2);
    
    // 最后尝试创建一个最基本的图标
    const iconPath = path.join(__dirname, 'icon.png');
    const basicPng = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x99, 0x63, 0xFC, 0x0F, 0xC4, 0x00,
      0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0A, 0xF5,
      0x33, 0x9E, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
      0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(iconPath, basicPng);
    console.log('基本图标已创建:', iconPath);
  }
}