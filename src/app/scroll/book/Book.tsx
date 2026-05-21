"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import BookPage from "./BookPage";

export default function Book({
  images,
}: {
  images: string[]
}) {
  const [page, setPage] = useState(0);
  
  const leftWeight = page
  const rightWeight = images.length - page

  // 整本书的重心偏移
  const balance = (rightWeight - leftWeight) * 8

  return (
    <motion.div
      className="relative"
      animate={{
        x: balance,
        rotateZ: balance * 0.03,
      }}
      transition={{
        type: 'spring',
        stiffness: 80,
        damping: 20,
      }}
    >
      {/** 书脊 */}
      <div
        className="
          absolute
          left-1/2
          top-1/2
          -translate-x-1/2
          -translate-y-1/2
          w-[24px]
          h-[520px]
          bg-black/50
          rounded-full
          blur-[4px]
          z-0
        "
      />
      {/** 页面 */}
      {
        images.map((image, index) => {
          const flipped = index < page
          const depth = flipped
            ? page - index
            : index - page
            
          return (
            <BookPage
              key={index}
              image={image}
              flipped={flipped}
              active={index === page}
              depth={depth}
              onClick={() => {
                if (index >= page) {
                  setPage(index + 1)
                } else {
                  setPage(index)
                }
              }}
            />
          )
        })}
    </motion.div>
  )
}