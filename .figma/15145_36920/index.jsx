import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.newOvertimeRequest}>
      <div className={styles.rectangle2}>
        <div className={styles.frame8}>
          <p className={styles.a0404}>04:04</p>
          <div className={styles.frame4}>
            <img src="../image/mmdbjxrx-ewcv089.svg" className={styles.frame} />
            <img src="../image/mmdbjxrx-rygorbn.svg" className={styles.frame} />
            <img src="../image/mmdbjxrx-56efm8z.svg" className={styles.frame} />
          </div>
        </div>
        <div className={styles.frame1321319233}>
          <div className={styles.frame1321319192}>
            <img src="../image/mmdbjxrx-n15aa2w.svg" className={styles.frame2} />
            <p className={styles.overtimeRequest}>Overtime Request</p>
          </div>
          <div className={styles.frame1321319230}>
            <p className={styles.requestDetails}>Request Details</p>
            <div className={styles.frame1000003485}>
              <p className={styles.username}>OT Type</p>
              <div className={styles.frame1000003415}>
                <p className={styles.placeholder}>Select</p>
                <img src="../image/mmdbjxrx-wdjvez8.svg" className={styles.frame} />
              </div>
            </div>
            <div className={styles.frame1000003485}>
              <p className={styles.username}>Loan Amount</p>
              <div className={styles.frame1000003415}>
                <p className={styles.placeholder}>03 Feb 2026</p>
                <img src="../image/mmdbjxrx-tc6mxvu.svg" className={styles.frame} />
              </div>
            </div>
            <div className={styles.frame1321319231}>
              <div className={styles.frame10000034852}>
                <p className={styles.username}>OT Start Time</p>
                <div className={styles.frame1000003415}>
                  <p className={styles.placeholder}>--:--</p>
                  <img
                    src="../image/mmdbjxrx-9e3dml7.svg"
                    className={styles.frame}
                  />
                </div>
              </div>
              <div className={styles.frame10000034852}>
                <p className={styles.username}>OT End Time</p>
                <div className={styles.frame1000003415}>
                  <p className={styles.placeholder}>--:--</p>
                  <img
                    src="../image/mmdbjxrx-9e3dml7.svg"
                    className={styles.frame}
                  />
                </div>
              </div>
            </div>
            <div className={styles.frame1321319234}>
              <p className={styles.totalHours}>Total Hours</p>
              <p className={styles.a30Hours}>3.0 Hours</p>
            </div>
          </div>
          <div className={styles.frame13213192312}>
            <p className={styles.requestDetails}>Justification</p>
            <div className={styles.frame1321319232}>
              <p className={styles.totalHours}>Reason</p>
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
