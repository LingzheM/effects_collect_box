"use client"
import { ScrollGallery } from "./ScrollGallery"

export default function GalleryPage() {
  return (
    <>
      {/* hero 提供初始滚动空间 */}
      <section style={{ height: '100vh', /* ... */ }}>
        <h1>Scroll Gallery</h1>
        <p>scroll down ↓</p>
      </section>

      <ScrollGallery />

      <div style={{ textAlign: 'center', padding: '80px 24px 120px', /* ... */ }}>
        — end —
      </div>
    </>
  );
}