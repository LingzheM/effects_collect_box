import PageStrip from "./PageStrip"

const STRIP_COUNT = 28

export default function PageMesh({
  image,
  progress,
  isFront,
}: {
  image: string
  progress: number
  isFront: boolean
}) {

  return (
    <div
      className="absolute inset-0"
      style={{
        transformStyle: 'preserve-3d'
      }}
    >
      {Array.from({
        length: STRIP_COUNT,
      }).map((_, i) => {
        return (
          <PageStrip 
            key={i}
            index={i}
            total={STRIP_COUNT}
            image={image}
            progress={progress}
            isFront={isFront}
          />
        )
      })}
    </div>
  )
}