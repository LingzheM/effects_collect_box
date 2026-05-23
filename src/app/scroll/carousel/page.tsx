"use client"
import { MotionPathCarousel } from "./MotionPathCarousel";
export default function App() {
  return (
    <>
      <div style={{ height: '100vh' }}>上方留白</div>
      <MotionPathCarousel />
      <div style={{ height: '100vh' }}>下方留白</div>
    </>
  );
}