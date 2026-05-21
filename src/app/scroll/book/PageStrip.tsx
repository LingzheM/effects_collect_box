const MAX_BEND = 36

export default function PageStrip({
  index,
  total,
  image,
  progress,
  isFront,
}: any) {

  const ratio = index / (total -1)

  // 页面曲率
  const curve = Math.sin(ratio * Math.PI)

  // 中间弯曲最强
  const dynamicBend = curve * MAX_BEND * Math.sin(progress * Math.PI)

  // 页面翻转
  const rotateY = progress * -180 + dynamicBend

  // 页面卷曲高度
  const translateZ = curve * 24 * Math.sin(progress * Math.PI)

  // 页面横向卷曲
  const translateX = curve * 12 * Math.sin(progress * Math.PI)

  // 阴影
  const darkness = curve * 0.45 * Math.sin(progress * Math.PI)

  return (
    <div
      className="
        absolute
        top-0
        h-full
        overflow-hidden
      "
      style={{
        width: `${100 / total}%`,
        left: `${ratio * 100}%`,
        transformStyle: 'preserve-3d',

        transformOrigin: isFront ? 'left center' : 'right center',

        transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
        
        filter: `brightness(${1 - darkness})`
      }}
    >
      <img 
        src={image}
        className="
          absolute
          top-0
          h-full
          object-cover
          max-w-none
          select-none
          pointer-events-none      
        "
        draggable={false}
        style={{
          width: `${total * 100}%`,
          left: `${-index * 100}`,
        }}
      />

      {/** 动态阴影 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              to right,
              rgba(0,0,0,${darkness}),
              transparent,
              rgba(0,0,0,${darkness * 0.6})
            )
          `,
        }}
      />
    </div>
  )
}