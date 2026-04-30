import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.leaveType}>
      <p className={styles.resignationEmployee}>Casual Leave</p>
      <p className={styles.resignationEmployee}>Sick Leave</p>
    </div>
  );
}

export default Component;
