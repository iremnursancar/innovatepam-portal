  import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitIdea } from '../api/ideasApi'
import Navbar from '../components/Navbar'

const CATEGORY_OPTIONS = [
  { value: 'process_improvement', label: 'Process Improvement' },
  { value: 'product_idea',        label: 'Product Idea'        },
  { value: 'cost_reduction',      label: 'Cost Reduction'      },
  { value: 'customer_experience', label: 'Customer Experience' },
  { value: 'other',               label: 'Other'               },
]

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

  const [title, setTitle]           = useState('')
  const [description, setDesc]      = useState('')
  const [category, setCategory]     = useState('')
  const [file, setFile]             = useState(null)
  const [fileError, setFileError]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

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
      const idea = await submitIdea({ title, description, category, attachment: file })
      navigate(`/ideas/${idea.id}`, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Failed to submit idea. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit a New Idea</h1>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5"
        >
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              placeholder="A concise, descriptive title"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe the problem, your proposed solution, and the expected benefit…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="">Select a category…</option>
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* File attachment */}
          <div>
            <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">
              Attachment <span className="text-gray-400 font-normal">(optional — PDF, DOCX, XLSX, PNG, JPEG · max 10 MB)</span>
            </label>
            <input
              id="attachment"
              type="file"
              ref={fileRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {file && !fileError && (
              <p className="mt-1 text-xs text-accent-600">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
            )}
            {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting…' : 'Submit Idea'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
