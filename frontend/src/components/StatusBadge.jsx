/**
 * StatusBadge — displays a colour-coded pill for idea status with subtle glow.
 */
const STATUS_MAP = {
  submitted:    { label: 'Submitted',    classes: 'bg-blue-50   text-blue-600   border border-blue-100'  },
  under_review: { label: 'Under Review', classes: 'bg-amber-50  text-amber-600  border border-amber-100' },
  accepted:     { label: 'Accepted',     classes: 'bg-green-50  text-green-600  border border-green-100' },
  rejected:     { label: 'Rejected',     classes: 'bg-red-50    text-red-600    border border-red-100'   },
}

export default function StatusBadge({ status }) {
  const { label, classes } = STATUS_MAP[status] ?? {
    label: status,
    classes: 'bg-gray-100 text-gray-600 border border-gray-200',
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}
