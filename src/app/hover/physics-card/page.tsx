"use client"

import { useState } from "react"
import { PhysicsCard } from "./physics-card"

export default function PhysicsCardPage() {
  const [maxRotation, setMaxRotation] = useState(15)

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
      <PhysicsCard maxRotation={maxRotation}>
        <div style={{ padding: 24, color: "#0f172a" }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Physics Card</h3>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>
            Hover to tilt
          </p>
        </div>
      </PhysicsCard>

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
          label="Max Rotation (最大倾斜角)"
          value={maxRotation}
          min={5}
          max={40}
          step={1}
          onChange={setMaxRotation}
        />
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
        <code>{value}°</code>
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
