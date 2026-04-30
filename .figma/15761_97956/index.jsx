import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.delete2}>
      <div className={styles.frame1000004158}>
        <div className={styles.frame1000004190}>
          <img
            src="../image/mmaazd36-a1ljoum.svg"
            className={styles.heroiconsOutlineTras}
          />
        </div>
        <div className={styles.frame1321319317}>
          <p className={styles.deleteRequest}>Delete Request ?</p>
          <p className={styles.areYouSureYouWantToD}>
            Are you sure you want to delete this regularization request?
          </p>
        </div>
      </div>
      <div className={styles.frame1000004364}>
        <div className={styles.component82}>
          <p className={styles.cancel}>Cancel</p>
        </div>
        <div className={styles.component81}>
          <p className={styles.delete}>Delete</p>
        </div>
      </div>
    </div>
  );
}

export default Component;
