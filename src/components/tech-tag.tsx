export function TechTag({ tech }: { tech: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
      {tech}
    </span>
  )
}
