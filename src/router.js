import Path from 'path-parser';



class Router {

  constructor() {
    this._routes = [];
    this._context = {};
  }



  /*
   *  PRIVATE HELPERS
   */

  _match(url) {
    const matchPredicate = route => route.path.match(url, true);
    return this._routes.filter(matchPredicate)[0];
  };

  _buildLocation(url, routePath) {
    const {path, query, queryString} = parseUrl(url);
    const params = routePath ? routePath.match(path, true) : {};
    return {
      url,
      path,
      params,
      query,
      queryString
    };
  }



  /*
   *  PRIVATE EVENTS
   */

  _handleDone(routeFinishCb, data={}) {
    if (data.error) return routeFinishCb(null, null, data.error);
    if (data.redirect) return routeFinishCb(null, data.redirect, null);
    routeFinishCb(data, null, null);
  }



  /*
   *  PUBLIC API
   */

  setContext(context) {
    this._context = context;
  }

  use(path, handler) {
    this._routes.push({
      path: new Path(path),
      handler
    });
  }

  startRouting(history, routeFinishCb) {
    let preRouted = true; // convenience on the client to know this route was already handled by server
    history.listen(location => {
      const url = `${location.pathname}${location.search}`
      this.route(url, routeFinishCb, preRouted);
      preRouted = false;
    });
  }

  route(url, routeFinishCb=()=>{}, preRouted=false) {
    // find corresponding route
    const path = parseUrl(url).path;
    const route = this._match(path);
    const location = this._buildLocation(url, route && route.path);
    // first arg to finishCallback will always be location, regardless of outcome
    routeFinishCb = routeFinishCb.bind(this, location);
    // when no route found, invoke callback without any args (no args indicates not found)
    if (!route) return routeFinishCb();
    // invoke the route
    const done = this._handleDone.bind(this, routeFinishCb);
    const context = this._context;
    route.handler(done, location, context, preRouted);
  }

};



/*
 *  UTILS
 */

// breaks given url into path, queryString, and query object
const parseUrl = function(url) {
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
}



export default Router;
