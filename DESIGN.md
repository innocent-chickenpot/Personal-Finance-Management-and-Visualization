---
name: 奶油记账
description: 治愈系个人财务管理，让每一次记账都像在手账上贴贴纸
colors:
  cream-canvas: "#F8F5F0"
  cream-white: "#FFFDF9"
  peach-blush: "#F7D6D6"
  sage-cream: "#DDE8CF"
  butter-cream: "#F7E8B0"
  misty-blue: "#D8E7F5"
  caramel: "#8B6B52"
  cocoa-ink: "#5D4E37"
  milk-tea: "#A89880"
  rose: "#E8B4B4"
  sage-muted: "#B8CFA8"
typography:
  display:
    fontFamily: "ZCOOL KuaiLe, cursive, sans-serif"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.02em"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "12px"
  md: "20px"
  lg: "24px"
  xl: "32px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.peach-blush}"
    textColor: "{colors.caramel}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "#F0C4C4"
  card:
    backgroundColor: "{colors.cream-white}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "{colors.cream-white}"
    rounded: "{rounded.md}"
---

# Design System: 奶油记账

## 1. Overview

**Creative North Star: "奶油罐里的手账"**

奶油记账的视觉语言是一场私密的、温暖的记账仪式。用户打开的不是一个财务软件，而是一本日系手账——每一笔记录都是贴上去的贴纸，每一次存入储蓄罐都是一枚投进玻璃罐的金币。奶油小狗趴在罐子上，陪着用户慢慢存钱。

整个系统的关键词是**软**、**圆**、**轻**。没有棱角，没有深色块，没有让人紧张的对比度。颜色像融化的奶油一样交融在一起——蜜桃粉到奶油黄到牛油果绿，所有颜色都经过低饱和处理，互相之间不会冲突。卡片是"棉花糖"——敦实、圆润、按压有弹性。空白区域总有小狗陪伴，不让任何状态显得空洞。

**Key Characteristics:**
- 软萌治愈：所有交互都是温柔的，报错也不吓人，空状态有小狗陪伴
- 棉花糖质感：组件敦实圆润无棱角，hover 轻微上浮，按压反馈柔软
- 手账贴纸体系：卡片像贴纸一样浮在奶油底色的页面上，按钮像手账贴纸
- 克制不堆砌：信息有层次，大量留白，不给用户压力
- 奶油小狗贯穿：每一个空白状态、每一个关键操作，小狗都在

## 2. Colors

整个色板围绕"奶油融化"构建。主背景是一层薄薄的暖调奶油色（chroma 极低），所有强调色都从甜点食材中取灵感：蜜桃、牛油果、黄油、焦糖。不存在纯黑、纯白、纯灰，所有中性色都带一丝焦糖底色。

### Primary
- **蜜桃粉** Peach Blush (`#F7D6D6`): 系统唯一的主强调色。用于主按钮背景、储蓄罐标签、活跃的导航项、天数高亮。覆盖约 10-15% 的表面面积。克制使用是其魅力的来源。
- **牛油果绿** Sage Cream (`#DDE8CF`): 收入/正向的语义色。用于收入金额、收入柱状图、预算进度安全区、储蓄率正值。
- **奶油黄** Butter Cream (`#F7E8B0`): 中间态语义色。用于预算进度接近超支（80-100%）、储蓄罐金币液面、轻量高亮。
- **雾霾蓝** Misty Blue (`#D8E7F5`): 信息语义色。用于非关键标注、日期显示、次要信息区域。

### Neutral
- **奶油底** Cream Canvas (`#F8F5F0`): 页面底色。不是纯白，不是纯灰，是一层极淡的暖调奶油。页面主体的画布。
- **奶油白** Cream White (`#FFFDF9`): 卡片、侧边栏、弹窗的表面色。比底色稍亮，形成轻微的分层。
- **焦糖棕** Caramel (`#8B6B52`): 中度强调色。用于 section 标题、按钮文字（在蜜桃粉背景上）、次要按钮边框。不是 ink，是 warm accent。
- **可可棕** Cocoa Ink (`#5D4E37`): 正文色。不是纯黑——比纯黑暖、浅，在奶油底上对比度足够（≥4.5:1）但不刺眼。
- **奶茶灰** Milk Tea (`#A89880`): 辅助文字色。用于说明文字、placeholder、次要信息。在奶油白底上 ≥4.5:1 对比度，不被洗掉。

### Semantics
- **玫瑰粉** Rose (`#E8B4B4`): 支出/负向语义色。用于支出金额、支出柱状图、超预算警示、删除危险操作。
- **柔绿** Sage Muted (`#B8CFA8`): 成功语义色。用于成功标签、完成标记。

### Named Rules

**The No-Pure-Black Rule.** 不允许 `#000` 或 `#000000` 出现在任何地方。正文最深的颜色永远是可可棕（`#5D4E37`）。同样地，不允许纯白——白色永远是奶油白（`#FFFDF9`）。

**The Peach Restraint Rule.** 蜜桃粉（`#F7D6D6`）是系统唯一的强调色。一个屏幕上蜜桃粉色覆盖面积不超过 15%。少即是多，克制即高级。

**The Tone-Over-Gray Rule.** 所有"灰"色都带焦糖底色。奶茶灰（`#A89880`）用在奶油白底上不会被洗掉，因为它和页面的暖调底色同源。

## 3. Typography

**Display Font:** ZCOOL KuaiLe (站酷快乐体), fallback to cursive, sans-serif
**Body Font:** System UI stack — `system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`

**Character:** ZCOOL KuaiLe 是圆体——每一个字都是圆角。它可爱但不幼稚，正式感够支撑标题和按钮，同时保持了软萌的品牌个性。系统无衬线作为正文字体保证可读性。两者之间是圆润感和可读性的平衡。

### Hierarchy
- **Display** (700 weight, 28px, 1.3 line-height): 页面主标题。用于 Dashboard 问候语、认证页标题。
- **Headline** (700 weight, 18-24px, 1.3 line-height): 功能模块标题。Section 名称、图表标题。
- **Title** (600 weight, 15-17px, 1.4 line-height): 卡片内部小标题。储蓄罐名称、筛选区域标签。
- **Body** (400 weight, 14-15px, 1.6 line-height): 正文。交易列表、表单标签、说明文字。最大行宽 65ch。
- **Label** (600 weight, 12-13px, 1.4 line-height): 小标签。分类标记、日期、辅助数字。

### Named Rules

**The Rounded-Only Rule.** 所有标题、导航文字、按钮文字必须使用圆体（ZCOOL KuaiLe）。无衬线常规字体仅用于正文和标签。禁止在标题位置出现方正或尖锐的字体。

**The One-Display-Family Rule.** 圆体只有 ZCOOL KuaiLe。不混搭第二个圆体。不需要第二个。

## 4. Elevation

这个系统采用**软分层**策略：没有 Material Design 的硬纸片阴影，也没有完全平铺的纯色分层。阴影存在，但始终是焦糖色系的柔和扩散——像棉花糖轻轻浮在桌面上。

### Shadow Vocabulary
- **Ambient-sm** (`0 2px 8px rgba(139, 107, 82, 0.06)`): 轻微分离。用于默认状态的卡片、导航项。
- **Ambient-md** (`0 4px 20px rgba(139, 107, 82, 0.08)`): 标准卡片分层。用于贴纸卡片、表格区域、筛选区。
- **Floating** (`0 6px 24px rgba(139, 107, 82, 0.07)`): Hover 抬起效果。按钮、卡片 hover 时的阴影放大。伴随 scale(1.03-1.06)。
- **Modal** (`0 8px 40px rgba(139, 107, 82, 0.10)`): 弹窗和 Teleport overlay 的分层。

### Named Rules

**The Shadow-Is-Caramel Rule.** 所有 box-shadow 的颜色参数必须是焦糖棕的透明度变体（`rgba(139, 107, 82, ...)`）。禁止纯黑或纯灰阴影。柔和不是靠 blur 半径大，是靠阴影颜色和背景同源。

**The Flat-By-Default Rule.** 表面默认安静。阴影只作为 hover/active/focus 的状态响应出现。静止的卡片已经通过背景色（奶油白 vs 奶油底）完成了分层。

## 5. Components

### 侧边导航（Sidebar Navigation）

像手账本的侧边目录。奶油白底、右侧圆角收束、柔和阴影分界。

- **Shape:** `border-radius: 0 32px 32px 0`（右侧圆角，左侧贴边）
- **Active state:** 蜜桃粉背景（`#F7D6D6`）+ 焦糖棕文字
- **Hover:** 浅奶油底色 `#F5F0EA`，无阴影变化
- **Bottom section:** 分隔线 `1px dashed #E8E0D8`，小狗在下方居中
- **Mobile:** 收窄为 70px，隐藏所有文字标签和用户信息，仅保留图标

### 按钮（Buttons）

像手账上的贴纸——圆润、有按压感。

- **Shape:** 24px 圆角（`var(--radius-lg)`）
- **Primary:** 蜜桃粉背景（`#F7D6D6`）、焦糖棕文字、无边框、16px 字体
- **Hover:** `transform: scale(1.03)` + 浮动阴影，背景微深至 `#F0C4C4`
- **Active:** `transform: scale(0.97)`（棉花糖按压感）
- **Disabled:** 60% opacity，无 hover 效果
- **Ghost/Secondary:** 奶油白背景、`box-shadow: var(--shadow-md)`、hover 时同样 scale + shadow 提升

### 贴纸卡片（Sticker Cards）

Dashboard 的核心容器——每个数据卡片像一张贴纸浮在奶油背景上。

- **Shape:** 24px 圆角（`var(--radius-lg)`）
- **Background:** 奶油白（`#FFFDF9`）
- **Shadow:** `var(--shadow-md)` at rest
- **Hover:** `translateY(-3px)` + `box-shadow: var(--shadow-lg)`
- **Internal:** 大 emoji 图标（28px）→ 小标签（13px, 奶茶灰）→ 大数字（26px, 圆体 700）

### 输入框（Inputs）

像手账本上的横线。无传统边框，用淡淡的 box-shadow 替代。

- **Shape:** 20px 圆角（`var(--radius-md)`）
- **Background:** 奶油白（`#FFFDF9`）
- **Rest:** `box-shadow: 0 0 0 1px #E8E0D8`（细环替代 border）
- **Focus:** `box-shadow: 0 0 0 2px rgba(247, 214, 214, 0.6)`（蜜桃粉微光，不是科技蓝）
- **Placeholder:** 奶茶灰（`#A89880`）→ 在奶油白底上 ≥ 4.5:1

### 表格（Table）

基于 Element Plus 表格组件，全局 CSS 覆盖为奶油风格。

- **Shape:** 20px 圆角容器
- **Header:** `#FDF9F2` 背景、焦糖棕文字、`2px solid #F0E8DC` 底边
- **Row:** Hover 时 `#FDF9F2` 背景色
- **Stripes:** 不使用。保持干净统一的奶油白底色

### 标签/Chip（Tags）

- **收入/成功:** 牛油果绿背景（`#DDE8CF`）、深绿文字（`#5A7A4A`）、12px 圆角、无边框
- **支出/危险:** 蜜桃粉背景（`#F7D6D6`）、深粉文字（`#A06060`）

### 储蓄罐（Savings Jar）

系统的标志性组件。CSS 绘制玻璃罐形状，小狗组件骑在盖子上。

- **Jar body:** 110×130px 玻璃渐变（半透明白色 `rgba(255,253,249,0.7)` + 浅色底），底角 20px
- **Fill:** 金色渐变（`#F7E8B0` → `#EDD890`），高度 = 完成率百分比
- **Lid/base:** 实色棕色渐变（`#E8D5C0` → `#D4C0A8`）
- **Dog:** DogMascot 组件骑在盖子顶部，`z-index: 2`
- **Label:** 罐子名称 + 金额对比 + 进度条 + 百分比
- **Hover:** 显示"存入"和"删除"两个 action 按钮
- **Completed:** 金币满格、小狗切换为 happy 姿态

### 奶油小狗（Dog Mascot）

纯 SVG 手绘组件，五种姿态覆盖所有情绪场景。

- **Poses:** `sitting`（默认）、`lying`（加载/休息）、`peeking`（好奇/欢迎）、`happy`（庆祝/储蓄罐完成）、`waiting`（占位/耐心等待）
- **Colors:** 奶油色系——身体 `#F5E6D8`、高光 `#FDF5EC`、耳朵 `#E0C4A8`、腮红 `#F2C4C4`
- **Filter:** `drop-shadow(0 2px 8px rgba(139, 107, 82, 0.12))`
- **Hover:** `scale(1.06)` 轻微放大
- **Size:** 可配置，缺省 120px

## 6. Do's and Don'ts

### Do:
- **Do** 使用 ZCOOL KuaiLe 圆体做所有标题和按钮文字（`var(--font-round)`）
- **Do** 使用 20-32px 的大圆角（24px 是默认卡片角半径）
- **Do** 保持每个页面的奶油底（`#F8F5F0`）作为主背景，不换成白色或其他颜色
- **Do** 让阴影永远是焦糖棕的透明度变体（`rgba(139, 107, 82, ...)`）
- **Do** 每个空白状态都放小狗（DogMascot 组件），不让用户看到"暂无数据"
- **Do** 按钮 hover 时使用 `scale(1.03)` + 浮动阴影提升，active 时 `scale(0.97)` 按压反馈
- **Do** 输入框 focus 时使用蜜桃粉微光（`rgba(247, 214, 214, 0.6)`），不用科技蓝（`#409EFF`）

### Don't:
- **Don't** 使用 `#409EFF` 或任何接近科技蓝的颜色——这是系统的头号敌人
- **Don't** 使用 `#000000` 或 `#FFFFFF`——可可棕代替黑色，奶油白代替白色
- **Don't** 使用 Material Design 硬阴影、FAB 按钮、卡片浮层模式
- **Don't** 使用深色模式——奶油治愈系不需要暗面
- **Don't** 使用高饱和颜色（sRGB 色域内饱和度 > 40% 即超标）
- **Don't** 使用锐利直角（`border-radius: 0` 禁止，最小圆角 12px）
- **Don't** 使用强烈渐变（线性或径向，尤其是多色渐变）
- **Don't** 使用 `border-left` 或 `border-right` 大于 1px 的彩色侧边条纹做装饰
- **Don't** 使用 `background-clip: text` 的渐变文字效果
- **Don't** 使用企业后台风灰色背景墙和冰冷数据表格
- **Don't** 在产品界面中使用玻璃态模糊效果做纯装饰
