import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, DollarSign, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { formatVND, tours } from "@/lib/mockData";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

// Last year (2025) — fixed historical data
const lastYear = [120, 180, 240, 200, 310, 420, 510, 460, 380, 340, 290, 470];

// Generate current year data dynamically up to the current month
function buildCurrentYearData() {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), currentMonth + 1, 0).getDate();
  const monthProgress = currentDay / daysInMonth;

  // Deterministic pseudo-random based on month index for stable data
  const seeded = (i: number) => {
    const x = Math.sin((i + 1) * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  return lastYear.map((prev, i) => {
    if (i > currentMonth) return null; // future months: no data yet
    // Growth 8%-22% YoY with some variance
    const growth = 1.08 + seeded(i) * 0.14;
    let value = Math.round(prev * growth);
    if (i === currentMonth) value = Math.round(value * monthProgress); // partial current month
    return value;
  });
}

function AdminDashboard() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const lastYearLabel = currentYear - 1;
  const currentMonth = now.getMonth();

  const currentYearData = buildCurrentYearData();

  const revenueData = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"].map((m, i) => ({
    month: m,
    [`${lastYearLabel}`]: lastYear[i],
    [`${currentYear}`]: currentYearData[i],
  }));

  // YTD totals through current month for comparison
  const ytdCurrent: number = currentYearData.slice(0, currentMonth + 1).reduce<number>((a, b) => a + (b ?? 0), 0);
  const ytdLast = lastYear.slice(0, currentMonth + 1).reduce((a, b) => a + b, 0);
  const revenueDeltaPct = ytdLast > 0 ? ((ytdCurrent - ytdLast) / ytdLast) * 100 : 0;

  // Total revenue (in millions VND) → convert to VND
  const totalRevenueVnd = ytdCurrent * 1_000_000;

  // Derived KPIs scaling with revenue
  const totalOrders = Math.round(ytdCurrent * 0.31);
  const totalCustomers = Math.round(ytdCurrent * 1.32);
  const conversion = (4.2 + (revenueDeltaPct > 0 ? 0.6 : 0)).toFixed(1);

  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

  const stats = [
    { label: "Tổng doanh thu (YTD)", value: formatVND(totalRevenueVnd), icon: DollarSign, change: fmtPct(revenueDeltaPct), color: "text-emerald-600 bg-emerald-50" },
    { label: "Tổng đơn (YTD)", value: totalOrders.toLocaleString("vi-VN"), icon: CalendarCheck, change: fmtPct(revenueDeltaPct * 0.7), color: "text-cyan-600 bg-cyan-50" },
    { label: "Khách hàng (YTD)", value: totalCustomers.toLocaleString("vi-VN"), icon: Users, change: fmtPct(revenueDeltaPct * 1.4), color: "text-violet-600 bg-violet-50" },
    { label: "Tỷ lệ chuyển đổi", value: `${conversion}%`, icon: TrendingUp, change: "+0.6%", color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          Cập nhật: {now.toLocaleString("vi-VN")}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold font-heading mt-1">{s.value}</p>
                <p className="text-xs text-emerald-600 mt-1">{s.change} so với cùng kỳ {lastYearLabel}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl inline-flex items-center justify-center ${s.color}`}><s.icon className="h-5 w-5" /></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6 mt-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Doanh thu theo tháng (triệu VND)</h2>
            <span className="text-xs text-muted-foreground">So sánh {lastYearLabel} vs {currentYear}</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.015 220)" />
                <XAxis dataKey="month" stroke="oklch(0.5 0.03 230)" />
                <YAxis stroke="oklch(0.5 0.03 230)" />
                <Tooltip />
                <Legend />
                <Bar dataKey={`${lastYearLabel}`} fill="oklch(0.85 0.05 220)" radius={[6, 6, 0, 0]} />
                <Bar dataKey={`${currentYear}`} fill="oklch(0.7 0.14 200)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * Tháng {currentMonth + 1}/{currentYear} là dữ liệu lũy kế đến ngày hiện tại.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Tours hot</h2>
          <div className="space-y-3">
            {tours.slice(0, 5).map((t, i) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                <img src={t.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.reviews} đánh giá</p>
                </div>
                <p className="text-sm font-bold text-primary">{formatVND(t.price)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
