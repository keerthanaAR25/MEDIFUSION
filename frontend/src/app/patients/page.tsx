'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface Patient {
  id: number
  case_id: string
  name: string
  age: number
  gender: string
  ward: string
  diagnosis: string
  attending: string
  status: string
  confidence: number
}

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => { fetchPatients() }, [])

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients/')
      setPatients(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = patients.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.case_id.toLowerCase().includes(search.toLowerCase()) ||
      (p.diagnosis || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || p.status === filter
    return matchSearch && matchFilter
  })

  const statusColor: Record<string, string> = {
    'Completed':    'bg-green-500/20 text-green-400 border border-green-500/30',
    'Processing':   'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    'Under Review': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'Pending':      'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Patient Cases</h1>
          <p className="text-gray-400 text-sm mt-1">{patients.length} total cases</p>
        </div>
        <button
          onClick={() => router.push('/processing')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + New Case
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, case ID, or diagnosis..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
        <div className="flex gap-2 flex-wrap">
          {['All','Completed','Processing','Under Review','Pending'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === s ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-3 bg-white/10 rounded w-1/2 mb-4" />
              <div className="h-2 bg-white/10 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🏥</div>
          <p className="text-lg">No patients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(patient => (
            <div
              key={patient.case_id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition-all"
            >
              {/* Top */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-semibold">{patient.name}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {patient.case_id} · {patient.age}y · {patient.gender}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[patient.status] || statusColor['Pending']}`}>
                  {patient.status}
                </span>
              </div>

              {/* Diagnosis */}
              <div className="mb-3">
                <p className="text-gray-300 text-sm font-medium">
                  {patient.diagnosis || 'Awaiting analysis'}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {patient.ward} · {patient.attending}
                </p>
              </div>

              {/* Confidence */}
              {patient.confidence > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">AI Confidence</span>
                    <span className="text-purple-400 font-medium">{patient.confidence}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                      style={{ width: `${patient.confidence}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => router.push('/processing')}
                  className="flex-1 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg text-xs transition-colors"
                >
                  Process AI
                </button>
                <button
                  onClick={() => router.push('/summary')}
                  className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs transition-colors"
                >
                  View Summary
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}