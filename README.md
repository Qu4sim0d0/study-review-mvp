# Study Review MVP

本项目是一个最小可用的本地复习系统：

- Codex Skill 固化出题、阅卷、解析和错题反馈的 JSON 协议。
- 本地 Web 应用负责题库导入、做题、客观题本地判分、错题保存和重复练习。
- 数据保存在本地 SQLite，不包含账号、云同步或复杂统计。

## 运行

```bash
cd app
npm install
npm run init-db
npm run dev
```

默认地址：

- Web: `http://localhost:5173`
- API: `http://localhost:8787`

## 使用流程

1. 在 Codex 中使用 `$study-review-protocol`，从课程文本生成 `generate_questions` 或 `extract_question_bank` JSON。
2. 打开 Web 应用的“导入”页，粘贴题库 JSON。
3. 在“练习”页做题。
4. 选择题、判断题由本地应用判分。
5. 简答题点击“复制给 Codex 阅卷”，把 JSON 交给 Codex，再把返回的 `grade_answer` JSON 粘贴回应用保存。
6. 错题会进入“错题本”，可按标签查看和重复练习。

## Skill

Skill 文件位于：

```text
.agents/skills/study-review-protocol/SKILL.md
```

它只负责协议和输出约束，不保存长期状态，也不管理题库或界面。

## MVP 范围

支持题型：

- `single_choice`
- `true_false`
- `short_answer`

错题本保存：

- 题目
- 题型
- 我的答案
- 正确答案
- 解析
- 错因标签
- 最近一次作答时间
- 错误次数
