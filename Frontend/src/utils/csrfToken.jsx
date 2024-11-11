
export const getCsrfToken = () => {
    // Look for the 'csrftoken' in the document's cookies
    const csrfCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='));
    // Return the value of the CSRF token or null if not found
    return csrfCookie ? csrfCookie.split('=')[1] : null;
  };
  