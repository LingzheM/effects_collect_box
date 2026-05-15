import type { Metadata } from "next"
import styles from "./book.module.css"

export const metadata: Metadata = {
  title: "Book Flip — Effects Shelf",
}

export default function BookFlipPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
      <div className={styles.scene}>
        <div className={styles.bookGroup}>
          <div className={styles.backCover} />
          <div className={styles.pages}>
            <div className={styles.pageLines} />
            <div className={styles.pageEdgeRight} />
            <div className={styles.pageEdgeBottom} />
          </div>
          <div className={styles.spine}>
            <div className={styles.spineLines} />
          </div>
          <div className={styles.frontCover}>
            <div className={styles.coverFace}>
              <div className={styles.coverTitle}>
                Design
                <br />
                Systems
              </div>
              <div className={styles.coverLine} />
              <div className={styles.coverSubtitle}>ALLA KHOLMATOVA</div>
            </div>
            <div className={styles.coverInner} />
            <div className={styles.coverThicknessTop} />
            <div className={styles.coverThicknessRight} />
            <div className={styles.coverThicknessBottom} />
          </div>
        </div>
      </div>
    </main>
  )
}
