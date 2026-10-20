type CoverageActionConfirmationProps = {
  title: string
  message: string
  confirmLabel: string
  isPending: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function CoverageActionConfirmation({
  title,
  message,
  confirmLabel,
  isPending,
  onCancel,
  onConfirm,
}: CoverageActionConfirmationProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget &&
          !isPending
        ) {
          onCancel()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="coverage-confirmation-title"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <p className="text-sm font-semibold tracking-wide text-red-600">
          CONFIRM ACTION
        </p>

        <h2
          id="coverage-confirmation-title"
          className="mt-2 text-2xl font-bold text-slate-950"
        >
          {title}
        </h2>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          {message}
        </p>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            戻る
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {isPending
              ? '処理中...'
              : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}