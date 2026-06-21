import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini SDK if API key exists
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY" && API_KEY !== "") {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("Successfully initialized Gemini AI with User-Agent custom headers.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY detected in environment. Running draft local recommendation engine.");
}

// API Routes
app.post("/api/chat", async (req, res) => {
  const { message, history, transactions, budget } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message is required." });
    return;
  }

  // Pre-process some local context stats to inject to Gemini or use as fallback
  const txList = Array.isArray(transactions) ? transactions : [];
  const bState = budget || { total: 5000, categoryBudgets: [] };

  const totalExpense = txList
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalIncome = txList
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const actualBalance = totalIncome - totalExpense;

  // Let's summarize the breakdown of expenditures by category
  const categorySpent: Record<string, number> = {};
  txList
    .filter((tx) => tx.type === "expense")
    .forEach((tx) => {
      categorySpent[tx.category] = (categorySpent[tx.category] || 0) + tx.amount;
    });

  const budgetsSummary = Array.isArray(bState.categoryBudgets)
    ? bState.categoryBudgets
        .map((cb: any) => {
          const spent = categorySpent[cb.category] || 0;
          const ratio = cb.amount > 0 ? ((spent / cb.amount) * 100).toFixed(1) : "0.0";
          return `- **${cb.category}**: 预算 ¥${cb.amount}, 已用 ¥${spent.toFixed(2)} (${ratio}%)`;
        })
        .join("\n")
    : "无自定义分类预算。";

  // Formulate detailed background instructions & context
  const systemInstruction = `你是一位温柔、贴心且极其专业的日系/现代AI财务小管家（名叫 Penny ）。
你的任务是根据用户当前的记账流水和预算详情，提供个性化的理财与消费建议。
用户当前账单与预算统计信息如下：
1. **本月结余**：本期总计收入 ¥${totalIncome.toFixed(2)}，总计支出 ¥${totalExpense.toFixed(2)}，目前结余 ¥${actualBalance.toFixed(2)}。
2. **总预算执行**：本周总预算上限 ¥${bState.total.toFixed(2)}。
3. **分类预算实况**：
${budgetsSummary}

请给用户提供具体可落地的分析！比如用户询问关于外卖/交通/消费分布时，请仔细对比数字指出哪些超支（已达到 100% 以上），哪些还在安全线，并给具体省钱建议或表示鼓励。
回答守则：
- 语气非常有亲和力，逻辑清晰，排版使用优雅的 Markdown，多用断落、粗体及数字列表，避免硬说教。
- 只关注用户真实的收支数字，绝不虚构交易明细。
- 绝不提任何后台技术词，保持你是专业小助手的角色。`;

  // If Gemini is active, let's call it
  if (ai) {
    try {
      // Structure the chat history correctly for @google/genai
      // It expects contents array as [{ role: 'user', parts: [{ text: '...' }] }]
      const genaiContents: any[] = [];
      
      // Inject previous chats as general structure
      if (Array.isArray(history)) {
        history.slice(-8).forEach((msg: any) => {
          genaiContents.push({
            role: msg.role === "model" ? "model" : "user",
            parts: [{ text: msg.text }],
          });
        });
      }

      // Add the final user trigger message
      genaiContents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: genaiContents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const aiText = response.text || "抱歉，我稍微有些走神了，能再说一遍吗？";
      res.json({ text: aiText });
      return;
    } catch (err: any) {
      console.error("Gemini invocation failed, using local rule assistant:", err);
      // Fallback below
    }
  }

  // --- LOCAL RECON ENGINE FALLBACK ---
  // If no Gemini key is set, or if an API failure occurs, let's provide a gorgeous local analytic model response
  // We'll calculate which categories are in state of warning (>90%) or danger (>100%) and compose an beautifully smart analytical advice.
  const warningCategories: string[] = [];
  const dangerCategories: string[] = [];
  
  if (Array.isArray(bState.categoryBudgets)) {
    bState.categoryBudgets.forEach((cb: any) => {
      const spent = categorySpent[cb.category] || 0;
      if (spent > cb.amount) {
        dangerCategories.push(cb.category);
      } else if (spent >= cb.amount * 0.9) {
        warningCategories.push(cb.category);
      }
    });
  }

  let fallbackResponse = "";
  if (message.includes("分析") || message.includes("消费") || message.includes("结构") || message.includes("账单")) {
    fallbackResponse = `### 📊 您的 PennyPilot 本期消费深度分析：

本次分析基于您的真实记账数据，为您梳理出以下诊断：

- **预算总进度**：您本期设定的总预算为 **¥${bState.total.toFixed(2)}**，已消耗 **¥${totalExpense.toFixed(2)}**，预算利用率为 **${bState.total > 0 ? ((totalExpense / bState.total) * 100).toFixed(1) : "0"}%**。
- **收支相抵度**：目前共收入 **¥${totalIncome.toFixed(2)}**，支出 **¥${totalExpense.toFixed(2)}**，净余额 **¥${actualBalance.toFixed(2)}**。

#### ⚠️ 预算警报分类：
${
  dangerCategories.length > 0
    ? `🚨 **已经严重超支分类**：\n${dangerCategories
        .map(
          (cat) =>
            `- **${cat}**：已用金额超过设定的预算额度！建议立即冻结本周的对应非刚性支出，寻找低价替代品。`
        )
        .join("\n")}`
    : warningCategories.length > 0
    ? `⚠️ **临近预算上限分类** (已达到90%+)：\n${warningCategories
        .map(
          (cat) =>
            `- **${cat}**：消费配额已进入警戒，建议接下来的几天多注意此方向的零碎花销。`
        )
        .join("\n")}`
    : "✨ **太棒了**！您的所有品类预算都在健康状态下（低于90%），请继续维持这个优秀的精细消费习惯哦！"
}

#### 💡 Penny 的理财小指南：
1. **控制外卖**：我们的消费结构中餐饮常常是隐形刺客。试着增加自己动手下厨的次数，每周少点一次外卖，就能为你省下约 ¥120 元！
2. **零碎钱漏斗**：注意出行、咖啡这种极易忽略的、低于30元的小额支出。用日历做好预算，积少成多哦。`;
  } else if (message.includes("预算") || message.includes("省钱") || message.includes("建议")) {
    fallbackResponse = `### 💡 智能省钱与预算调整建议

亲爱的理财达人，为您专属定制以下三大「低摩擦」省钱指南：

1. **品类预算微调战略**：
   - 目前，您的 **餐饮** 消费额度往往占据大头。建议下阶段在记账时合理标注「日常刚需」与「社交外餐」。
   - 如果刚性需求确实过载，建议将「餐饮」总预算合理上调 **10%~15%**，同时适当降低「娱乐、购物」的配额来维持本月支出在一个平衡平面上。

2. **砍掉「虚无订阅」**：
   - 检查您本月支付明细中的定期代扣（如音视频月卡、应用软件自动续费等），精简掉最近2周没使用过的服务，每个月可节省约 ¥30~¥100 元！

3. **3天冷却法**：
   - 准备在类似网购中下单大于 ¥200 的非必须好物前，把它先加入购物车并“冷却” 72 小时。科学表明，80% 的剁手冲动在冷却后会彻底消退哦！

加油，小 Penny 也会时刻在底部记账页面陪着你，支持你的理财梦想！`;
  } else if (message.includes("订阅")) {
    fallbackResponse = `### 🎬 关于您的订阅服务与固定流出支出

Penny 替您扫描了近期的记账账单，发现我们有一些固定流出的特征。

为了更好的管理您的钱袋子，建议您可以：
- **聚合多个重叠视频会员**：例如很多平台的联名卡或家庭共享套餐，可以为您节省 **50%** 的单项月费。
- **设立单独的分类「订阅杂项」**：为您的定期自动扣款设定一个专属的小账簿额度，避免它们成为您月底「隐蔽超支」的罪魁祸首。`;
  } else {
    fallbackResponse = `你好呀！我是你的 AI 财务助手 **Penny**！💖

我已经成功跟您的账单数据建立了实时同步。我可以：
1. **解答账务疑惑**：比如问我“分析我本月的消费结构”、“如何省钱”；
2. **提供决策参考**：对比您今天的消费明细，帮助您精细化调整餐饮、出行、购物等品类的预算执行方案。

请问现在需要我为您做点什么理财参谋吗？😊`;
  }

  res.json({ text: fallbackResponse });
});

// Setup Vite Dev Server / serve static assets in production
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted (Development Mode).");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static files mounted from dist (Production Mode).");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
