import { BentoGrid } from "@/components/bento-grid"

export default function Home() {
  return (
    <main className="min-h-screen px-8 py-12">
      <div className="mx-auto max-w-[900px]">
        <header className="mb-8">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Effects Shelf</h1>
          <p className="mt-1 text-sm text-zinc-400">前端视觉效果收藏箱</p>
        </header>
        <BentoGrid />
      </div>
    </main>
  )
}
