import type { Metadata } from "next"
import Carousel3D from "./carousel"

export const metadata: Metadata = {
  title: "3D Carousel — Effects Shelf",
}

export default function Carousel3DPage() {
  return <Carousel3D />
}
