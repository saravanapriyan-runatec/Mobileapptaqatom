export const getPunchStateLabel = punchStateId => {
    switch (punchStateId) {
      case '0':
        return 'Check In';
      case '1':
        return 'Check Out';
      case '2':
        return 'Break Out';
      case '3':
        return 'Break In';
      case '4':
        return 'Overtime In';
      case '5':
        return 'Overtime Out';
      default:
        return '-';
    }
  };
  