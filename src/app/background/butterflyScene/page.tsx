"use client";

import { error } from "console";
import { useEffect, useRef } from "react";
import * as THREE from 'three';
// 引入 GLTF 加载器
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export default function ButterflyScene() {

  // 创建一个容器引用，用于挂载 Three.js的canvas
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 确保只在浏览器中运行
    if (!containerRef.current) return;

    const container = containerRef.current;

    // 1. 初始化 Three.js 四大核心要素

    // A. 场景（Scene）
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a0c');

    // B. 相机（Camera） - 透视相机
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 6);

    // C. 渲染器（Renderer） - 开启抗锯齿
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 优化高清屏性能
    
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // 调整曝光度
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // // D. 物体（Mesh） - 立方体几何体 + 基础网格材质
    // const geometry = new THREE.BoxGeometry(2, 2, 2);
    // // 使用 MeshNormalMaterial 可以不用光源就能看到立体的渐变颜色
    // const material = new THREE.MeshNormalMaterial();
    // const cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);

    // 2. 质感灯光布局（Lights）
    // A. 主光源：斜上方打下来的强光，赋予体积感
    const mainLight = new THREE.DirectionalLight('#ffffff', 3.5);
    mainLight.position.set(2, 4, 3);
    scene.add(mainLight);

    // B. 边缘轮廓光：从左后方打过来，带一点淡蓝色
    const rimLight = new THREE.DirectionalLight('#a5c5ff', 4.5);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);
    
    // 3. 加载GLB模型
    const loader = new GLTFLoader();
    let model: THREE.Group | null = null;
    loader.load(
      '/butterfly_3.glb',
      (gltf) => {
        model = gltf.scene;

        // 居中并自动调整模型大小
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // 重置模型中心点
        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);

        // 适当缩放，让它在舞台中央
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        model.scale.setScalar(scale);

        scene.add(model);
        console.log('模型加载成功', gltf);
      },

      (xhr) => {
        console.log(`模型加载进度: ${(xhr.loaded / xhr.total) * 100}%`);
      },
      (error) => {
        console.error('模型加载失败，请检查路径或文件格式:', error);
      }
    );

    // 4. 动画循环（Animation Loop）
    let animationFrameId: number;

    const tick = () => {
      // // 让方块在 X 轴和 Y 轴上自转
      // cube.rotation.x += 0.01;
      // cube.rotation.y += 0.01;
      
      // 如果模型加载完成了，让模型自转
      if (model) {
        model.rotation.y += 0.005;
      }

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

      // // 销毁几何体和材质
      // geometry.dispose();
      // material.dispose();

      // 深度清理模型内存
      if (model) {
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
        scene.remove(model);
      }
      // 清理灯光与渲染器
      mainLight.dispose();
      rimLight.dispose();

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