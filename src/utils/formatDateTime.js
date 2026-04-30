import moment from "moment";

export const formatDateTime = (dateString) => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    const date = new Date(dateString);
    return date.toLocaleString('sv-SE', options).replace(' ', 'T').replace(/-/g, '-').replace(/\./g, ':').replace('T', ' ');
  }; // like 'YYYY-MM-DDTHH:mm:ss'
  
  export const dateTimeToShow = (dateString) => {
    if (!dateString) return '--';
    return moment.utc(dateString).local().format('DD MMM YYYY, hh:mm A');
  };
  export function convertUtcToLocalTime(utcTime) {
    // Parse the UTC time
    const utcDate = moment.utc(utcTime);
    
    // Convert to local time
    const localTime = utcDate.local();
    
    // Return as a JavaScript Date object
    return localTime.toDate();
}

export const formatPayslipDate = (dateString) => {
    if (!dateString) return '';
    return moment(dateString).format('DD-MMM-YYYY');
};

export const formatPayslipRange = (pay_date_range, start_date, end_date, fallback = '--') => {
    if (start_date && end_date) {
        return `${moment(start_date).format('DD-MMM-YYYY')} to ${moment(end_date).format('DD-MMM-YYYY')}`;
    }
    if (pay_date_range) {
        // Handle cases where pay_date_range might be "2026-02-02 to 2026-03-03"
        const parts = pay_date_range.split(' to ');
        if (parts.length === 2) {
            const start = moment(parts[0], ['YYYY-MM-DD', 'DD-MM-YYYY', moment.ISO_8601], true);
            const end = moment(parts[1], ['YYYY-MM-DD', 'DD-MM-YYYY', moment.ISO_8601], true);
            if (start.isValid() && end.isValid()) {
                return `${start.format('DD-MMM-YYYY')} to ${end.format('DD-MMM-YYYY')}`;
            }
        }
        return pay_date_range;
    }
    return fallback;
};

export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || amount === '') return '0.00';
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
};
  