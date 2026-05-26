'use client'

import { TunnelCarousel } from "./TunnelCarousel"

export default function TunnelPage() {
  return (
    <>
    {/** 这个容器提供滚动高度。 500vh = 5 屏 */}
    <div style={{ height: '500vh', background: '#f0f0f0' }}></div>
    
    {/** 组件本身 fixed 满屏， 不占文档流 */}
    <TunnelCarousel />
    </>
  )
}