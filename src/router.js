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
    return this._routes.find(route => route.path.match(url, true));
  };

  _buildDone(routeFinishCb) {
    return {
      ok: this._handleDoneOk.bind(this, routeFinishCb),
      error: this._handleDoneError.bind(this, routeFinishCb),
      redirect: this._handleDoneRedirect.bind(this, routeFinishCb)
    }
  }

  _buildLocation(routePath, url) {
    const {path, query, queryString} = parseUrl(url);
    const params = routePath.match(path, true);
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

  _handleDoneOk(routeFinishCb, meta={}) {
    routeFinishCb(meta, null, null);
  }

  _handleDoneError(routeFinishCb, error) {
    routeFinishCb(null, null, error);
  }

  _handleDoneRedirect(routeFinishCb, url) {
    routeFinishCb(null, url, null);
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
    history.listen(location => {
      const url = `${location.pathname}${location.search}`
      this.route(url, routeFinishCb);
    });
  }

  route(url, routeFinishCb=()=>{}) {
    // find corresponding route
    const path = parseUrl(url).path;
    const route = this._match(path);
    // if there's not one, invoke callback without any args (no args indicates not found)
    if (!route) return routeFinishCb();
    // invoke the route
    const done = this._buildDone(routeFinishCb);
    const location = this._buildLocation(route.path, url);
    const context = this._context;
    route.handler(done, location, context);
  }

};



/*
 *  UTILS
 */

// breaks given url into path, queryString, and query object
const parseUrl = function(url) {
  const parts = url.split('?');
  const query = (parts[1] || '')
    .split('&')
    .map(part => part.split('='))
    .reduce((query, kvParts) => {
      return {...query, [kvParts[0]]: kvParts[1]};
    }, {});
  return {
    path: parts[0],
    queryString: parts[1],
    query
  }
}



export default Router;
