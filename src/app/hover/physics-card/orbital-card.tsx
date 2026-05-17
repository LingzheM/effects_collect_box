import styles from './orbital.module.css';
import { PhysicsCard } from './physics-card';

export const OrbitalCard = () => {
  return (
    <div className={styles.orbitScene}>
      {/** 圆心装饰 */}
      <div className='w-4 h-4 bg-blue-500 rounded-full blur-sm' />

      {/** 旋转轨道 */}
      <div className={styles.orbitRoot}>
        {/** 卡片锚点 */}
        <div className={styles.cardAnchor}>
          <PhysicsCard maxRotation={20}>
            <div className='p-4'>
              <h4 className='text-xl font-bold text-white'>卫星卡片</h4>
              <p className='text-sm text-gray-400'>卡片围绕中心点公转</p>
              <p className='mt-4 text-xs opacity-50'>可以触发物理倾斜</p>
            </div>
          </PhysicsCard>
        </div>
      </div>
     {/** 轨道辅助线（视觉效果） */}
     <div className='absolute w-[600px] h-[600px] border border-white/5 rounded-full pointer-events-none' />
    </div>
  );
}