import { useEffect, useState } from 'react'
import { animate, motion } from 'motion/react'

const TICKS = 21
const CX = 200
const CY = 210

// نقطة على القوس: t من 0 إلى 1، r نصف القطر
const pt = (t, r) => {
  const a = Math.PI * (1 - t)
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)]
}

export default function Intro({ onDone }) {
  const [v, setV] = useState(0)

  useEffect(() => {
    const ctl = animate(0, 100, {
      duration: 2.4,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: setV,
      onComplete: () => setTimeout(onDone, 1100),
    })
    return () => ctl.stop()
  }, [onDone])

  const finished = v >= 100

  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center bg-ink text-white"
      initial={{ clipPath: 'inset(0 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
    >
      <button
        onClick={onDone}
        className="absolute end-5 top-5 rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/70 transition hover:text-white"
      >
        تخطي
      </button>

      <div className="flex w-[min(560px,92vw)] flex-col items-center">
        <div className="relative w-full">
          <svg viewBox="0 0 400 240" className="w-full" aria-hidden="true">
            <motion.path
              d="M 40 210 A 160 160 0 0 1 360 210"
              fill="none"
              stroke="#e3171b"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            {Array.from({ length: TICKS }, (_, i) => {
              const t = i / (TICKS - 1)
              const [x1, y1] = pt(t, i % 5 === 0 ? 126 : 134)
              const [x2, y2] = pt(t, 146)
              return (
                <line
                  key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={v >= t * 100 ? '#e3171b' : '#35363a'}
                  strokeWidth={i % 5 === 0 ? 4 : 2.5}
                  strokeLinecap="round"
                />
              )
            })}
            <g style={{ transform: `rotate(${-90 + v * 1.8}deg)`, transformOrigin: `${CX}px ${CY}px` }}>
              <line x1={CX} y1={CY} x2={CX} y2={CY - 118} stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </g>
            <circle cx={CX} cy={CY} r="9" fill="#e3171b" />
            <circle cx={CX} cy={CY} r="3.5" fill="#0b0b0c" />
          </svg>
        </div>

        <div className="relative mt-2 h-28 w-full">
          <motion.div
            className="absolute inset-0 grid place-items-center text-5xl font-extrabold tabular-nums"
            animate={{ opacity: finished ? 0 : 1, y: finished ? -12 : 0 }}
            dir="ltr"
          >
            {Math.round(v)}
          </motion.div>
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: finished ? 1 : 0, y: finished ? 0 : 16 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-extrabold">كمالياتي</h1>
            <p className="text-neutral-400">قطع وكماليات السيارات</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
