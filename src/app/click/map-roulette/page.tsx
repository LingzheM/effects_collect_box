import type { Metadata } from "next"
import MapRoulette from "./map-roulette"

export const metadata: Metadata = {
  title: "Map Roulette — Effects Shelf",
}

export default function MapRoulettePage() {
  return <MapRoulette />
}
