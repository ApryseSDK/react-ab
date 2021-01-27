export const queryToObject = (location) => {

  var search = location.search.substring(1);

  if (search === '') {
    const hash = location.hash;
    if (hash && hash.indexOf('?') > -1) {
      search = hash.split('?')[1];
    }
  }

  if (!search) return {};

  const queries = search.split('&');

  const map = {};

  queries.forEach((q) => {
    const [key, value] = q.split('=');
    map[key] = value.split(',');
  });

  return map;
};

export const formatLink = (l: string) => {
  if (!l.startsWith('/')) {
    l = '/' + l;
  }

  if (!l.endsWith('/')) {
    l += '/';
  }
  return l;
}