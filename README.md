# TennisCourtMonitorJS

🎾 网球场预订监控和数据同步工具集

## 📦 项目文件

### 主要脚本

#### 1. `tennis-monitor-ultimate-v2.user.js`
网球场监控终极版 - 完整的监控和反调试解决方案
- ✅ 反调试保护
- ✅ XHR/Fetch 拦截
- ✅ Vue 数据提取
- ✅ 自动刷新
- ✅ 版本检查和自动更新

#### 2. `tennis-airflow-sync.js` ⭐ (v2.0 - 新功能)
**自动多日期数据收集和 Airflow 同步**
- ✅ **自动点击所有日期标签**
- ✅ **收集多日期数据并以数组格式上报**
- ✅ 定时同步（每2分钟）
- ✅ 手动同步按钮
- ✅ Vue 数据提取
- ✅ Airflow API 集成

**新特性（v2.0）:**
- 🆕 自动查找和点击页面上的所有日期标签
- 🆕 依次收集每个日期的预订数据
- 🆕 数据格式改为数组结构：`{dates: [{date, bookings, availability}, ...]}`
- 🆕 一次同步获取所有日期的完整数据
- 🆕 防止重复点击和完善的错误处理

**数据格式示例:**
```javascript
{
    courtName: "某某网球场",
    lastUpdate: "2024-12-23T10:30:00Z",
    summary: {
        totalDates: 7,
        totalBookings: 50,
        totalVenues: 6
    },
    dates: [
        {
            date: "12-23",
            weekday: "周一",
            bookings: [...],
            availability: {...}
        },
        // ... 其他日期
    ]
}
```

#### 3. `anti-debugger.user.js`
独立的反调试脚本
- 拦截 debugger 语句
- 阻止开发者工具检测

#### 4. `check_tennis_court.js`
网球场数据检查工具
- 数据验证
- 统计分析

### 辅助模块

#### 5. `auto-click-date-tabs.js`
独立的日期标签自动点击模块
- 可重用的通用模块
- 支持自定义配置
- 丰富的回调函数
- 详细文档和示例

**使用方法:**
```javascript
// 基本使用
await autoClickDateTabs();

// 自定义配置
await autoClickDateTabs({
    maxWaitSeconds: 30,
    clickDelay: 2000,
    onTabClick: (tabInfo) => console.log('点击了:', tabInfo),
    onComplete: (stats) => console.log('完成:', stats)
});
```

查看 [`AUTO_CLICK_README.md`](AUTO_CLICK_README.md) 了解完整文档。

#### 6. `auto-click-date-tabs-example.js`
使用示例集合（8个详细示例）

## 🚀 快速开始

### 安装 Airflow 同步脚本

1. 安装 Tampermonkey 浏览器插件
2. 点击 [tennis-airflow-sync.js](https://raw.githubusercontent.com/claude89757/TennisCourtMonitorJS/main/tennis-airflow-sync.js)
3. 点击"安装"
4. 访问网球场预订网站
5. 首次使用时输入 Airflow API 凭据

### 使用方法

#### 自动同步（默认）
- 脚本加载后自动开始
- 每2分钟自动同步一次
- 每次同步自动点击所有日期标签并收集数据

#### 手动同步
- 点击页面右下角的 ☁️ 按钮
- 立即触发数据收集和同步

#### 暂停/继续
- 右键点击状态显示框
- 暂停或继续自动同步

## 📊 数据流程

```
页面加载
   ↓
查找日期标签
   ↓
依次点击每个日期 (间隔2.5秒)
   ↓
收集每个日期的数据
   ↓
格式化为数组结构
   ↓
上报到 Airflow
```

## 🔧 配置

### 修改同步间隔
在 `tennis-airflow-sync.js` 中修改：
```javascript
const SYNC_INTERVAL = 2 * 60 * 1000; // 2分钟（毫秒）
```

### 修改 Airflow 地址
```javascript
const AIRFLOW_BASE_URL = 'http://your-airflow-server:8080/airflow/api/v1';
```

## 📝 文档

- [`INTEGRATION_SUMMARY.md`](INTEGRATION_SUMMARY.md) - 集成功能详细说明
- [`AUTO_CLICK_README.md`](AUTO_CLICK_README.md) - 自动点击模块完整文档

## 🎯 特性对比

| 特性 | v1.0 | v2.0 |
|------|------|------|
| Vue 数据提取 | ✅ | ✅ |
| Airflow 同步 | ✅ | ✅ |
| 定时同步 | ✅ | ✅ |
| 手动同步 | ✅ | ✅ |
| 自动点击日期 | ❌ | ✅ |
| 多日期数据收集 | ❌ | ✅ |
| 数组格式数据 | ❌ | ✅ |
| 完整日期范围 | ❌ | ✅ |

## 🐛 调试

查看控制台日志：
```javascript
// 所有日志都有彩色标识
// [AIRFLOW-SYNC] - 主要同步日志
// [AUTO-CLICK] - 自动点击相关日志
```

## 📄 许可证

MIT License

## 👨‍💻 作者

Claude

## 🔗 相关链接

- GitHub: https://github.com/claude89757/TennisCourtMonitorJS