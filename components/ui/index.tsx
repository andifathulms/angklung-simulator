import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Interface primitives. Every page used to hand-roll its own buttons and selects,
 * which is how six pages end up looking like six projects.
 */

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/* -------------------------------------------------------------- buttons -- */

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 ease-physical disabled:cursor-not-allowed disabled:opacity-40 active:translate-y-px'

const BUTTON_TONE: Record<ButtonTone, string> = {
  primary: 'bg-sounding text-ink-inverse hover:bg-sounding-glow shadow-raised',
  secondary: 'border border-stage-strong bg-stage-raised text-ink hover:border-bamboo hover:bg-stage-hover',
  ghost: 'text-ink-muted hover:bg-stage-raised hover:text-ink',
  danger: 'border border-cue/60 bg-cue/10 text-cue-light hover:bg-cue/20',
}

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-step--1',
  md: 'px-5 py-2.5 text-step-0',
  lg: 'px-7 py-3.5 text-step-1',
}

export function Button({
  tone = 'secondary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone; size?: ButtonSize }) {
  return (
    <button
      type="button"
      className={cx(BUTTON_BASE, BUTTON_TONE[tone], BUTTON_SIZE[size], className)}
      {...props}
    />
  )
}

export function ButtonLink({
  href,
  tone = 'secondary',
  size = 'md',
  className,
  children,
}: {
  href: string
  tone?: ButtonTone
  size?: ButtonSize
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={cx(BUTTON_BASE, BUTTON_TONE[tone], BUTTON_SIZE[size], className)}
    >
      {children}
    </Link>
  )
}

/**
 * A row of mutually exclusive choices. Used wherever a select would hide the
 * options.
 *
 * `disabled` exists for a control that is real but inapplicable — an
 * accompaniment switch on a piece that has no accompaniment part. Greyed and
 * inert says "not for this piece"; removing it would say "no such thing".
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled = false,
  hint,
}: {
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
  disabled?: boolean
  hint?: string
}) {
  return (
    <fieldset className="min-w-0" disabled={disabled}>
      <legend className="eyebrow mb-1.5">{label}</legend>
      <div
        className={cx(
          'surface-raised inline-flex flex-wrap gap-1 rounded-full border border-stage-line bg-stage-raised p-1',
          disabled && 'opacity-45',
        )}
      >
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={cx(
                'rounded-full px-3.5 py-1.5 text-step--1 transition duration-200 ease-physical disabled:cursor-not-allowed',
                selected
                  ? 'bg-bamboo text-ink-inverse shadow-raised'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {hint !== undefined ? (
        <p className="mt-1.5 max-w-[22rem] text-step--2 leading-snug text-ink-faint">{hint}</p>
      ) : null}
    </fieldset>
  )
}

/* --------------------------------------------------------------- fields -- */

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="eyebrow">{label}</span>
      {children}
      {hint !== undefined ? <span className="text-step--1 text-ink-faint">{hint}</span> : null}
    </label>
  )
}

const CONTROL =
  'rounded-lg border border-stage-line bg-stage px-3 py-2 text-step-0 text-ink transition duration-200 hover:border-stage-strong focus:border-bamboo'

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(CONTROL, 'cursor-pointer pr-8', className)} {...props} />
}

export function NumberInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      className={cx(CONTROL, 'font-mono text-right tabular-nums', className)}
      {...props}
    />
  )
}

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(CONTROL, 'font-mono text-step--1 leading-relaxed', className)} {...props} />
}

/* ------------------------------------------------------------- surfaces -- */

export function Card({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string
  children: ReactNode
  as?: 'div' | 'article' | 'section' | 'li'
}) {
  return (
    <Tag
      className={cx(
        'surface-raised rounded-card border border-stage-line bg-stage-raised/80 p-5 shadow-raised backdrop-blur-[2px] sm:p-6',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

/** A card that is a link. Lifts on hover, so it reads as somewhere to go. */
export function CardLink({
  href,
  eyebrow,
  title,
  children,
}: {
  href: string
  eyebrow?: string
  title: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className="surface-raised group flex flex-col gap-2 rounded-card border border-stage-line bg-stage-raised/80 p-5 shadow-raised transition duration-300 ease-physical hover:-translate-y-0.5 hover:border-bamboo/60 hover:bg-stage-hover hover:shadow-lifted sm:p-6"
    >
      {eyebrow !== undefined ? <span className="eyebrow">{eyebrow}</span> : null}
      <span className="font-display text-step-2 text-ink transition-colors group-hover:text-sounding">
        {title}
      </span>
      <span className="text-step--1 leading-relaxed text-ink-muted">{children}</span>
      <span
        aria-hidden="true"
        className="mt-1 text-bamboo transition-transform duration-300 ease-physical group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  )
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'sounding' | 'yourPart' | 'cue'
  children: ReactNode
}) {
  const tones = {
    neutral: 'border-stage-strong text-ink-muted',
    sounding: 'border-sounding/50 text-sounding',
    yourPart: 'border-yourPart/50 text-yourPart-light',
    cue: 'border-cue/50 text-cue-light',
  } as const
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-step--2 uppercase tracking-wider',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------ structure -- */

export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string
  title: string
  lede: string
  children?: ReactNode
}) {
  return (
    <header className="space-y-4">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="max-w-readable text-step-4">{title}</h1>
      <p className="max-w-prose text-step-1 leading-relaxed text-ink-muted">{lede}</p>
      {children}
    </header>
  )
}

export function Section({
  title,
  description,
  children,
  className,
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx('space-y-5', className)}>
      {title !== undefined ? (
        <div className="space-y-2">
          <h2 className="text-step-3">{title}</h2>
          {description !== undefined ? (
            <p className="max-w-prose text-ink-muted">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

/**
 * A Sundanese term, marked as Sundanese.
 *
 * This used to be an <abbr title={gloss}> — a tooltip that appears on hover and
 * nowhere else. It never appeared on keyboard focus, never appeared on touch at
 * all, and is announced inconsistently by screen readers, so the one mechanism
 * meant to teach these words taught them only to people using a mouse. Building
 * a real tooltip widget would be out of all proportion to a five-word gloss, so
 * the gloss is visible text at the call sites instead and the tooltip is gone.
 *
 * What replaces it is worth more than it was: `lang="su"` tells a screen reader
 * to pronounce kurulung, centok and tengkep as Sundanese rather than reading
 * them through Indonesian or English phonetics (WCAG 3.1.2). The dotted
 * underline stays as the visual mark that this is a term of art.
 */
export function Term({ term }: { term: string }) {
  return (
    <span
      lang="su"
      className="font-medium text-bamboo-light no-underline decoration-dotted underline-offset-4 [text-decoration-line:underline]"
    >
      {term}
    </span>
  )
}

/**
 * Statistic with its label, for the places where a number is the message.
 *
 * `size="lead"` is for the one stat in a group that carries the argument. Every
 * label used to render through `.eyebrow` — step--2, uppercase, ink-faint —
 * which is right for "notes" and "duration" and wrong for "this song needs _
 * people", where the number means nothing without the label and the label was
 * the least legible text on the page.
 */
export function Stat({
  value,
  label,
  tone = 'default',
  size = 'default',
}: {
  value: string
  label: string
  tone?: 'default' | 'pending' | 'sounding' | 'yourPart' | 'cue'
  size?: 'default' | 'lead'
}) {
  const tones = {
    default: 'text-ink',
    // A figure the interface is promising but has not earned yet. Dimmed rather
    // than hidden, so the label can say what will appear there.
    pending: 'text-ink-faint',
    sounding: 'text-sounding',
    yourPart: 'text-yourPart-light',
    cue: 'text-cue-light',
  } as const
  const lead = size === 'lead'
  return (
    <div className={cx('flex flex-col', lead ? 'gap-1' : 'gap-0.5')}>
      <span
        className={cx('font-mono tabular-nums', lead ? 'text-step-3' : 'text-step-2', tones[tone])}
      >
        {value}
      </span>
      <span
        className={
          lead
            ? 'font-mono text-step--1 uppercase tracking-[0.14em] text-ink-muted'
            : 'eyebrow'
        }
      >
        {label}
      </span>
    </div>
  )
}
