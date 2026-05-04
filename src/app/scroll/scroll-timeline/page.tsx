import type { Metadata } from "next"
import ScrollTimeline from "./scroll-timeline"

export const metadata: Metadata = {
  title: "Scroll Timeline — Effects Shelf",
}

export default function ScrollTimelinePage() {
  return <ScrollTimeline />
}
