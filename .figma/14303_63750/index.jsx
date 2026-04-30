import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.frame1000004158}>
      <div className={styles.ellipse47} />
      <div className={styles.ellipse48} />
      <div className={styles.frame1000004166}>
        <div className={styles.autoWrapper}>
          <div className={styles.frame1000004165}>
            <p className={styles.a02Days}>02 Days</p>
            <p className={styles.leave}>Leave</p>
          </div>
          <div className={styles.frame10000041652}>
            <p className={styles.a01Days}>01 Days</p>
            <p className={styles.leave}>Present</p>
          </div>
        </div>
        <div className={styles.autoWrapper2}>
          <div className={styles.frame10000041653}>
            <p className={styles.a21Days}>21 Days</p>
            <p className={styles.absent}>Absent</p>
          </div>
          <div className={styles.frame10000041654}>
            <p className={styles.a05Days}>05 Days</p>
            <p className={styles.leave}>Late</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Component;
