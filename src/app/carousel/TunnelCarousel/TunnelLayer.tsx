interface TunnelLayerProps {
  /** 在隧道中的索引 */
  index: number;
  /** Z轴间距（单位 px） */
  gap: number;
  /** 图片URL */
  src: string;
  /** 可选文本 */
  alt?: string;
}

export default function TunnelLayer({ index, gap, src, alt }: TunnelLayerProps) {
  return (
    <div>

    </div>
  )
}