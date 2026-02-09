
export enum EntryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum Category {
  SALARY = 'Salário',
  INVESTMENT = 'Investimento',
  MONTHLY = 'Mensal',
  LEISURE = 'Lazer',
  FOOD = 'Alimentação',
  TRANSPORT = 'Transporte',
  HEALTH = 'Saúde',
  EDUCATION = 'Educação',
  CREDIT_CARD = 'Cartão de Crédito',
  OTHERS = 'Outros'
}

export interface BudgetEntry {
  id: string;
  description: string;
  amount: number;
  type: EntryType;
  category: Category;
  date: string;
  monthKey: string; // Formato YYYY-MM
  isPaid: boolean;
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  percentageUsed: number;
}

export interface MonthHistory {
  [monthKey: string]: BudgetEntry[];
}
