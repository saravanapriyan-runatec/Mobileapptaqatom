import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.newManualLog}>
      <div className={styles.rectangle2}>
        <div className={styles.frame8}>
          <p className={styles.a0404}>04:04</p>
          <div className={styles.frame4}>
            <img src="../image/mmdbgsgr-yxnmln0.svg" className={styles.frame} />
            <img src="../image/mmdbgsgr-2ox2bd0.svg" className={styles.frame} />
            <img src="../image/mmdbgsgr-h9htpy4.svg" className={styles.frame} />
          </div>
        </div>
        <div className={styles.frame1321319233}>
          <div className={styles.frame1321319192}>
            <img src="../image/mmdbgsgr-mwz3glo.svg" className={styles.frame2} />
            <p className={styles.manualLogRequest}>Manual Log Request</p>
          </div>
          <div className={styles.frame1321319230}>
            <p className={styles.requestDetails}>Request Details</p>
            <div className={styles.frame1000003485}>
              <p className={styles.username}>Date</p>
              <div className={styles.frame1000003415}>
                <p className={styles.placeholder}>03 Feb 2026</p>
                <img src="../image/mmdbgsgr-ji9zus2.svg" className={styles.frame} />
              </div>
            </div>
            <div className={styles.frame1000003485}>
              <p className={styles.username}>Punch State</p>
              <div className={styles.frame1000003415}>
                <p className={styles.placeholder}>Select</p>
                <img src="../image/mmdbgsgr-rpq2juk.svg" className={styles.frame} />
              </div>
            </div>
            <div className={styles.frame1321319231}>
              <div className={styles.frame10000034852}>
                <p className={styles.username}>Actual Check In</p>
                <div className={styles.frame1000003415}>
                  <p className={styles.placeholder}>--:--</p>
                  <img
                    src="../image/mmdbgsgr-8lc9dsu.svg"
                    className={styles.frame}
                  />
                </div>
              </div>
              <div className={styles.frame10000034852}>
                <p className={styles.username}>Actual Check Out</p>
                <div className={styles.frame1000003415}>
                  <p className={styles.placeholder}>--:--</p>
                  <img
                    src="../image/mmdbgsgr-8lc9dsu.svg"
                    className={styles.frame}
                  />
                </div>
              </div>
            </div>
            <div className={styles.frame1000003825}>
              <img src="../image/mmdbgsgr-8nr09xz.svg" className={styles.frame} />
              <p className={styles.scheduledShift0900Am3}>
                <span className={styles.scheduledShift0900Am}>
                  Scheduled Shift&nbsp;
                </span>
                <span className={styles.scheduledShift0900Am2}>
                  09:00AM - 06:00PM
                </span>
              </p>
            </div>
          </div>
          <div className={styles.frame13213192312}>
            <p className={styles.requestDetails}>Justification</p>
            <div className={styles.frame1321319232}>
              <p className={styles.reason}>Reason</p>
              <div className={styles.frame10000034853}>
                <div className={styles.frame10000034152}>
                  <p className={styles.placeholder}>Enter here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.component81}>
          <p className={styles.reviewSubmit}>Review & Submit</p>
        </div>
      </div>
    </div>
  );
}

export default Component;
