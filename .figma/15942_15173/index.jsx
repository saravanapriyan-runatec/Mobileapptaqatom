import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.home2}>
      <div className={styles.rectangle2}>
        <div className={styles.frame8}>
          <p className={styles.a0404}>04:04</p>
          <div className={styles.frame4}>
            <img src="../image/mlugp31r-t83b6kb.svg" className={styles.frame} />
            <img src="../image/mlugp31r-yp58ya3.svg" className={styles.frame} />
            <img src="../image/mlugp31r-b1b32go.svg" className={styles.frame} />
          </div>
        </div>
        <div className={styles.frame14}>
          <div className={styles.frame10}>
            <img
              src="../image/mlugp31r-3rv50tw.svg"
              className={styles.heroiconsSolidHome}
            />
            <p className={styles.home}>Home</p>
          </div>
          <div className={styles.frame11}>
            <img
              src="../image/mlugp31r-1gb2pu8.svg"
              className={styles.heroiconsSolidHome}
            />
            <p className={styles.attendance}>Attendance</p>
          </div>
          <div className={styles.frame15}>
            <img
              src="../image/mlugp31r-71d4l28.svg"
              className={styles.heroiconsSolidChevro}
            />
          </div>
          <div className={styles.frame12}>
            <div className={styles.heroiconsOutlineDocu}>
              <div className={styles.vector} />
            </div>
            <p className={styles.attendance}>Task</p>
          </div>
          <div className={styles.frame11}>
            <img
              src="../image/mlugp31r-chjucvh.svg"
              className={styles.heroiconsSolidHome}
            />
            <p className={styles.attendance}>Report</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Component;
