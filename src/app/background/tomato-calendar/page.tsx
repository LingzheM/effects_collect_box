import type { Metadata } from "next"
import TomatoCalendar from "./tomato-calendar"

export const metadata: Metadata = {
  title: "Tomato Calendar — Effects Shelf",
}

export default function TomatoCalendarPage() {
  return <TomatoCalendar />
}
