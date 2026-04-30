import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.newLeaveRequest}>
      <div className={styles.autoWrapper2}>
        <div className={styles.frame8}>
          <p className={styles.a0404}>04:04</p>
          <div className={styles.frame4}>
            <img src="../image/mmdbjxta-5xodt0j.svg" className={styles.frame} />
            <img src="../image/mmdbjxta-y3j12bm.svg" className={styles.frame} />
            <img src="../image/mmdbjxta-c5quwv2.svg" className={styles.frame} />
          </div>
        </div>
        <div className={styles.frame1321319233}>
          <div className={styles.frame1321319192}>
            <img src="../image/mmdbjxta-p600jnq.svg" className={styles.frame2} />
            <p className={styles.leaveRequest}>Leave Request</p>
          </div>
          <div className={styles.frame1321319230}>
            <p className={styles.requestDetails}>Request Details</p>
            <div className={styles.frame1000003485}>
              <p className={styles.username}>Leave Type</p>
              <div className={styles.frame1000003415}>
                <p className={styles.placeholder}>Select</p>
                <img src="../image/mmdbjxta-eiuh90c.svg" className={styles.frame} />
              </div>
            </div>
            <div className={styles.frame1321319231}>
              <div className={styles.frame10000034852}>
                <p className={styles.username}>From Date</p>
                <div className={styles.frame1000003415}>
                  <p className={styles.placeholder}>DD/MM/YYYY</p>
                  <img
                    src="../image/mmdbjxta-xnsshwb.svg"
                    className={styles.frame}
                  />
                </div>
              </div>
              <div className={styles.frame10000034852}>
                <p className={styles.username}>To Date</p>
                <div className={styles.frame1000003415}>
                  <p className={styles.placeholder}>DD/MM/YYYY</p>
                  <img
                    src="../image/mmdbjxta-xnsshwb.svg"
                    className={styles.frame}
                  />
                </div>
              </div>
            </div>
            <div className={styles.frame1321319239}>
              <div className={styles.checkBox2}>
                <div className={styles.checkBox} />
              </div>
              <p className={styles.halfDayRequest}>Half Day Request</p>
            </div>
            <div className={styles.frame1000004208}>
              <div className={styles.autoWrapper}>
                <div className={styles.ellipse43} />
                <div className={styles.rectangle12466}>
                  <p className={styles.a1stHalf}>1st Half</p>
                </div>
              </div>
              <p className={styles.a2ndHalf}>2nd Half</p>
              <div className={styles.ellipse44} />
            </div>
            <div className={styles.frame1000003825}>
              <div className={styles.frame1321319240}>
                <div className={styles.frame1321319232}>
                  <p className={styles.requestedDays}>Requested Days</p>
                  <p className={styles.a00Days}>0.0 Days</p>
                </div>
                <div className={styles.frame1321319232}>
                  <p className={styles.requestedDays}>Available Balance</p>
                  <p className={styles.a00Days}>14.5 Days</p>
                </div>
              </div>
              <div className={styles.line28} />
              <div className={styles.frame1321319234}>
                <p className={styles.halfDayRequest}>Balance After Request</p>
                <p className={styles.a00Days}>14.5 Days</p>
              </div>
            </div>
          </div>
          <div className={styles.frame13213192312}>
            <p className={styles.requestDetails}>Justification</p>
            <div className={styles.frame13213192322}>
              <p className={styles.halfDayRequest}>Reason</p>
              <div className={styles.frame10000034853}>
                <div className={styles.frame10000034152}>
                  <p className={styles.placeholder}>Enter here</p>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.frame13213192323}>
            <p className={styles.requestDetails}>Attachments</p>
            <div className={styles.frame1321319069}>
              <div className={styles.frame1321319070}>
                <img src="../image/mmdbjxtb-sdaycxq.svg" className={styles.frame} />
                <div className={styles.frame1321319180}>
                  <p className={styles.chooseAFile}>Choose a file</p>
                  <p className={styles.jPegOrPngUpTo5Mb}>JPEG or PNG up to 5 MB</p>
                </div>
              </div>
              <div className={styles.component81}>
                <p className={styles.browseFile}>Browse File</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.component812}>
        <p className={styles.reviewSubmit}>Review & Submit</p>
      </div>
    </div>
  );
}

export default Component;
