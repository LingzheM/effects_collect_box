import { motion } from "framer-motion";
import PageMesh from "./PageMesh";

export default function BookPage({
  image,
  flipped,
  active,
  depth,
  onClick,
}: any) {
  return (
    <motion.div
      className="
        absolute
        w-[360px]
        h-[500px]
        cursor-pointer
      "
      style={{
        transformStyle: 'preserve-3d',
        transformOrigin: 'left center',
        zIndex: active ? 999 : 100 - depth,
      }}
      animate={{
        rotateY: flipped ? -180 : 0,
        
        x: flipped
          ? -depth * 0.4
          : depth * 0.4,

        y: depth * 0.7,

        z: -depth * 2,

        rotateZ: flipped
          ? -depth * 0.15
          : depth * 0.15,
      }}
      transition={{
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
      }}
      onClick={onClick}
    >
      {/**正面 */}
      <div
        className="
          absolute
          inset-0
          rounded-r-[24px]
          overflow-hidden
          bg-white
        "
        style={{
          backfaceVisibility: 'hidden',
        }}
      >
        <PageMesh 
          image={image}
          progress={flipped ? 1 : 0}
          isFront
        />

        {/** page edge */}
        <div
          className="
            absolute
            top-0
            right-0
            w-[4px]
            h-full
          "
          style={{
            background: 'linear-gradient(to right, #ffffff, #dododo, #888)',
          }}
        />
      </div>

      {/** 背面 */}
      <div
        className="
          absolute
          inset-0
          rounded-r-[24px]
          overflow-hidden
          bg-white
        "
        style={{
          transform: 'rotateY(180deg)',
          backfaceVisibility: 'hidden',
        }}
      >
        <PageMesh 
          image={image}
          progress={flipped ? 0 : 1}
          isFront={false}
        />
      </div>
    </motion.div>
  )
}