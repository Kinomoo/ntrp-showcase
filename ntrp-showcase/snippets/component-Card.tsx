// 展示用途的擷取片段，非完整專案
import * as React from 'react'

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string
}

/** 展示卡片 */
export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children }: CardProps) {
  return <h3 className={`text-lg font-semibold text-zinc-100 ${className}`}>{children}</h3>
}

export function CardDescription({ className = '', children }: CardProps) {
  return <p className={`text-sm text-zinc-400 mt-1 ${className}`}>{children}</p>
}
