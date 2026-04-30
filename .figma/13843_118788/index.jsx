import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.frame1000004140}>
      <div className={styles.frame1000004076}>
        <p className={styles.requests}>Requests</p>
        <p className={styles.viewAll}>View All</p>
      </div>
      <div className={styles.frame1000004139}>
        <div className={styles.frame1000004078}>
          <div className={styles.frame1000004098}>
            <p className={styles.checkIn}>Check In</p>
            <div className={styles.frame1000004057}>
              <p className={styles.manualLog}>Manual Log</p>
            </div>
          </div>
          <div className={styles.frame1000004137}>
            <div className={styles.frame1000004135}>
              <p className={styles.punchTime}>Punch Time</p>
              <p className={styles.a12Jan20260945Am}>12 Jan 2026, 09:45 AM</p>
            </div>
            <div className={styles.frame1000004135}>
              <p className={styles.punchTime}>Reason</p>
              <p className={styles.a12Jan20260945Am}>Late due to traffic</p>
            </div>
          </div>
          <div className={styles.frame1000004058}>
            <p className={styles.pending}>Pending</p>
          </div>
        </div>
        <div className={styles.frame10000040782}>
          <div className={styles.frame1000004098}>
            <p className={styles.checkIn}>Check Out</p>
            <div className={styles.frame1000004057}>
              <p className={styles.manualLog}>Manual Log</p>
            </div>
          </div>
          <div className={styles.frame1000004137}>
            <div className={styles.frame1000004135}>
              <p className={styles.punchTime}>Punch Time</p>
              <p className={styles.a12Jan20260945Am}>15 Jan 2026, 07:23 PM</p>
            </div>
            <div className={styles.frame1000004135}>
              <p className={styles.punchTime}>Reason</p>
              <p className={styles.a12Jan20260945Am}>Due To Power Failure</p>
            </div>
          </div>
          <div className={styles.frame10000040572}>
            <p className={styles.rejected}>Rejected</p>
          </div>
        </div>
        <div className={styles.frame1000004078}>
          <div className={styles.frame1000004098}>
            <p className={styles.checkIn}>Sick Leave</p>
            <div className={styles.frame1000004057}>
              <p className={styles.manualLog}>Leave</p>
            </div>
          </div>
          <div className={styles.frame1000004137}>
            <div className={styles.frame1000004135}>
              <p className={styles.punchTime}>Leave Date</p>
              <p className={styles.a12Jan20260945Am}>03 Jan 2026</p>
            </div>
            <div className={styles.frame1000004135}>
              <p className={styles.punchTime}>Reason</p>
              <p className={styles.a12Jan20260945Am}>Severe Headache</p>
            </div>
          </div>
          <div className={styles.frame1000004058}>
            <p className={styles.pending}>Pending</p>
          </div>
        </div>
        <div className={styles.frame1000004093}>
          <div className={styles.frame1000004098}>
            <p className={styles.checkIn}>Casual Leave</p>
            <div className={styles.frame1000004057}>
              <p className={styles.manualLog}>Leave</p>
            </div>
          </div>
          <div className={styles.frame10000041372}>
            <div className={styles.frame10000041352}>
              <p className={styles.punchTime}>Leave Date</p>
              <p className={styles.a12Jan20260945Am}>05 Jan 2026 - 06 Jan 2026</p>
            </div>
            <div className={styles.frame1000004135}>
              <p className={styles.punchTime}>Reason</p>
              <p className={styles.a12Jan20260945Am}>Personal Errands</p>
            </div>
          </div>
          <div className={styles.frame10000040573}>
            <p className={styles.approved}>Approved</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Component;
