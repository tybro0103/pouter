
export const parseUrl = function(url) {
  const parts = url.split('?');
  const path = parts[0];
  const queryString = (parts[1] || '');
  const query = queryString.split('&')
    .map(part => part.split('='))
    .reduce((query, kvParts) => {
      return {...query, [kvParts[0]]: kvParts[1]};
    }, {});

  return {
    path,
    queryString,
    query
  }
};
