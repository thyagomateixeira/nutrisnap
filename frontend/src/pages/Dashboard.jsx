import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function MacroBar({ label, value, max, color }) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0)
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span>{value}g / {max}g</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function WaterDots({ current, goal }) {
  const glasses = Math.round(goal / 250) || 8
  const filled = Math.round(current / 250)
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {Array.from({ length: glasses }).map((_, i) => (
        <div
          key={i}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all ${
            i < filled ? 'bg-blue-100' : 'bg-slate-100'
          }`}
        >
          💧
        </div>
      ))}
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

  const totalCal = meals.reduce((s, m) => s + (m.calories || 0), 0)
  const totalProt = meals.reduce((s, m) => s + (m.protein_g || 0), 0)
  const totalCarb = meals.reduce((s, m) => s + (m.carbs_g || 0), 0)
  const totalFat  = meals.reduce((s, m) => s + (m.fat_g   || 0), 0)

  const goalCal  = profile?.goals?.calories_goal  || 2000
  const goalProt = profile?.goals?.protein_goal   || 150
  const goalCarb = profile?.goals?.carbs_goal     || 250
  const goalFat  = profile?.goals?.fat_goal       || 65
  const goalWater = profile?.goals?.water_goal_ml || 2000

  const calPct = Math.min(100, Math.round((totalCal / goalCal) * 100))

  const addWater = async (ml) => {
    setAddingWater(true)
    try {
      await api.post('/water', { amount_ml: ml, logged_at: new Date().toISOString() })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-4xl animate-bounce">🥗</div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-500 text-sm">{greeting()},</p>
          <h1 className="text-xl font-bold text-slate-800">{user?.name?.split(' ')[0]} 👋</h1>
        </div>
        <div className="text-right text-xs text-slate-400">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Calorias */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm text-slate-500">Calorias hoje</p>
            <p className="text-3xl font-bold text-slate-800">
              {totalCal} <span className="text-lg font-normal text-slate-400">/ {goalCal}</span>
            </p>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-primary-200 flex items-center justify-center relative">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#dcfce7" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke="#16a34a" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - calPct / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xs font-bold text-primary-700 z-10">{calPct}%</span>
          </div>
        </div>

        <div className="space-y-2">
          <MacroBar label="Proteína" value={Math.round(totalProt)} max={goalProt} color="bg-blue-400" />
          <MacroBar label="Carboidrato" value={Math.round(totalCarb)} max={goalCarb} color="bg-yellow-400" />
          <MacroBar label="Gordura" value={Math.round(totalFat)} max={goalFat} color="bg-red-400" />
        </div>
      </div>

      {/* Água */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-1">
          <p className="font-semibold text-slate-700">💧 Água</p>
          <p className="text-sm text-slate-500">{water.total_ml}ml / {goalWater}ml</p>
        </div>
        <WaterDots current={water.total_ml} goal={goalWater} />
        <div className="flex gap-2 mt-3">
          {[150, 250, 500].map((ml) => (
            <button
              key={ml}
              onClick={() => addWater(ml)}
              disabled={addingWater}
              className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50"
            >
              +{ml}ml
            </button>
          ))}
        </div>
      </div>

      {/* Refeições */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-slate-700">Refeições de hoje</h2>
          <button
            onClick={() => navigate('/analyze')}
            className="flex items-center gap-1 text-sm text-primary-600 font-medium bg-primary-50 px-3 py-1.5 rounded-xl hover:bg-primary-100 transition-colors"
          >
            📷 Adicionar
          </button>
        </div>

        {meals.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
            <div className="text-4xl mb-2">🍽️</div>
            <p className="text-slate-500 text-sm">Nenhuma refeição registrada hoje</p>
            <button
              onClick={() => navigate('/analyze')}
              className="mt-3 text-primary-600 text-sm font-medium"
            >
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
                        <img src={meal.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-slate-800">{meal.name}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(meal.eaten_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary-700">{meal.calories} kcal</span>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      disabled={deletingMeal === meal.id}
                      className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none disabled:opacity-50"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {meal.foods && meal.foods.length > 0 && (
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
