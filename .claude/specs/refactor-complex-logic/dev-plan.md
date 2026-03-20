# 简化复杂逻辑 - 重构方案

## 上下文与约束

- **项目**: Visual Regex Page (regex 可视化工具)
- **技术栈**: JavaScript, RxJS, LESS, Vite
- **目标**: 简化代码库中的复杂逻辑，提升可维护性

## 代码库探索

### 关键文件
- `src/js/hash.js` - URL hash 编解码，魔法数字多
- `src/js/regexObservable.js` - 正则创建管道，深层嵌套
- `src/js/regexChange.js` - 可视化渲染和匹配结果处理，条件分支多
- `src/js/index.js` - 键盘快捷键处理

### 现有模式
- RxJS observables 用于响应式状态管理
- jQuery 风格的 DOM 操作
- 统一的错误处理模式

## 技术决策

1. **常量提取**: 将魔法数字统一提取到 `constant.js`
2. **函数拆分**: 将大函数拆分为单一职责的小函数
3. **保留语义**: 不改变现有 API 和功能，只改善代码结构

## 任务拆分

### Task 1: hash.js 重构
- **ID**: refactor-hash-js
- **类型**: default
- **范围**: `src/js/hash.js`
- **依赖**: 无
- **测试**: `pnpm test -- --grep "hash"`
- **交付物**: 提取 CHARSET 常量，简化 getPrefixList，合并初始化逻辑

### Task 2: regexObservable.js 重构
- **ID**: refactor-regex-observable
- **类型**: default
- **范围**: `src/js/regexObservable.js`
- **依赖**: Task 1 (constant.js)
- **测试**: `pnpm test -- --grep "regexObservable"`
- **交付物**: 拆分 createRegex/validateRegex，提取错误处理函数

### Task 3: regexChange.js 重构
- **ID**: refactor-regex-change
- **类型**: default
- **范围**: `src/js/regexChange.js`
- **依赖**: Task 1
- **测试**: `pnpm test -- --grep "regexChange"`
- **交付物**: 提取 renderVisualization/processMatch 函数

### Task 4: 键盘快捷键重构
- **ID**: refactor-keyboard-handler
- **类型**: quick-fix
- **范围**: `src/js/index.js`
- **依赖**: Task 1
- **测试**: `pnpm test -- --grep "keyboard"`
- **交付物**: 提取 isCtrlOrCmd 等判断函数

## UI 确定

needs_ui: **false**

证据: 所有修改都是纯 JavaScript 逻辑重构，不涉及 UI 组件或样式文件。

## 测试命令

```bash
pnpm test        # 运行所有测试
pnpm test:coverage  # 检查覆盖率
```
