import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.punchState}>
      <p className={styles.resignationEmployee}>Check In</p>
      <p className={styles.resignationEmployee}>Check Out</p>
      <p className={styles.resignationEmployee}>Break In</p>
      <p className={styles.resignationEmployee}>Break Out</p>
      <p className={styles.resignationEmployee}>Overtime In</p>
      <p className={styles.resignationEmployee}>Overtime Out</p>
    </div>
  );
}

export default Component;
