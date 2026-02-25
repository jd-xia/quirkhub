🧒 习惯培养系统需求文档（PRD v2｜整理版）

- **适用读者**：产品 / 设计 / 前后端 / 测试
- **目标**：在不改变原需求含义的前提下，统一结构、术语、编号与格式，便于评审与落地
- **当前实现**：一期核心 + 商场中心 + 游戏平台 + 家庭大屏（含项目排行榜）、积分可修改/兑换可撤回等已实现；技术栈为 Spring Boot + React + TypeScript + MUI，详见各节「已实现」标注。

---

## 目录

- [1. 项目概述与目标](#1-项目概述与目标)
- [2. 范围与阶段](#2-范围与阶段)
- [3. 角色与权限](#3-角色与权限)
- [4. 核心概念与状态](#4-核心概念与状态)
- [5. 功能需求（模块化）](#5-功能需求模块化)
  - [5.1 认证与登录](#51-认证与登录)
  - [5.2 多孩子账号（家庭管理）](#52-多孩子账号家庭管理)
  - [5.3 模板管理](#53-模板管理)
  - [5.4 周评分生成](#54-周评分生成)
  - [5.5 评分系统（打分）](#55-评分系统打分)
  - [5.6 积分管理（台账）](#56-积分管理台账)
  - [5.7 统计与分析](#57-统计与分析)
  - [5.8 通知系统（可选）](#58-通知系统可选)
  - [5.9 高级模块（可选/二期）](#59-高级模块可选二期)
- [6. 数据库设计（草案）](#6-数据库设计草案)
- [7. 后端接口设计（草案）](#7-后端接口设计草案)
- [8. 前端页面结构（信息架构）](#8-前端页面结构信息架构)
- [9. 非功能需求](#9-非功能需求)
- [10. 技术架构建议（实现参考）](#10-技术架构建议实现参考)

---

## 1. 项目概述与目标

构建一个**面向家庭**的习惯培养系统，用于：

- **帮助孩子养成良好习惯**
- **家长可量化评估孩子表现**
- **通过积分机制进行正向激励**
- **支持多孩子独立管理**
- **支持长期统计与分析**

---

## 2. 范围与阶段

- **一期（核心）**：模板管理、一周总结生成、评分（打分/提交/锁定）、积分台账、多孩子账号、基础统计 — **已实现**
- **二期（已实现）**：奖励商城（商场中心）、家庭共享大屏（多统计模式 + 项目排行榜）、游戏平台（积分兑换游戏时间 + 记忆翻牌等）
- **后续（可选）**：通知系统、成就系统、周总结文字入库等

> 说明：与当前 KiddoQuest 实现状态一致。

---

## 3. 角色与权限

### 3.1 角色定义

- **家长（Admin）**：家庭管理者，拥有配置与管理权限
- **孩子（Child）**：被管理对象，主要查看与参与打分/兑换

### 3.2 权限矩阵

| 功能 | 家长 | 孩子 |
| --- | --- | --- |
| 模板管理 | ✅ | ❌ |
| 生成一周总结 | ✅ | ❌ |
| 打分（一周总结·填写） | ✅ | ❌ |
| 积分调整 / 修改手动记录 | ✅ | ❌ |
| 统计查看（家庭大屏） | ✅ | ❌ |
| 商场中心（上架/兑换撤回） | ✅ 上架、撤回 | ✅ 兑换、查看 |
| 游戏平台（兑换时间/玩游戏） | ✅ 查看 | ✅ 兑换、游戏 |
| 登录 | ✅ | ✅ |
| 查看积分/记录 | ✅ | ✅ |
| 查看兑换记录 | ✅ | ✅ |

---

## 4. 核心概念与状态

### 4.1 核心对象（术语）

- **模板（Template）**：可复用的“习惯评分规则”定义
- **模板版本（Template Version）**：模板每次修改形成新版本，用快照固化
- **一周总结 / 周评分（Weekly Score）**：基于某模板版本，为某孩子生成的一周（7 天）评分实例；产品侧称「一周总结」
- **周评分条目（Weekly Score Item）**：按“维度 × 天”记录分数与备注；维度分类：学习习惯、生活习惯、加分项、扣分项（已实现）
- **积分台账（Points Log）**：积分增减的流水记录，可关联来源业务；类型含：周结算、手动奖励、扣分、兑换、游戏奖励（已实现）

### 4.2 一周总结 / 周评分状态（已实现）

- `DRAFT`：草稿（可编辑、自动保存）
- `ACTIVE`：启用中（可编辑）
- `SUBMITTED`：已提交（不可再编辑打分；可撤回结算）
- `LOCKED`：锁定（强制不可改）

---

## 5. 功能需求（模块化）

### 5.1 认证与登录

### 目标

支持家长/孩子登录与身份识别。

### 功能点

- 登录
- 登出
- 获取当前登录信息

---

### 5.2 多孩子账号（家庭管理）

### 目标

支持一个家庭多个孩子账号，数据隔离，可切换当前孩子。

### 功能点

- 家长管理多个孩子（增删改）
- 孩子独立登录
- 数据隔离（按 `parent_id` / `child_id` 约束访问范围）
- 切换当前孩子（前端上下文/后端参数）

---

### 5.3 模板管理（Template Management）

### 目标

定义可复用的习惯评分规则。

### 功能点

- **创建模板**
  - 字段：模板名称、描述、默认每日满分、多个评分维度
  - 维度字段：名称、描述（可选）、每日积分、评分方式
  - 评分方式：满分制 / 半分制 / 勾选制 / 自定义分值
- **修改模板**
  - 修改基础信息
  - 新增/删除维度
  - 修改生成新版本
- **删除模板**
  - 软删除（推荐）
  - 支持恢复
- **版本管理**
  - 查看历史版本
  - 回滚版本
  - 标记当前版本

---

### 5.4 一周总结生成（原周评分生成）

### 目标

基于模板生成每周评分实例，产品侧命名为「一周总结」。

### 功能点（已实现）

- 选择模板版本、孩子、周起始日期
- 自动生成 7 天 × 各维度 结构
- 维度分类：学习习惯、生活习惯、加分项、扣分项
- 独立保存；提交后锁定，不可再改打分

---

### 5.5 评分系统（打分）— 一周总结·填写

### 目标

记录每日习惯完成情况，并自动汇总统计。

### 功能点（已实现）

- 显示当前一周总结（按日 Tab + 按维度折叠）
- 逐日逐维度打分：天气图标（☀️ 满分 / 🌤 半分 / ☁️ 默认；扣分项 ⛈ 全扣 / 🌧 半扣 / ☁️ 不扣）
- 自动计算：每日总分、每周总分、完成度进度
- 快捷操作：只看未评、复制昨天、本日全设为默认
- 周总结小卡：本周亮点、需要改进、下周目标、家长寄语（当前为前端本地存储，可扩展为入库）
- 数据处理：自动保存、提交后锁定；已提交周支持「撤回结算」

---

### 5.6 积分管理（台账）

### 目标

管理孩子积分与奖励兑换，形成可追溯流水。

### 积分来源（已实现）

- 周结算（一周总结提交）
- 手动奖励 / 手动扣分（家长）
- 商场兑换（REWARD_REDEEM）
- 游戏奖励（GAME_REWARD）

### 家长端功能（已实现）

- 增减积分（手动调整）、记录原因
- **修改记录**：对手动奖励/扣分流水可编辑（修改数值与原因），并重算后续余额
- 查看历史

### 孩子端功能（已实现）

- 查看余额、查看记录

---

### 5.7 统计与分析 — 家庭大屏（已实现）

### 目标

家庭共享大屏，多统计模式与项目排行榜。

### 指标与展示（已实现）

- **概览**：本周总分、当前积分、本周每日总分
- **周趋势**：近 6 周总分趋势
- **分类贡献**：本周学习/生活/加分/扣分四类小计
- **积分流**：近 30 天收入/支出/净变化、兑换次数与金额
- **项目排行榜**：全部小项目累计积分排行（已结算周，按分数从高到低，不按分类折叠）

---

### 5.8 通知系统（可选）

### 通知场景

- 每日提醒打分
- 周结束提醒
- 奖励通知
- 连续完成提醒

### 实现渠道（备选）

- Push
- Email
- Web 通知

---

### 5.9 高级模块

#### 5.9.1 奖励商城系统（商场中心）— 已实现

**目标**

让积分可消费，增强激励。

**功能（已实现）**

- **家长端**：上架奖励物品（名称、描述、积分、库存、图标）、指定孩子可选、编辑/下架；**最近兑换**列表支持**撤回**（退积分、标记已撤回）
- **孩子端**：浏览商品、使用积分兑换、查看兑换记录

#### 5.9.2 游戏平台 — 已实现

**目标**

积分兑换游戏时间，提升趣味与激励。

**功能（已实现）**

- 积分兑换游戏时间（可配置：1 积分 = N 分钟，每月兑换次数上限）
- 可玩时间余额与消耗记录
- 小游戏：记忆翻牌等（消耗可玩时间）

#### 5.9.3 成就系统（Achievement System）

**目标**

提供长期荣誉激励。

**成就类型**

- 连续完成类
- 累计里程碑
- 特殊成就

#### 5.9.4 家庭共享大屏（家庭大屏）— 已实现

**目标**

打造家庭仪式感展示中心。

**展示内容（已实现）**

- 多 Tab：概览 / 周趋势 / 分类贡献 / 积分流 / **项目排行榜**
- 每孩子卡片：本周总分、当前积分、每日总分、近 6 周趋势、四类贡献、30 天积分流、**全部小项目累计积分排行**（已结算周）
- 数据通过聚合查询生成（含 `dashboard/family-v2`）

---

## 6. 数据库设计（草案）

> 说明：此处为原文“📦 数据库设计/数据库”内容的表格化整理，字段名保持一致。

### 6.1 `template`

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `name` | 模板名称 |
| `description` | 描述 |
| `default_point` | 默认满分 |
| `version` | 当前版本 |
| `status` | `active` / `deleted` |
| `created_by` | 创建者 |
| `create_time` | 创建时间 |
| `update_time` | 更新时间 |

### 6.2 `template_version`

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `template_id` | 模板ID |
| `version` | 版本号 |
| `snapshot` | JSON 快照 |
| `create_time` | 创建时间 |

### 6.3 `template_item`

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `template_version_id` | 版本ID |
| `name` | 维度名称 |
| `description` | 描述 |
| `category` | 维度分类：LEARNING / LIFE / BONUS / PENALTY（已实现） |
| `earning_point` | 每日积分 |
| `score_type` | 评分方式 |

### 6.4 `weekly_score`

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `template_version_id` | 模板版本 |
| `child_id` | 孩子ID |
| `week_start_date` | 周开始 |
| `week_end_date` | 周结束 |
| `status` | 状态 |
| `total_score` | 总分 |
| `create_time` | 创建时间 |

### 6.5 `weekly_score_item`

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `weekly_score_id` | 周评分ID |
| `dimension_name` | 维度名称（冗余） |
| `dimension_category` | 维度分类（冗余，已实现） |
| `day_of_week` | 星期 1–7 |
| `score` | 得分 |
| `max_score` | 满分 |
| `remark` | 备注（可存图标状态等） |

### 6.6 `child`

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `name` | 姓名 |
| `login_account` | 账号 |
| `password_hash` | 密码 |
| `avatar` | 头像 |
| `parent_id` | 家长ID |
| `create_time` | 创建时间 |

### 6.7 `points_log`

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `child_id` | 孩子ID |
| `change_type` | SCORE_SETTLEMENT / MANUAL_REWARD / PENALTY / REWARD_REDEEM / GAME_REWARD（已实现） |
| `score_change` | 积分变化 |
| `balance` | 当前余额 |
| `description` | 备注 |
| `related_id` | 关联业务（如 shop_purchase.id） |
| `create_time` | 时间 |

### 6.8 `shop_item`（商场中心，已实现）

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `parent_id` | 家长ID |
| `child_id` | 指定孩子（可选） |
| `name` | 名称 |
| `description` | 描述 |
| `cost_points` | 所需积分 |
| `stock` | 库存（可选） |
| `icon` | 图标 |
| `status` | ACTIVE / DELETED |
| `create_time` / `update_time` | 时间 |

### 6.9 `shop_purchase`（已实现）

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `parent_id` / `child_id` / `item_id` | 关联 |
| `item_name` / `item_icon` | 冗余 |
| `cost_points` / `quantity` / `total_cost_points` | 金额 |
| `revoked` | 是否已撤回（家长撤回兑换，已实现） |
| `create_time` | 时间 |

### 6.10 `play_time_log`（游戏时间，已实现）

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `child_id` | 孩子ID |
| `change_type` | REDEEM_FROM_POINTS / CONSUME_GAME / MANUAL_ADJUST |
| `minutes_change` / `balance_minutes` | 分钟变化与余额 |
| `description` / `related_id` / `create_time` | 备注与时间 |

### 6.11 `reward_item`（二期，可选）

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `name` | 名称 |
| `description` | 描述 |
| `cost_points` | 所需积分 |
| `category` | 分类 |
| `image_url` | 图片 |
| `weekly_limit` | 每周限制 |
| `need_approval` | 是否审批 |
| `status` | 状态 |
| `create_time` | 时间 |

### 6.12 `reward_order`（二期）

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `child_id` | 孩子ID |
| `reward_id` | 奖励ID |
| `cost_points` | 扣除积分 |
| `status` | 状态 |
| `create_time` | 时间 |
| `approve_time` | 审批时间 |

### 6.13 `achievement`（二期）

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `name` | 名称 |
| `description` | 描述 |
| `type` | 类型 |
| `condition_value` | 条件 |
| `icon` | 图标 |
| `points_reward` | 奖励积分 |

### 6.14 `child_achievement`（二期）

| 字段 | 说明 |
| --- | --- |
| `id` | 主键 |
| `child_id` | 孩子ID |
| `achievement_id` | 成就ID |
| `progress` | 当前进度 |
| `status` | 状态 |
| `unlock_time` | 解锁时间 |

---

## 7. 后端接口设计（草案 / 已实现）

### 7.1 认证（已实现）

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

### 7.2 模板管理（已实现）

- `GET /templates`
- `POST /templates`
- `PUT /templates/{id}`
- `DELETE /templates/{id}`
- `POST /templates/{id}/restore`
- `GET /templates/{id}/versions`
- `POST /templates/{id}/rollback`

### 7.3 一周总结 / 周评分（已实现）

- `POST /weekly-scores`
- `GET /weekly-scores?childId=&week=`
- `GET /weekly-scores/{id}`
- `PUT /weekly-scores/{id}/items`
- `POST /weekly-scores/{id}/submit`
- `POST /weekly-scores/{id}/revoke`（撤回已提交周的结算）

### 7.4 积分管理（已实现）

- `GET /points/{childId}`（余额）
- `POST /points/{childId}/adjust`（手动调整）
- `GET /points/{childId}/summary`（余额 + 最近记录）
- `PUT /points/{childId}/logs/{logId}`（修改手动奖励/扣分记录）

### 7.5 孩子管理（已实现）

- `GET /children`
- `POST /children`
- `PUT /children/{id}`
- `DELETE /children/{id}`

### 7.6 家庭大屏（已实现）

- `GET /dashboard/family`
- `GET /dashboard/family-v2`（含每日/分类/趋势/积分流/项目累计）
- `GET /dashboard/child/{id}`

### 7.7 商场中心（已实现）

- `GET /shop/items`（可选 childId）
- `POST /shop/items` / `PUT /shop/items/{id}` / `DELETE /shop/items/{id}`
- `POST /shop/items/{id}/redeem`（孩子兑换）
- `GET /shop/purchases?childId=`
- `POST /shop/purchases/{id}/revoke`（家长撤回兑换）

### 7.8 游戏时间（已实现）

- `GET /playtime/{childId}`（余额）
- `GET /playtime/{childId}/summary`（余额 + 最近记录）
- `POST /playtime/{childId}/redeem`（积分兑换分钟）
- `POST /playtime/{childId}/consume`（消耗游戏时间）

### 7.9 游戏提交（可选，已预留）

- `POST /games/essay/submit` / `POST /games/dictation/submit`（可按需启用）

---

## 8. 前端页面结构（信息架构，已实现）

- **登录页**：家长/孩子登录
- **家庭大屏**：概览 / 周趋势 / 分类贡献 / 积分流 / 项目排行榜（多孩子卡片）
- **孩子管理**：列表、增删改
- **模板管理**：列表、新建/编辑/删除、版本与回滚
- **一周总结**：列表（生成一周总结）、**一周总结·填写**（按日 Tab + 维度折叠、天气图标打分、周总结小卡）
- **积分中心**：余额、手动调整（家长）、最近记录（家长可修改手动记录）
- **商场中心**：商品列表与上架（家长）、兑换（孩子）、最近兑换（家长可撤回）
- **游戏平台**：时间兑换、可玩时间余额、记忆翻牌等小游戏
- **404**：NotFound

---

## 9. 非功能需求

### 安全

- JWT 认证
- BCrypt 密码加密
- 权限控制（防越权访问）

### 性能

- 支持家庭规模数据
- 页面加载 < 2 秒
- 并发要求低

### 可用性/体验

- 儿童友好界面
- 移动端优先
- 自动保存

---

## 10. 技术架构建议（当前实现）

### 前端（已实现）

- React + TypeScript
- Vite 构建
- 状态：React Query（TanStack Query）+ 本地 state
- UI：Material-UI（MUI v7）
- 路由：React Router DOM
- 认证：JWT（localStorage）
- 响应式布局、儿童友好风格（圆角卡片、贴纸、渐变）

### 后端（已实现）

- Java 17 + Spring Boot 3
- Spring Security + JWT（无状态）
- RESTful API
- Maven

### 数据库（已实现）

- 支持 H2（内存，开发）/ MySQL（生产）
- JPA + Hibernate，ddl-auto: update
- 表：template / template_version / template_item / weekly_score / weekly_score_item / child / parent / points_log / shop_item / shop_purchase / play_time_log 等
---

