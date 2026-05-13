import type { Metadata } from "next"
import AsciiCard from "./ascii-card"

export const metadata: Metadata = {
  title: "ASCII Card — Effects Shelf",
}

export default function AsciiCardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
      <AsciiCard />
    </main>
  )
}
