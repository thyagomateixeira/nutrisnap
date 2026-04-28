import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 160
        canvas.height = 160
        const ctx = canvas.getContext('2d')
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 160, 160)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const activityOptions = [
  { value: 'sedentary',   label: 'Sedentário (sem exercício)' },
  { value: 'light',       label: 'Leve (1–3x/semana)' },
  { value: 'moderate',    label: 'Moderado (3–5x/semana)' },
  { value: 'active',      label: 'Ativo (6–7x/semana)' },
  { value: 'very_active', label: 'Muito ativo (2x/dia)' },
]

const goalOptions = [
  { value: 'lose',     label: '🔽 Perder peso' },
  { value: 'maintain', label: '➡️ Manter peso' },
  { value: 'gain',     label: '🔼 Ganhar massa' },
]

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isFirstLogin = searchParams.get('firstLogin') === 'true'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [avatar, setAvatar] = useState(null)
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    age: '', gender: 'male', height_cm: '', weight_kg: '',
    activity_level: 'moderate', goal: 'maintain', water_goal_ml: 2000,
  })

  useEffect(() => {
    api.get('/profile').then(r => {
      const p = r.data.profile
      const g = r.data.goals
      setForm({
        age:            p?.age            || '',
        gender:         p?.sex === 'F' ? 'female' : 'male',
        height_cm:      p?.height_cm      || '',
        weight_kg:      p?.weight_kg      || '',
        activity_level: p?.activity_level || 'moderate',
        goal:           g?.goal           || 'maintain',
        water_goal_ml:  g?.water_ml       || 2000,
      })
      if (p?.avatar_url) setAvatar(p.avatar_url)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setAvatar(compressed)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setSaveError('')
    try {
      await api.put('/profile', {
        age:            Number(form.age),
        gender:         form.gender,
        height_cm:      Number(form.height_cm),
        weight_kg:      Number(form.weight_kg),
        activity_level: form.activity_level,
        goal:           form.goal,
        water_goal_ml:  Number(form.water_goal_ml),
        avatar_url:     avatar || undefined,
      })
      setSuccess(true)
      if (isFirstLogin) {
        setTimeout(() => navigate('/'), 1500)
      } else {
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      console.error(err)
      setSaveError(err.response?.data?.error || 'Erro ao salvar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-4xl animate-bounce">👤</div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-4">
      {isFirstLogin && (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 text-center">
          <p className="text-primary-700 font-semibold">👋 Bem-vindo ao NutriSnap!</p>
          <p className="text-primary-600 text-sm mt-1">Preencha seus dados para calcularmos suas metas personalizadas.</p>
        </div>
      )}

      <h1 className="text-xl font-bold text-slate-800">👤 Meu Perfil</h1>

      {/* Card do usuário */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-200 hover:border-primary-500 transition-colors focus:outline-none group">
            {avatar
              ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
            }
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-medium">Alterar</span>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="font-semibold text-slate-800">{user?.name}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="text-xs text-primary-600 mt-0.5 hover:underline">
            Alterar foto
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl text-center font-medium">
          ✅ {isFirstLogin ? 'Perfil salvo! Redirecionando...' : 'Perfil atualizado com sucesso!'}
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl text-center font-medium">
          ❌ {saveError}
        </div>
      )}

      <form onSubmit={save} className="space-y-4">
        {/* Dados físicos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-700">Dados físicos</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Idade</label>
              <input type="number" min="10" max="120" value={form.age}
                onChange={e => set('age', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: 30" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Sexo</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Altura (cm)</label>
              <input type="number" min="100" max="250" value={form.height_cm}
                onChange={e => set('height_cm', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: 175" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Peso (kg)</label>
              <input type="number" min="30" max="300" step="0.1" value={form.weight_kg}
                onChange={e => set('weight_kg', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: 70" />
            </div>
          </div>
        </div>

        {/* Atividade e objetivo */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-700">Atividade e objetivo</h2>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Nível de atividade</label>
            <select value={form.activity_level} onChange={e => set('activity_level', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              {activityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-2 block">Objetivo</label>
            <div className="grid grid-cols-3 gap-2">
              {goalOptions.map(o => (
                <button key={o.value} type="button" onClick={() => set('goal', o.value)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium transition-colors ${
                    form.goal === o.value ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Meta de água */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h2 className="font-semibold text-slate-700">💧 Meta de água diária</h2>
          <div className="flex items-center gap-3">
            <input type="number" min="500" max="5000" step="100" value={form.water_goal_ml}
              onChange={e => set('water_goal_ml', e.target.value)}
              className="w-32 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-center font-semibold"
            />
            <span className="text-slate-500 text-sm">ml por dia</span>
          </div>
          <div className="flex gap-2">
            {[1500, 2000, 2500, 3000].map(v => (
              <button key={v} type="button" onClick={() => set('water_goal_ml', v)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  Number(form.water_goal_ml) === v ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}>
                {v}ml
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors">
          {saving ? 'Salvando...' : isFirstLogin ? '🚀 Salvar e começar' : '💾 Salvar perfil'}
        </button>
      </form>

      {!isFirstLogin && (
        <button onClick={logout}
          className="w-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 font-medium py-3 rounded-xl transition-colors">
          Sair da conta
        </button>
      )}
    </div>
  )
}
