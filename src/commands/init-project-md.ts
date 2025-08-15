import { promises as fs } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';

const TEMPLATE = `# PROJECT.md

> 该文件为 AI 助手提供全局上下文与规则，建议根据团队规范持续维护。

## 项目简介
- 用一句话介绍项目
- 技术栈、运行环境

## 目录结构（关键路径）
- src/, tests/, scripts/ 等

## 代码规范
- 命名、注释、格式化、提交信息规范
- 禁止使用的 API/库

## 架构与边界
- 核心模块及职责
- 重要接口/协议（鉴权、幂等等）

## 安全与合规
- 安全要求（XSS/SQL 注入/认证/授权等）
- 隐私与数据保护

## 测试与发布
- 单测/集成测试要求与覆盖率目标
- 构建、版本、发布流程

## 风格偏好
- 输出语言、结构化格式（如使用分点/代码块）
- 期望的回答风格（简洁/详细/包含引用）
`;

export async function initProjectMd(cwd: string = process.cwd()) {
  const file = resolve(cwd, '.ai-cli', 'PROJECT.md');
  try {
    await fs.mkdir(resolve(cwd, '.ai-cli'), { recursive: true });
    await fs.writeFile(file, TEMPLATE, 'utf-8');
    console.log(chalk.green(`✓ Created ${file}`));
  } catch (e) {
    console.log(chalk.red('Failed to create PROJECT.md'), e);
  }
}

