import type { LucideIcon } from "lucide-react";
import {
  CarFront,
  HeartPulse,
  Landmark,
  Laptop,
  Plane,
  Popcorn,
  Receipt,
  Shield,
  ShoppingBag,
  Target,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

import type { Goal, TransactionCategory } from "@/lib/mockData";

export const categoryIconMap: Record<TransactionCategory, LucideIcon> = {
  Income: Landmark,
  "Food & Dining": UtensilsCrossed,
  Transport: CarFront,
  Entertainment: Popcorn,
  Utilities: Receipt,
  Shopping: ShoppingBag,
  Health: HeartPulse,
  Savings: Wallet,
};

export const dashboardIconMap = {
  wallet: Wallet,
  "arrow-up": TrendingUp,
  "arrow-down": TrendingDown,
  target: Target,
} as const;

export const goalIconMap: Record<Goal["icon"], LucideIcon> = {
  shield: Shield,
  laptop: Laptop,
  plane: Plane,
};
