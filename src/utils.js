
export const parseUrl = function(url) {
  const parts = url.split('?');
  const path = parts[0];
  const queryString = (parts[1] || '');
  const query = queryString.length > 0
    ? queryString.split('&')
        .map(part => part.split('='))
        .reduce((query, kvParts) => {
          const decodedKey = decodeURIComponent(kvParts[0]);
          const decodedVal = decodeURIComponent(kvParts[1]);
          return {...query, [decodedKey]: decodedVal};
        }, {})
    : {};

  return {
    path,
    queryString,
    query
  }
};
