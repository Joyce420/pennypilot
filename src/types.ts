export type TransactionType = 'expense' | 'income';

export interface Category {
  name: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class or hex
  bgColor: string; // Tailwind background color class
}

export interface PaymentMethod {
  name: string;
  icon: string; // Lucide icon name
}

export interface Transaction {
  id: string;
  amount: number;
  note: string;
  category: string;
  payment: string;
  date: string; // Format: YYYY-MM-DD
  time: string; // Format: HH:MM
  type: TransactionType;
}

export interface CategoryBudget {
  category: string;
  amount: number; // Allocated budget (e.g., 2000)
}

export interface BudgetState {
  total: number;
  categoryBudgets: CategoryBudget[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model'; // Matches @google/genai format
  text: string;
  timestamp: string;
}
