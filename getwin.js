const activeWin = require('active-win');

async function monitor() {
    console.log("--- 窗口监控已启动 (每2秒检查一次) ---");
    
    setInterval(async () => {
        const result = await activeWin();

        if (!result) {
            console.log("未检测到活动窗口");
            return;
        }

        // 输出关键信息
        console.log(`[${new Date().toLocaleTimeString()}]`);
        console.log(`应用名称: ${result.owner.name}`); // 例如: Google Chrome
        console.log(`窗口标题: ${result.title}`);      // 例如: 百度一下，你就知道
        console.log(`进程 ID : ${result.owner.processId}`);
        console.log("-" * 30);
    }, 2000);
}

monitor().catch(console.error);