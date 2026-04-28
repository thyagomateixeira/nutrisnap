import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function ProgressBar({ label, value, max, color, unit = 'g' }) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0)
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span>{value}{unit} / {max}{unit}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function WaterBar({ current, goal }) {
  const pct = Math.min(100, goal > 0 ? Math.round((current / goal) * 100) : 0)
  const glasses = Math.round(goal / 250) || 8
  const filled = Math.round(current / 250)
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-500">
        <span>💧 {current}ml de {goal}ml</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {Array.from({ length: glasses }).map((_, i) => (
          <span key={i} className={`text-base transition-all ${i < filled ? 'opacity-100' : 'opacity-25'}`}>💧</span>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  const [meals, setMeals] = useState([])
  const [water, setWater] = useState({ total_ml: 0 })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addingWater, setAddingWater] = useState(false)
  const [deletingMeal, setDeletingMeal] = useState(null)

  const load = useCallback(async () => {
    try {
      const [mealsRes, waterRes, profileRes] = await Promise.all([
        api.get(`/meals?date=${today}`),
        api.get(`/water?date=${today}`),
        api.get('/profile'),
      ])
      setMeals(mealsRes.data)
      setWater(waterRes.data)
      setProfile(profileRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { load() }, [load])

  const totalCal  = meals.reduce((s, m) => s + (Number(m.calories)  || 0), 0)
  const totalProt = meals.reduce((s, m) => s + (Number(m.protein_g) || 0), 0)
  const totalCarb = meals.reduce((s, m) => s + (Number(m.carbs_g)   || 0), 0)
  const totalFat  = meals.reduce((s, m) => s + (Number(m.fat_g)     || 0), 0)
  const totalFiber = meals.reduce((s, m) => s + (Number(m.fiber_g)  || 0), 0)

  // Nomes corretos conforme o banco de dados
  const goalCal   = Number(profile?.goals?.calories)  || 2000
  const goalProt  = Number(profile?.goals?.protein_g) || 150
  const goalCarb  = Number(profile?.goals?.carbs_g)   || 250
  const goalFat   = Number(profile?.goals?.fat_g)     || 65
  const goalFiber = Number(profile?.goals?.fiber_g)   || 25
  const goalWater = Number(profile?.goals?.water_ml)  || 2000

  const calPct = Math.min(100, Math.round((totalCal / goalCal) * 100))

  const addWater = async (ml) => {
    setAddingWater(true)
    try {
      await api.post('/water', { amount_ml: ml })
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setAddingWater(false)
    }
  }

  const deleteMeal = async (id) => {
    setDeletingMeal(id)
    try {
      await api.delete(`/meals/${id}`)
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingMeal(null)
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-4xl animate-bounce">🥗</div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-500 text-sm">{greeting()},</p>
          <h1 className="text-xl font-bold text-slate-800">{user?.name?.split(' ')[0]} 👋</h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-100 flex-shrink-0">
            {profile?.profile?.avatar_url
              ? <img src={profile.profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
            }
          </div>
          <span className="text-xs text-slate-400">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* Calorias */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-slate-500">Calorias hoje</p>
            <p className="text-3xl font-bold text-slate-800">
              {totalCal} <span className="text-lg font-normal text-slate-400">/ {goalCal}</span>
            </p>
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center relative">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#dcfce7" strokeWidth="4" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="#16a34a" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - calPct / 100)}`}
                strokeLinecap="round" />
            </svg>
            <span className="text-xs font-bold text-primary-700 z-10">{calPct}%</span>
          </div>
        </div>

        {/* Macros */}
        <div className="space-y-2">
          <ProgressBar label="Proteína"     value={Math.round(totalProt)}  max={goalProt}  color="bg-blue-400" />
          <ProgressBar label="Carboidrato"  value={Math.round(totalCarb)}  max={goalCarb}  color="bg-yellow-400" />
          <ProgressBar label="Gordura"      value={Math.round(totalFat)}   max={goalFat}   color="bg-red-400" />
        </div>

        {/* Divisor micronutrientes */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Micronutrientes</p>
          <div className="space-y-2">
            <ProgressBar label="Fibras" value={Math.round(totalFiber)} max={goalFiber} color="bg-emerald-400" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: 'Proteína', value: Math.round(totalProt), unit: 'g', color: 'text-blue-600 bg-blue-50' },
              { label: 'Fibras',   value: Math.round(totalFiber), unit: 'g', color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Restante', value: Math.max(0, goalCal - totalCal), unit: 'kcal', color: 'text-slate-600 bg-slate-50' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className={`rounded-xl p-2 text-center ${color}`}>
                <p className="font-bold text-sm">{value}<span className="text-xs font-normal ml-0.5">{unit}</span></p>
                <p className="text-xs opacity-75 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Água */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <p className="font-semibold text-slate-700">Hidratação</p>
        </div>
        <WaterBar current={water.total_ml} goal={goalWater} />
        <div className="flex gap-2 mt-3">
          {[150, 250, 500].map((ml) => (
            <button key={ml} onClick={() => addWater(ml)} disabled={addingWater}
              className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50">
              +{ml}ml
            </button>
          ))}
        </div>
      </div>

      {/* Refeições */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-slate-700">Refeições de hoje</h2>
          <button onClick={() => navigate('/analyze')}
            className="flex items-center gap-1 text-sm text-primary-600 font-medium bg-primary-50 px-3 py-1.5 rounded-xl hover:bg-primary-100 transition-colors">
            📷 Adicionar
          </button>
        </div>

        {meals.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
            <div className="text-4xl mb-2">🍽️</div>
            <p className="text-slate-500 text-sm">Nenhuma refeição registrada hoje</p>
            <button onClick={() => navigate('/analyze')} className="mt-3 text-primary-600 text-sm font-medium">
              Fotografar primeira refeição
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => (
              <div key={meal.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {meal.image_url && (
                        <img src={meal.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-slate-800">{meal.name}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(meal.eaten_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-700">{meal.calories} kcal</span>
                    <button onClick={() => deleteMeal(meal.id)} disabled={deletingMeal === meal.id}
                      className="text-slate-300 hover:text-red-400 transition-colors text-xl leading-none disabled:opacity-50">
                      ×
                    </button>
                  </div>
                </div>
                {meal.foods?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {meal.foods.map((f, i) => (
                      <span key={i} className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full">
                        {f.emoji} {f.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 mt-2 text-xs text-slate-400">
                  <span>P: {Math.round(meal.protein_g)}g</span>
                  <span>C: {Math.round(meal.carbs_g)}g</span>
                  <span>G: {Math.round(meal.fat_g)}g</span>
                  {meal.fiber_g > 0 && <span>F: {Math.round(meal.fiber_g)}g</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
