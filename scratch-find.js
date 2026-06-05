const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory && !f.startsWith('.') && f !== 'node_modules') {
            walkDir(dirPath, callback);
        } else if (!isDirectory && (f.endsWith('.js') || f.endsWith('.html'))) {
            callback(dirPath);
        }
    });
}

const query = 'Không thể tải';
console.log(`🔎 Đang tìm kiếm chuỗi "${query}"...`);

walkDir('d:\\PROJECT\\tuan', (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(query)) {
        console.log(`Found in: ${filePath}`);
        // In ra các dòng khớp
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
            if (line.includes(query)) {
                console.log(`  Line ${idx + 1}: ${line.trim()}`);
            }
        });
    }
});
