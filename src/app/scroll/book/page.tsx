"use client"

import Book from "./Book"

const IMAGES = [
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1560930950-5c20d80c8bd9?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1618331835717-801e976710b2?auto=format&fit=crop&q=80&w=1200',
]

export default function Page() {
  return (
    <div className="w-screen h-screen bg-[#232534] overflow-hidden flex items-center justify-center">
      <Book images={IMAGES} />
    </div>
  )
}