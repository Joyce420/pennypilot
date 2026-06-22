import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY" && API_KEY !== "") {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch {
    // will fall back to local engine
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message, history, transactions, budget } = req.body;
  if (!message) {
    res.status(400).json({ error: "Message is required." });
    return;
  }

  const txList = Array.isArray(transactions) ? transactions : [];
  const bState = budget || { total: 0, categoryBudgets: [] };

  const totalExpense = txList.filter((tx: any) => tx.type === "expense").reduce((s: number, tx: any) => s + tx.amount, 0);
  const totalIncome = txList.filter((tx: any) => tx.type === "income").reduce((s: number, tx: any) => s + tx.amount, 0);
  const actualBalance = totalIncome - totalExpense;

  const categorySpent: Record<string, number> = {};
  txList.filter((tx: any) => tx.type === "expense").forEach((tx: any) => {
    categorySpent[tx.category] = (categorySpent[tx.category] || 0) + tx.amount;
  });

  const budgetsSummary = Array.isArray(bState.categoryBudgets)
    ? bState.categoryBudgets.map((cb: any) => {
        const spent = categorySpent[cb.category] || 0;
        const ratio = cb.amount > 0 ? ((spent / cb.amount) * 100).toFixed(1) : "0.0";
        return `- **${cb.category}**: 预算 ¥${cb.amount}, 已用 ¥${spent.toFixed(2)} (${ratio}%)`;
      }).join("\n")
    : "无自定义分类预算。";

  const systemInstruction = `你是一位温柔、贴心且极其专业的AI财务小管家（名叫 Penny）。
根据用户当前的记账流水和预算详情，提供个性化的理财与消费建议。
用户当前账单与预算统计：
1. **本月结余**：收入 ¥${totalIncome.toFixed(2)}，支出 ¥${totalExpense.toFixed(2)}，结余 ¥${actualBalance.toFixed(2)}。
2. **总预算上限**：¥${bState.total.toFixed(2)}。
3. **分类预算实况**：
${budgetsSummary}

回答要求：语气亲和，逻辑清晰，使用 Markdown，多用断落、粗体及数字列表，不说教，只关注用户真实数字。`;

  if (ai) {
    try {
      const contents: any[] = [];
      if (Array.isArray(history)) {
        history.slice(-8).forEach((msg: any) => {
          contents.push({ role: msg.role === "model" ? "model" : "user", parts: [{ text: msg.text }] });
        });
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents,
        config: { systemInstruction, temperature: 0.7 },
      });
      res.json({ text: response.text || "抱歉，稍微有些走神了，能再说一遍吗？" });
      return;
    } catch {
      // fall through to local engine
    }
  }

  // Local fallback engine
  const warningCats: string[] = [], dangerCats: string[] = [];
  if (Array.isArray(bState.categoryBudgets)) {
    bState.categoryBudgets.forEach((cb: any) => {
      const spent = categorySpent[cb.category] || 0;
      if (spent > cb.amount) dangerCats.push(cb.category);
      else if (spent >= cb.amount * 0.9) warningCats.push(cb.category);
    });
  }

  let reply = "";
  if (message.includes("分析") || message.includes("消费") || message.includes("结构") || message.includes("账单")) {
    reply = `### 📊 本期消费深度分析

- **预算总进度**：总预算 **¥${bState.total.toFixed(2)}**，已消耗 **¥${totalExpense.toFixed(2)}**，利用率 **${bState.total > 0 ? ((totalExpense / bState.total) * 100).toFixed(1) : "0"}%**。
- **收支相抵**：收入 **¥${totalIncome.toFixed(2)}**，支出 **¥${totalExpense.toFixed(2)}**，净余额 **¥${actualBalance.toFixed(2)}**。

#### ⚠️ 预算预警：
${dangerCats.length > 0
  ? `🚨 **超支分类**：\n${dangerCats.map(c => `- **${c}**：已超预算，建议冻结非刚性支出。`).join("\n")}`
  : warningCats.length > 0
  ? `⚠️ **临近上限（≥90%）**：\n${warningCats.map(c => `- **${c}**：接近预算，注意零碎花销。`).join("\n")}`
  : "✨ 所有品类预算均在健康状态（低于90%），继续保持！"}`;
  } else if (message.includes("预算") || message.includes("省钱") || message.includes("建议")) {
    reply = `### 💡 智能省钱建议

1. **品类微调**：餐饮若超支，可适当上调 10%~15%，同时压缩娱乐/购物配额，维持总支出平衡。
2. **清理订阅**：检查自动续费，砍掉近两周未用的服务，每月可省 ¥30~¥100。
3. **72小时冷却法**：购物车里超过 ¥200 的非必需品，冷却三天再决定——80% 的冲动会消退。`;
  } else {
    reply = `你好！我是你的 AI 财务助手 **Penny** 💖

我已同步你的账单数据，可以帮你：
1. **分析消费结构**：问我"分析我本月的消费"
2. **制定省钱计划**：问我"有什么省钱建议"

请问需要我做什么理财参谋吗？😊`;
  }

  res.json({ text: reply });
}
