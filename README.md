# Chrome Goods Download

<div align="center">

![Logo](icons/logo.png)

**一个简洁高效的 Chrome 扩展，用于从淘宝/天猫商品详情页一键下载所有商品图片**

[![Chrome Web Store](https://img.shields.io/badge/Chrome-114%2B-blue?style=flat-square)](https://www.google.com/chrome/)
[![Manifest Version](https://img.shields.io/badge/Manifest-V3-green?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

## ✨ 功能特性

- 🎯 **智能平台检测** - 自动识别淘宝/天猫商品详情页，非商品页面友好提示
- 📦 **图片分类提取** - 自动分离主图和详情图，分类清晰
- 🖼️ **网格预览** - 2列网格布局，缩略图预览，点击查看大图
- ✅ **灵活选择** - 支持单独勾选/取消图片，想下载什么就下载什么
- 📥 **批量下载** - 一键将选中图片打包为 ZIP 文件
- 🖼️ **格式转换** - 自动将所有图片转换为 JPG 格式，确保最大兼容性
- 🌙 **深色主题** - 现代化的深色界面设计，护眼舒适
- ⚡ **轻量高效** - 纯客户端处理，无需服务器，即装即用

## 📦 安装说明

### 从源码安装（开发者模式）

1. **下载项目**
   ```bash
   git clone https://github.com/your-username/chrome-goods-download.git
   # 或直接下载 ZIP 文件并解压
   ```

2. **打开 Chrome 扩展页面**
   - 在 Chrome 地址栏输入 `chrome://extensions/`
   - 或菜单 → 更多工具 → 扩展程序

3. **启用开发者模式**
   - 页面右上角打开「开发者模式」开关

4. **加载扩展**
   - 点击「加载已解压的扩展程序」
   - 选择项目根目录 `chrome-goods-download`

5. **使用扩展**
   - Chrome 工具栏右侧会出现扩展图标
   - 打开淘宝/天猫商品详情页，点击图标即可使用

## 🚀 使用方法

### 基本使用流程

1. **打开商品页面** - 在 Chrome 中打开淘宝或天猫的任意商品详情页

2. **点击扩展图标** - 点击 Chrome 工具栏右侧的扩展图标，打开侧边栏

3. **浏览和选择图片**
   - 主图区域显示商品主图（默认全选）
   - 详情图区域显示商品详情页的图片
   - 点击图片可查看大图
   - 点击右上角复选框可选择/取消图片

4. **一键下载** - 确认选择后，点击底部的「一键下载」按钮

5. **等待处理完成** - 图片会自动转换为 JPG 格式并打包为 ZIP 文件下载

### 界面预览

```
┌─────────────────────────────┐
│  下载商品详情图片    已选 12 张 │
├─────────────────────────────┤
│ ▶ 主图                (6张) │
├─────────────────────────────┤
│ ┌─────────┐  ┌─────────┐   │
│ │  ☐ 图片 │  │  ☐ 图片 │   │
│ └─────────┘  └─────────┘   │
│ ┌─────────┐  ┌─────────┐   │
│ │  ☐ 图片 │  │  ☐ 图片 │   │
│ └─────────┘  └─────────┘   │
├─────────────────────────────┤
│ ▶ 详情图               (8张) │
│ ...                         │
├─────────────────────────────┤
│ [🔄 刷新]                   │
│ [📥 一键下载]               │
└─────────────────────────────┘
```

## 🛠️ 技术栈

| 技术 | 用途 | 版本要求 |
|------|------|----------|
| **Manifest V3** | Chrome 扩展配置标准 | Chrome 88+ |
| **Side Panel API** | 侧边栏界面 | Chrome 114+ |
| **Content Script** | 页面内容提取 | - |
| **Service Worker** | 后台消息通信 | - |
| **JSZip** | 客户端 ZIP 打包 | 3.x |
| **FileSaver.js** | 文件下载保存 | 2.x |
| **Canvas API** | 图片格式转换 | - |
| **Iconify** | 图标库 | - |

### 核心技术方案

- **图片提取** - 通过 Content Script 注入页面，解析 DOM 结构提取图片 URL
- **跨域处理** - 使用 fetch API 获取图片，然后绘制到 Canvas 导出为 Blob
- **格式转换** - 所有图片统一转换为 JPG 格式（质量 0.92），确保兼容性
- **文件打包** - 使用 JSZip 在浏览器端完成 ZIP 打包，无需上传到服务器

## 📁 项目结构

```
chrome-goods-download/
├── icons/                      # 扩展图标
│   ├── logo.png               # 主图标
│   ├── icon16.png             # 16px 图标
│   ├── icon32.png            # 32px 图标
│   ├── icon48.png            # 48px 图标
│   └── icon128.png           # 128px 图标
├── vendor/                    # 第三方库
│   ├── file-saver.min.js      # 文件保存库
│   ├── iconify.min.js        # 图标库
│   └── jszip.min.js          # ZIP 处理库
├── .planning/                  # 项目规划文档
│   ├── PROJECT.md             # 项目概述
│   ├── REQUIREMENTS.md        # 需求规格说明
│   ├── ROADMAP.md             # 开发路线图
│   ├── STATE.md               # 项目状态跟踪
│   └── phases/                # 各阶段详细规划
├── background.js              # Service Worker 后台脚本
├── content.js                 # Content Script 内容脚本
├── manifest.json              # 扩展配置文件
├── sidepanel.html             # 侧边栏 HTML 结构
└── sidepanel.js               # 侧边栏逻辑
```

### 核心文件说明

| 文件 | 功能说明 |
|------|----------|
| `manifest.json` | Chrome 扩展配置，定义权限、图标、入口点等 |
| `background.js` | Service Worker，处理 Content Script 和 Side Panel 之间的消息通信 |
| `content.js` | 注入到商品页面的脚本，负责检测平台、提取图片 URL |
| `sidepanel.html` | 侧边栏界面结构，包含所有 HTML 和 CSS |
| `sidepanel.js` | 侧边栏交互逻辑，处理图片展示、选择和下载 |

## 🔧 开发指南

### 环境要求

- **Chrome 浏览器** - 版本 114 及以上（支持 Side Panel API）
- **代码编辑器** - 推荐 VS Code
- **Git** - 版本控制

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/chrome-goods-download.git
   cd chrome-goods-download
   ```

2. **修改代码** - 使用任意文本编辑器或 IDE

3. **测试修改**
   - 在 `chrome://extensions/` 页面点击扩展的刷新按钮
   - 或先移除扩展重新加载

4. **调试技巧**
   - 打开 Chrome 开发者工具（F12）
   - 侧边栏：在扩展页面右键 → 检查，查看 Console
   - Content Script：在商品页面直接打开开发者工具
   - Background：Chrome 扩展管理页面点击「Service Worker」链接

### 目录结构约定

- **源代码位置** - 根目录下的主要 JS/HTML 文件
- **第三方库** - 统一放在 `vendor/` 目录
- **资源文件** - 图标放在 `icons/` 目录
- **文档** - 项目规划放在 `.planning/` 目录

## 🔍 工作原理

### 平台检测流程

```
1. Content Script 随页面加载自动运行
2. 检测当前页面域名（taobao.com 或 tmall.com）
3. 检查 URL 路径是否为商品详情页（item.htm）
4. 如果不是商品详情页，发送错误消息到侧边栏显示提示
5. 如果是商品详情页，提取图片并发送到侧边栏
```

### 图片提取策略

```
主图提取：
- 查找 class 包含 "thumbnailPic" 的 img 标签
- 优先使用 data-src 属性，其次使用 src 属性
- 去重处理，避免重复图片

详情图提取：
- 查找 class 包含 "descV8-singleImage-image" 且 data-name="singleImage" 的 img 标签
- 同时搜索主文档和可能存在的 iframe
- 过滤掉阿里巴巴的占位图片和追踪像素
```

### 图片下载流程

```
1. 用户点击"一键下载"按钮
2. 收集所有选中的图片 URL
3. 依次处理每张图片：
   a. 使用 fetch API 下载图片（处理跨域）
   b. 将图片绘制到 Canvas 画布
   c. 使用 canvas.toBlob() 导出为 JPG 格式
4. 将所有 JPG Blob 添加到 JSZip 实例
5. 生成 ZIP 文件并命名为商品标题
6. 使用 FileSaver.js 触发浏览器下载
```

## 📋 版本历史

### v1.0.0 (2026-05-18)

- ✨ 完成基础功能开发
- 🎯 支持淘宝/天猫商品详情页图片提取
- 🖼️ 主图和详情图分类展示
- 📥 批量下载为 ZIP 文件
- 🖼️ 自动转换为 JPG 格式
- 🌙 深色主题 UI

## ⚠️ 注意事项

- **仅支持 Chrome 浏览器** - 使用了 Chrome 特有的 Side Panel API
- **需要 Chrome 114+** - 旧版本 Chrome 不支持侧边栏功能
- **仅支持淘宝/天猫** - 暂不支持其他电商平台
- **仅支持商品详情页** - 首页、搜索页等其他页面会提示不支持
- **纯客户端处理** - 所有操作在浏览器本地完成，无需服务器
- **跨域限制** - 图片需要能够被 fetch 获取，部分防盗链图片可能下载失败

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. **Fork 本项目**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [JSZip](https://stuk.github.io/jszip/) - 优雅的 JavaScript ZIP 处理库
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/) - 浏览器端文件保存解决方案
- [Iconify](https://iconify.design/) - 海量图标库

---

<div align="center">

**如果这个项目对您有帮助，请给个 ⭐ Star 支持一下！**

Made with ❤️ for Chrome Extensions

</div>
