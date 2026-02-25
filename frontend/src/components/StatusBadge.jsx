/**
 * StatusBadge — displays a colour-coded pill for idea status with subtle glow.
 */
const STATUS_MAP = {
  submitted:    { label: 'Submitted',    classes: 'bg-blue-500/15    text-blue-300   border border-blue-500/30   shadow-[0_0_10px_rgba(59,130,246,0.2)]'  },
  under_review: { label: 'Under Review', classes: 'bg-amber-500/15   text-amber-300  border border-amber-500/30  shadow-[0_0_10px_rgba(245,158,11,0.2)]'  },
  accepted:     { label: 'Accepted',     classes: 'bg-emerald-500/15  text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
  rejected:     { label: 'Rejected',     classes: 'bg-rose-500/15     text-rose-300   border border-rose-500/30   shadow-[0_0_10px_rgba(244,63,94,0.2)]'   },
}

export default function StatusBadge({ status }) {
  const { label, classes } = STATUS_MAP[status] ?? {
    label: status,
    classes: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}
