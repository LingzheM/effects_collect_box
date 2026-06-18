# 重建分类秩序

当前的数据模型里 category 回答"用在哪（scene）"，tech回答"怎么做"。

当前的gsap和carousel这两个分类，违反了，本次不碰，之后移动到专门的gsap仓库。不要删除。

## TunnelCarousel,OrbitCarousel

来源：应该是抄的framer的分类

方针：TunnelCarousel 归档到 scroll，OrbitCarousel 归档到 background，不再使用 carousel 分类解散。

## 架构：重命令分类

路由结构：
每个效果页是物理路径：`src/app/<文件夹>/<slug>/page.tsx`，URL由文件夹决定。
而`[category]/page.tsx`列表页是按`effects.ts`的`category`字段过滤，生成`/${cat}/${slug}`链接。

会导致漂移——分类信息存在两个地方：
1. 物理文件夹名的（`src/app/carousel/`） → 决定真实URL
2. effects.ts的category字段 → 决定出现在哪个列表，生成什么链接
