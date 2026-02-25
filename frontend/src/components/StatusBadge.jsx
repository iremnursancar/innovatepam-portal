/**
 * StatusBadge — displays a colour-coded pill for idea status.
 */
const STATUS_MAP = {
  submitted:    { label: 'Submitted',    classes: 'bg-blue-100   text-blue-700'   },
  under_review: { label: 'Under Review', classes: 'bg-yellow-100 text-yellow-700' },
  accepted:     { label: 'Accepted',     classes: 'bg-accent-100 text-accent-700' },
  rejected:     { label: 'Rejected',     classes: 'bg-red-100    text-red-700'    },
}

export default function StatusBadge({ status }) {
  const { label, classes } = STATUS_MAP[status] ?? {
    label: status,
    classes: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}
