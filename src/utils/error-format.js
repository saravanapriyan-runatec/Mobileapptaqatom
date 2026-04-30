import Toast from 'react-native-toast-message';

export function formatErrorsToToastMessages(error) {
  // Extract errors from both potential locations
  const errorResponse = error?.errorResponse || {};
  const errors = errorResponse.errors || error?.errors;
  const topLevelMessage = error?.message || errorResponse?.message || error?.detail || errorResponse?.detail || error?.details || errorResponse?.details;

  const showToast = (msg) => {
    if (!msg) return;
    Toast.show({
      text1: String(msg),
      type: 'error',
      position: 'top',
      visibilityTime: 3000
    });
  };

  if (!errors || !Array.isArray(errors)) {
    if (topLevelMessage && typeof topLevelMessage === 'string') {
      showToast(topLevelMessage);
    } else {
      showToast('Something went wrong');
    }
    return;
  }

  errors.forEach((errorItem) => {
    // Some structures have errorItem as an array itself
    if (Array.isArray(errorItem)) {
      errorItem.forEach(subItem => {
        if (typeof subItem === 'string') showToast(subItem);
        else if (subItem?.message) showToast(subItem.message);
      });
      return;
    }

    const itemMessage = errorItem?.message;

    if (itemMessage && typeof itemMessage === 'object') {
      // Handle field-level errors (e.g., { field: ["error message"], non_field_errors: [...] })
      Object.entries(itemMessage).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          messages.forEach(msg => {
            if (typeof msg === 'string') showToast(msg);
            else if (msg?.message) showToast(String(msg.message));
          });
        } else if (typeof messages === 'object' && messages !== null) {
          // Handle nested objects
          Object.values(messages).forEach(nested => {
            if (Array.isArray(nested)) {
              nested.forEach(m => showToast(typeof m === 'string' ? m : JSON.stringify(m)));
            } else {
              showToast(typeof nested === 'string' ? nested : JSON.stringify(nested));
            }
          });
        } else {
          showToast(String(messages));
        }
      });
    } else if (itemMessage) {
      showToast(String(itemMessage));
    } else if (typeof errorItem === 'string') {
      showToast(errorItem);
    } else if (errorItem && typeof errorItem === 'object') {
      // Last resort: check for any string values in the object
      const entryValues = Object.values(errorItem);
      let foundString = false;
      entryValues.forEach(val => {
        if (typeof val === 'string') {
          showToast(val);
          foundString = true;
        } else if (Array.isArray(val)) {
          val.forEach(v => {
            if (typeof v === 'string') {
              showToast(v);
              foundString = true;
            }
          });
        }
      });
      if (!foundString) {
        showToast('An unexpected error occurred. Please try again.');
      }
    }
  });
}