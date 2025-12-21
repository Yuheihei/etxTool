const https = require('https');
const fs = require('fs');
const path = require('path');

// 下载图标函数
function downloadIcon(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('图标下载成功:', filename);
        resolve(filename);
      });
    }).on('error', (err) => {
      fs.unlink(filename, () => {});
      console.error('下载图标失败:', err);
      reject(err);
    });
  });
}

// 主函数
async function main() {
  try {
    const iconPath = path.join(__dirname, 'icon.png');
    
    // 尝试从不同的API下载图标
    const urls = [
      'https://dummyimage.com/64x64/1E90FF/ffffff&text=ETX',
      'https://via.placeholder.com/64x64/1E90FF/FFFFFF?text=ETX',
      'https://picsum.photos/seed/etx-icon/64/64.jpg',
      'https://api.adorable.io/avatars/64/etx.png'
    ];
    
    for (const url of urls) {
      try {
        console.log('尝试从URL下载图标:', url);
        await downloadIcon(url, iconPath);
        
        // 检查文件是否成功创建
        if (fs.existsSync(iconPath) && fs.statSync(iconPath).size > 0) {
          console.log('图标下载成功:', iconPath);
          return;
        }
      } catch (error) {
        console.error('从URL下载失败:', url, error.message);
      }
    }
    
    console.error('所有URL都失败了');
  } catch (error) {
    console.error('主函数执行失败:', error);
  }
}

// 运行主函数
main();