import type { Metadata } from "next"
import BurnPaper from "./burn-paper"

export const metadata: Metadata = {
  title: "Burn Paper — Effects Shelf",
}

export default function BurnPaperPage() {
  return <BurnPaper />
}
