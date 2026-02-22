import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { ReactionContract } from "@/services/supabaseCollum/reactionContract";

interface RevenueChartProps {
  contracts: ReactionContract[];
}

export function RevenueChart({ contracts }: RevenueChartProps) {
  // 1. Generate an array for the last 7 days (including today)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    return startOfDay(subDays(new Date(), 6 - i));
  });

  // 2. Map data: Count revenue for each day
  const chartData = last7Days.map((day) => {
    // Determine the total revenue on this specific day
    const dailyRevenue = contracts.reduce((acc, contract) => {
      // Only count active or paid contracts
      if (contract.status !== "ACTIVE" && contract.status !== "PAID")
        return acc;

      const contractDate = new Date(contract.created_at);
      if (isSameDay(contractDate, day)) {
        // Platform fee is 10%
        return acc + contract.pricing_value * 0.1;
      }
      return acc;
    }, 0);

    return {
      date: format(day, "dd. MMM", { locale: de }), // e.g. "12. Okt"
      umsatz: dailyRevenue,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e5e7eb"
        />
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `€${value}`}
        />
        <Tooltip
          formatter={(value: number) => [`€ ${value.toFixed(2)}`, "Umsatz"]}
          labelStyle={{
            color: "black",
            fontWeight: "bold",
            marginBottom: "4px",
          }}
          contentStyle={{
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Line
          type="monotone"
          dataKey="umsatz"
          stroke="#10b981" // emerald-500
          strokeWidth={3}
          dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "white" }}
          activeDot={{ r: 6, fill: "#10b981", stroke: "white", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
