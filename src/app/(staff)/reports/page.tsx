"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import RoleGuard from "@/components/auth/role-guard";
import AppHeader from "@/components/layout/app-header";
import PageShell from "@/components/layout/page-shell";
import { getPaidOrdersReport, type ReportSummary } from "@/lib/services/reports.service";
import OrderHistory from "@/components/orders/order-history";

const emptySummary: ReportSummary = {
  totalRevenue: 0,
  paidOrdersCount: 0,
  averageCheck: 0,
  totalItemsSold: 0,
  topItems: [],
  statusCounts: [],
  dailyRevenue: [],
};

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [loading, setLoading] = useState(true);

  async function loadReport() {
    try {
      setLoading(true);
      const report = await getPaidOrdersReport();
      setSummary(report.summary);
    } catch (error) {
      console.error(error);
      toast.error("Hisobotlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  const maxRevenue =
    summary.dailyRevenue.length > 0
      ? Math.max(...summary.dailyRevenue.map((d) => d.revenue), 1)
      : 1;

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AppHeader
        title="Hisobotlar"
        subtitle="Paid buyurtmalar asosida savdo statistikasi"
      />

      <PageShell>
        {loading ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            Hisobotlar yuklanmoqda...
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Umumiy tushum"
                value={`${summary.totalRevenue} so‘m`}
              />
              <StatCard
                title="To‘langan buyurtmalar"
                value={String(summary.paidOrdersCount)}
              />
              <StatCard
                title="O‘rtacha chek"
                value={`${summary.averageCheck} so‘m`}
              />
              <StatCard
                title="Sotilgan pozitsiyalar"
                value={String(summary.totalItemsSold)}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  Eng ko‘p sotilgan taomlar
                </h2>

                <div className="mt-4 space-y-3">
                  {summary.topItems.length === 0 ? (
                    <p className="text-gray-500">Hali ma’lumot yo‘q</p>
                  ) : (
                    summary.topItems.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} dona sotilgan
                          </p>
                        </div>
                        <p className="font-bold text-gray-900">
                          {item.revenue} so‘m
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  Statuslar kesimi
                </h2>

                <div className="mt-4 space-y-3">
                  {summary.statusCounts.length === 0 ? (
                    <p className="text-gray-500">Hali ma’lumot yo‘q</p>
                  ) : (
                    summary.statusCounts.map((item, index) => (
                      <div
                        key={`${item.status}-${index}`}
                        className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                      >
                        <p className="font-medium text-gray-900">{item.status}</p>
                        <p className="font-bold text-gray-900">{item.count}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Kunlik tushum grafigi
                </h2>
                <button
                  onClick={loadReport}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Yangilash
                </button>
              </div>

              <div className="mt-6">
                {summary.dailyRevenue.length === 0 ? (
                  <p className="text-gray-500">Grafik uchun ma’lumot yo‘q</p>
                ) : (
                  <div className="space-y-4">
                    {summary.dailyRevenue.map((day) => {
                      const widthPercent = Math.max(
                        8,
                        Math.round((day.revenue / maxRevenue) * 100)
                      );

                      return (
                        <div key={day.date}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">
                              {day.date}
                            </span>
                            <span className="text-gray-500">
                              {day.orders} ta buyurtma
                            </span>
                          </div>

                          <div className="h-10 overflow-hidden rounded-xl bg-gray-100">
                            <div
                              className="flex h-full items-center rounded-xl bg-indigo-600 px-3 text-sm font-medium text-white"
                              style={{ width: `${widthPercent}%` }}
                            >
                              {day.revenue} so‘m
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <OrderHistory />
          </div>
        )}
      </PageShell>
    </RoleGuard>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  );
}