import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.oTType}>
      <p className={styles.resignationEmployee}>Paid OT</p>
      <p className={styles.resignationEmployee}>Comp Off</p>
    </div>
  );
}

export default Component;
