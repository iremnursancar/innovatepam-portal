import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitIdea, analyzeIdea } from '../api/ideasApi'
import Navbar from '../components/Navbar'

const CATEGORY_OPTIONS = [
  { value: 'process_improvement', label: 'Process Improvement' },
  { value: 'product_idea',        label: 'Product Idea'        },
  { value: 'cost_reduction',      label: 'Cost Reduction'      },
  { value: 'customer_experience', label: 'Customer Experience' },
  { value: 'other',               label: 'Other'               },
]

const CATEGORY_LABELS = Object.fromEntries(CATEGORY_OPTIONS.map(o => [o.value, o.label]))

const IMPACT_COLORS = {
  High:   'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  Medium: 'text-amber-300  bg-amber-500/10  border-amber-500/30',
  Low:    'text-slate-400  bg-slate-500/10  border-slate-500/30',
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
]
const MAX_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB

export default function SubmitIdeaPage() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [title, setTitle]               = useState('')
  const [description, setDesc]          = useState('')
  const [category, setCategory]         = useState('')
  const [isPublic, setIsPublic]         = useState(false)
  const [file, setFile]                 = useState(null)
  const [fileError, setFileError]       = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  // AI analysis state
  const [analysis, setAnalysis]         = useState(null)
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')

  async function handleAnalyze() {
    if (!title.trim() && !description.trim()) {
      setAnalyzeError('Enter a title or description first.')
      return
    }
    setAnalyzeError('')
    setAnalyzeLoading(true)
    try {
      const result = await analyzeIdea({ title, description })
      setAnalysis(result)
    } catch (err) {
      setAnalyzeError(err?.response?.data?.error ?? 'Analysis failed. Please try again.')
    } finally {
      setAnalyzeLoading(false)
    }
  }

  function handleFileChange(e) {
    const chosen = e.target.files?.[0] ?? null
    if (!chosen) { setFile(null); return }

    if (!ALLOWED_TYPES.includes(chosen.type)) {
      setFileError('Allowed types: PDF, DOCX, XLSX, PNG, JPEG.')
      setFile(null)
      e.target.value = ''
      return
    }
    if (chosen.size > MAX_SIZE_BYTES) {
      setFileError('File must be under 10 MB.')
      setFile(null)
      e.target.value = ''
      return
    }
    setFileError('')
    setFile(chosen)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim() || !description.trim() || !category) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    try {
      const idea = await submitIdea({ title, description, category, isPublic, attachment: file })
      navigate(`/ideas/${idea.id}`, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to submit idea. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Submit a New Idea</h1>

        {error && (
          <div className="mb-4 rounded-md bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-navy-card/90 backdrop-blur-sm rounded-lg border border-navy-border shadow-card-dark p-6 space-y-5"
        >
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              placeholder="A concise, descriptive title"
              className="w-full rounded-md border border-navy-border bg-navy-950/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe the problem, your proposed solution, and the expected benefit…"
              className="w-full rounded-md border border-navy-border bg-navy-950/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors"
            />
          </div>

          {/* AI Suggestions button */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzeLoading}
              className="self-start inline-flex items-center gap-2 rounded-md border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/50 disabled:opacity-50 transition-all"
            >
              {analyzeLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analysing…
                </>
              ) : '✨ Get AI Suggestions'}
            </button>

            {analyzeError && (
              <p className="text-xs text-rose-400">{analyzeError}</p>
            )}

            {analysis && !analyzeLoading && (
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
                <p className="text-sm font-semibold text-violet-300">AI Analysis</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Similar ideas */}
                  <div className="rounded-md border border-navy-border bg-navy-950/50 px-3 py-2.5 text-sm">
                    <span className="mr-1.5">💡</span>
                    <span className="font-medium text-slate-400">Similar ideas:</span>{' '}
                    <span className="text-violet-300 font-semibold">{analysis.similarIdeasCount}</span>
                  </div>

                  {/* Suggested category */}
                  <div className="rounded-md border border-navy-border bg-navy-950/50 px-3 py-2.5 text-sm">
                    <span className="mr-1.5">📂</span>
                    <span className="font-medium text-slate-400">Suggested:</span>{' '}
                    <button
                      type="button"
                      onClick={() => setCategory(analysis.suggestedCategory)}
                      className="text-cyan-400 font-semibold underline underline-offset-2 hover:text-cyan-300 transition-colors"
                      title="Click to apply"
                    >
                      {CATEGORY_LABELS[analysis.suggestedCategory] ?? analysis.suggestedCategory}
                    </button>
                  </div>

                  {/* Impact score */}
                  <div className={`rounded-md border px-3 py-2.5 text-sm ${IMPACT_COLORS[analysis.impactScore]}`}>
                    <span className="mr-1.5">🎯</span>
                    <span className="font-medium">Est. impact:</span>{' '}
                    <span className="font-semibold">{analysis.impactScore}</span>
                  </div>
                </div>

                {/* Tips */}
                {analysis.tips.length > 0 && (
                  <div className="rounded-md border border-navy-border bg-navy-950/50 px-3 py-2.5">
                    <p className="text-xs font-semibold text-slate-400 mb-1.5">💬 Tips</p>
                    <ul className="space-y-1">
                      {analysis.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-slate-400 flex gap-1.5">
                          <span className="text-violet-400 mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">
              Category <span className="text-rose-400">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-md border border-navy-border bg-navy-950/60 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors"
            >
              <option value="" className="bg-navy-900">Select a category…</option>
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-navy-900">{o.label}</option>
              ))}
            </select>
          </div>

          {/* File attachment */}
          <div>
            <label htmlFor="attachment" className="block text-sm font-medium text-slate-300 mb-1">
              Attachment <span className="text-slate-500 font-normal">(optional — PDF, DOCX, XLSX, PNG, JPEG · max 10 MB)</span>
            </label>
            <input
              id="attachment"
              type="file"
              ref={fileRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 transition-all"
            />
            {file && !fileError && (
              <p className="mt-1 text-xs text-emerald-400">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
            )}
            {fileError && <p className="mt-1 text-xs text-rose-400">{fileError}</p>}
          </div>

          {/* Visibility toggle */}
          <div className="rounded-lg border border-navy-border bg-navy-950/40 px-4 py-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-navy-border bg-navy-950 text-cyan-500 focus:ring-cyan-500/50"
              />
              <div>
                <span className="text-sm font-medium text-slate-200">
                  Make this idea public
                </span>
                <p className="mt-0.5 text-xs text-slate-500">
                  Public ideas can be seen and voted on by all users.
                  Private ideas are only visible to you and admins.
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-gradient-to-r from-cyan-500 to-cyan-400 text-navy-950 font-semibold px-5 py-2 text-sm hover:from-cyan-400 hover:to-cyan-300 shadow-glow-cyan disabled:opacity-50 transition-all"
            >
              {loading ? 'Submitting…' : 'Submit Idea'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md border border-navy-border px-5 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
