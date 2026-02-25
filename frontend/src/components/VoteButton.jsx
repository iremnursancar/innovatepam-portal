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
          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 shadow-glow-cyan'
          : 'border-navy-border bg-navy-card/60 text-slate-500 hover:border-slate-500 hover:text-slate-300',
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
