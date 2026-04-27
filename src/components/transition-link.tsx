"use client"

import { useRouter } from "next/navigation"
import type { ReactNode } from "react"

type Props = {
  href: string
  className?: string
  children: ReactNode
}

export function TransitionLink({ href, className, children }: Props) {
  const router = useRouter()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    if (!("startViewTransition" in document)) {
      router.push(href)
      return
    }
    document.startViewTransition(() => {
      router.push(href)
    })
  }

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  )
}
