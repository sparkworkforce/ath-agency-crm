'use client'

import { useState, useEffect } from 'react'

interface CohortData { month: string; clientCount: number; totalRevenue: number; avgRevenue: number }
interface Data { cohorts: CohortData[]; ltv: number; churnRate: number; avgClientAge: number }

export default function RevenueAnalytics() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agency/analytics').then(r => r.ok ? r.json() : null).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading analytics...</p>
  if (!data) return <p className="text-sm text-gray-400 py-4">No data available</p>

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Client LTV</p>
          <p className="text-lg font-bold text-emerald-600">${data.ltv.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Churn Rate</p>
          <p className="text-lg font-bold text-amber-600">{data.churnRate}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Client Age</p>
          <p className="text-lg font-bold text-blue-600">{data.avgClientAge}d</p>
        </div>
      </div>

      {/* Cohort table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue by Cohort</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cohort</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Clients</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Avg/Client</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.cohorts.map(c => (
              <tr key={c.month}>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{c.month}</td>
                <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">{c.clientCount}</td>
                <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-gray-100">${c.totalRevenue.toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-gray-500">${c.avgRevenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
