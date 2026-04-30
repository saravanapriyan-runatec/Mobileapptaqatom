import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.newPermissionRequest}>
      <div className={styles.rectangle2}>
        <div className={styles.frame8}>
          <p className={styles.a0404}>04:04</p>
          <div className={styles.frame4}>
            <img src="../image/mmdbjxwc-26itz8q.svg" className={styles.frame} />
            <img src="../image/mmdbjxwc-zo8o60t.svg" className={styles.frame} />
            <img src="../image/mmdbjxwc-vnp7qux.svg" className={styles.frame} />
          </div>
        </div>
        <div className={styles.frame13213192332}>
          <div className={styles.frame1321319192}>
            <img src="../image/mmdbjxwc-g95x2vq.svg" className={styles.frame2} />
            <p className={styles.permissionRequest}>Permission Request</p>
          </div>
          <div className={styles.frame1321319230}>
            <p className={styles.requestDetails}>Request Details</p>
            <div className={styles.frame1000003485}>
              <p className={styles.username}>Date</p>
              <div className={styles.frame1000003415}>
                <p className={styles.placeholder}>03 Feb 2026</p>
                <img src="../image/mmdbjxwc-2by2klt.svg" className={styles.frame} />
              </div>
            </div>
            <div className={styles.frame1321319231}>
              <div className={styles.frame10000034852}>
                <p className={styles.username}>From Time</p>
                <div className={styles.frame1000003415}>
                  <p className={styles.placeholder}>--:--</p>
                  <img
                    src="../image/mmdbjxwc-bro73f4.svg"
                    className={styles.frame}
                  />
                </div>
              </div>
              <div className={styles.frame10000034852}>
                <p className={styles.username}>To Time</p>
                <div className={styles.frame1000003415}>
                  <p className={styles.placeholder}>--:--</p>
                  <img
                    src="../image/mmdbjxwc-bro73f4.svg"
                    className={styles.frame}
                  />
                </div>
              </div>
            </div>
            <div className={styles.frame1000003825}>
              <img src="../image/mmdbjxwc-4553bf3.svg" className={styles.frame} />
              <p className={styles.perDayTimeLimit2Hour3}>
                <span className={styles.perDayTimeLimit2Hour}>
                  Per Day Time limit:&nbsp;
                </span>
                <span className={styles.perDayTimeLimit2Hour2}>2 hours</span>
              </p>
            </div>
            <div className={styles.frame1321319232}>
              <div className={styles.frame1321319233}>
                <p className={styles.availablePermission}>Available Permission</p>
                <p className={styles.a40Hours}>4.0 Hours</p>
              </div>
              <div className={styles.line28} />
              <div className={styles.frame1321319234}>
                <p className={styles.totalHours}>Total Hours</p>
                <p className={styles.a40Hours}>0.0 Hours</p>
              </div>
            </div>
          </div>
          <div className={styles.frame13213192312}>
            <p className={styles.requestDetails}>Justification</p>
            <div className={styles.frame13213192322}>
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
