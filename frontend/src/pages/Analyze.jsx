import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Analyze() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [image, setImage] = useState(null)       // { url, base64, mime }
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      const base64 = dataUrl.split(',')[1]
      setImage({ url: dataUrl, base64, mime: file.type || 'image/jpeg' })
      setResult(null)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const analyze = async () => {
    if (!image) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/analyze', {
        image_base64: image.base64,
        mime_type: image.mime,
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao analisar imagem')
    } finally {
      setLoading(false)
    }
  }

  const saveMeal = async () => {
    if (!result) return
    setSaving(true)
    try {
      await api.post('/meals', {
        name: result.meal_name,
        eaten_at: new Date().toISOString(),
        image_url: image.url,
        calories: result.total_calories,
        protein_g: result.macros.protein,
        carbs_g: result.macros.carbs,
        fat_g: result.macros.fat,
        fiber_g: result.macros.fiber,
        foods: result.foods,
      })
      navigate('/')
    } catch (err) {
      setError('Erro ao salvar refeição')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-800">📷 Analisar Refeição</h1>

      {/* Área de imagem */}
      {!image ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
        >
          <div className="text-5xl">📸</div>
          <p className="text-slate-500 text-sm font-medium">Toque para fotografar ou escolher da galeria</p>
        </div>
      ) : (
        <div className="relative">
          <img src={image.url} alt="Refeição" className="w-full aspect-square object-cover rounded-2xl" />
          <button
            onClick={() => { setImage(null); setResult(null) }}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Resultado da análise */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-primary-50 px-5 py-4">
            <h2 className="font-bold text-slate-800 text-lg">{result.meal_name}</h2>
            <p className="text-slate-500 text-sm">{result.portion_description}</p>
          </div>

          <div className="px-5 py-4">
            {/* Calorias */}
            <div className="flex justify-center mb-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary-600">{result.total_calories}</p>
                <p className="text-slate-500 text-sm">kcal</p>
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Proteína', value: result.macros.protein, unit: 'g', color: 'text-blue-600 bg-blue-50' },
                { label: 'Carbs', value: result.macros.carbs, unit: 'g', color: 'text-yellow-600 bg-yellow-50' },
                { label: 'Gordura', value: result.macros.fat, unit: 'g', color: 'text-red-500 bg-red-50' },
                { label: 'Fibra', value: result.macros.fiber, unit: 'g', color: 'text-green-600 bg-green-50' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className={`rounded-xl p-2 text-center ${color}`}>
                  <p className="font-bold text-sm">{value}{unit}</p>
                  <p className="text-xs opacity-75">{label}</p>
                </div>
              ))}
            </div>

            {/* Alimentos */}
            <div className="space-y-2 mb-4">
              {result.foods.map((food, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-700">{food.emoji} {food.name}</span>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">{food.portion} · </span>
                    <span className="text-sm font-medium text-slate-700">{food.calories} kcal</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Observação */}
            {result.observations && (
              <div className="bg-green-50 rounded-xl px-4 py-3 text-sm text-green-700">
                💡 {result.observations}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="space-y-2">
        {image && !result && (
          <button
            onClick={analyze}
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analisando com IA...
              </>
            ) : (
              '🤖 Analisar com IA'
            )}
          </button>
        )}

        {result && (
          <>
            <button
              onClick={saveMeal}
              disabled={saving}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {saving ? 'Salvando...' : '✅ Salvar refeição'}
            </button>
            <button
              onClick={() => { setImage(null); setResult(null) }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl transition-colors"
            >
              🔄 Nova foto
            </button>
          </>
        )}

        {!image && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
          >
            📷 Escolher foto
          </button>
        )}
      </div>
    </div>
  )
}
