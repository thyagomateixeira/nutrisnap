import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Calendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [dayData, setDayData] = useState({}) // { 'YYYY-MM-DD': { calories, meal_count, water_ml } }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/calendar?year=${year}&month=${month}`)
      .then(r => {
        // API retorna { meals: [], water: [] }
        const { meals = [], water = [] } = r.data

        const map = {}

        meals.forEach(m => {
          const date = String(m.date).substring(0, 10)
          if (!map[date]) map[date] = { calories: 0, meal_count: 0, water_ml: 0 }
          map[date].calories   = Number(m.total_calories) || 0
          map[date].meal_count = Number(m.meal_count)     || 0
        })

        water.forEach(w => {
          const date = String(w.date).substring(0, 10)
          if (!map[date]) map[date] = { calories: 0, meal_count: 0, water_ml: 0 }
          map[date].water_ml = Number(w.total_ml) || 0
        })

        setDayData(map)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [year, month])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const todayStr = now.toISOString().split('T')[0]

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const sortedDays = Object.entries(dayData)
    .filter(([, v]) => v.meal_count > 0)
    .sort(([a], [b]) => b.localeCompare(a))

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-800">📅 Histórico</h1>

      {/* Navegação de mês */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm">
        <button onClick={prevMonth} className="text-slate-400 hover:text-slate-700 text-2xl w-8 text-center">‹</button>
        <span className="font-semibold text-slate-800 capitalize">{monthName}</span>
        <button onClick={nextMonth} className="text-slate-400 hover:text-slate-700 text-2xl w-8 text-center">›</button>
      </div>

      {/* Grade do calendário */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="grid grid-cols-7 mb-2">
          {['D','S','T','Q','Q','S','S'].map((d, i) => (
            <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Carregando...</div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const entry = dayData[dateStr]
              const isToday = dateStr === todayStr
              const hasMeals = entry?.meal_count > 0

              return (
                <div key={dateStr}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-colors ${
                    isToday
                      ? 'bg-primary-600 text-white font-bold'
                      : hasMeals
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-400'
                  }`}>
                  <span>{day}</span>
                  {hasMeals && (
                    <span className={`text-[9px] ${isToday ? 'text-white opacity-80' : 'text-primary-400'}`}>
                      {entry.meal_count}x
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Lista do mês */}
      <div className="space-y-2">
        {sortedDays.length === 0 && !loading ? (
          <div className="text-center py-10 text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">Nenhum registro neste mês</p>
          </div>
        ) : (
          sortedDays.map(([dateStr, entry]) => (
            <div key={dateStr} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-800 capitalize">
                    {new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs text-slate-400">{entry.meal_count} refeição(ões)</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-600">{entry.calories} kcal</p>
                  <p className="text-xs text-blue-500">💧 {entry.water_ml}ml</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
