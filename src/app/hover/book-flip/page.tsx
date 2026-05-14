"use client"

import { useState } from "react"
import { BookCover } from "@/components/book-hover"

export default function BookFlipPage() {
  const [stiffness, setStiffness] = useState(300)
  const [damping, setDamping] = useState(20)

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        background: "#f1f5f9",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <BookCover spring={{ stiffness, damping }} />
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
          width: 320,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <ControlSlider
          label="Stiffness (劲度)"
          value={stiffness}
          min={50}
          max={1000}
          step={10}
          onChange={setStiffness}
        />
        <ControlSlider
          label="Damping (阻尼)"
          value={damping}
          min={1}
          max={60}
          step={1}
          onChange={setDamping}
        />
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
          推荐组合：300 / 20，500 / 35，120 / 22
        </p>
      </div>
    </div>
  )
}

interface ControlSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

function ControlSlider({ label, value, min, max, step, onChange }: ControlSliderProps) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
      <span style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{label}</strong>
        <code>{value}</code>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
