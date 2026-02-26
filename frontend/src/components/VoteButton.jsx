import { useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { toggleVote } from '../api/ideasApi'

/**
 * Self-contained vote button with optimistic UI.
 *
 * Props:
 *  - ideaId       {number}   – idea to vote on
 *  - initialCount {number}   – vote count from the server
 *  - initialVoted {boolean}  – whether the current user already voted
 *  - size         {'sm'|'md'} – 'sm' for list cards, 'md' for detail page
 *  - onToggled    {(result: { voteCount, hasVoted }) => void} – optional callback
 */
export default function VoteButton({
  ideaId,
  initialCount = 0,
  initialVoted = false,
  size = 'sm',
  onToggled,
}) {
  const [count,   setCount]   = useState(initialCount)
  const [voted,   setVoted]   = useState(initialVoted)
  const [loading, setLoading] = useState(false)

  async function handleClick(e) {
    // Prevent parent <Link> from navigating
    e.preventDefault()
    e.stopPropagation()

    if (loading) return

    // Optimistic update
    const nextVoted = !voted
    const nextCount = nextVoted ? count + 1 : count - 1
    setVoted(nextVoted)
    setCount(nextCount)
    setLoading(true)

    try {
      const result = await toggleVote(ideaId)
      setCount(result.voteCount)
      setVoted(result.hasVoted)
      onToggled?.(result)
    } catch {
      // Revert on error
      setVoted(voted)
      setCount(count)
    } finally {
      setLoading(false)
    }
  }

  const isMd = size === 'md'

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={voted ? 'Remove vote' : 'Vote for this idea'}
      aria-pressed={voted}
      className={[
        'flex flex-col items-center gap-0.5 rounded-lg border transition-all duration-200 select-none',
        isMd
          ? 'px-4 py-3 min-w-[60px]'
          : 'px-2.5 py-1.5 min-w-[44px]',
        voted
          ? 'border-[#7277F1]/40 bg-[#7277F1]/10 text-[#7277F1] hover:bg-[#7277F1]/20'
          : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600',
        loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <ArrowUp
        className={[
          'transition-transform',
          isMd ? 'h-5 w-5' : 'h-4 w-4',
          voted ? 'scale-110' : '',
        ].join(' ')}
        strokeWidth={voted ? 2.5 : 2}
        aria-hidden="true"
      />
      <span className={isMd ? 'text-sm font-semibold' : 'text-xs font-semibold'}>
        {count}
      </span>
    </button>
  )
}
