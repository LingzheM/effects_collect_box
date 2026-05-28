"use client";

import { useEffect, useRef } from "react";
import * as THREE from 'three';

export default function ButterflyScene() {

  // 创建一个容器引用，用于挂载 Three.js的canvas
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 确保只在浏览器中运行
    if (!containerRef.current) return;

    const container = containerRef.current;

    // 2. 初始化 Three.js 四大核心要素

    // A. 场景（Scene）
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1a1a1a');

    // B. 相机（Camera） - 透视相机
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // C. 渲染器（Renderer） - 开启抗锯齿
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 优化高清屏性能
    container.appendChild(renderer.domElement);

    // D. 物体（Mesh） - 立方体几何体 + 基础网格材质
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    // 使用 MeshNormalMaterial 可以不用光源就能看到立体的渐变颜色
    const material = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // 3. 动画循环（Animation Loop）
    let animationFrameId: number;

    const tick = () => {
      // 让方块在 X 轴和 Y 轴上自转
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      
      // 渲染场景
      renderer.render(scene, camera);

      // 循环调用
      animationFrameId = requestAnimationFrame(tick);
    }

    // 启动动画
    tick();

    // 5. 组件卸载时的清理工作（Clean up）
    return () => {
      cancelAnimationFrame(animationFrameId);

      // 销毁几何体和材质
      geometry.dispose();
      material.dispose();

      // 移除 DOM 并销毁渲染器
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1
      }}
    >

    </div>
  )
}