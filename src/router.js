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
    // TODO: ditch find() for better compatibility
    return this._routes.find(route => route.path.match(url, true));
  };

  // builds the collection callbacks for the route to indicate its outcome
  _buildDone(routeFinishCb) {
    // point the outcome functions at the respective private handlers, pre-setting the finishCallback
    return {
      ok: this._handleDoneOk.bind(this, routeFinishCb),
      error: this._handleDoneError.bind(this, routeFinishCb),
      redirect: this._handleDoneRedirect.bind(this, routeFinishCb)
    }
  }

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

  _handleDoneOk(routeFinishCb, data={}) {
    routeFinishCb(data, null, null);
  }

  _handleDoneRedirect(routeFinishCb, url) {
    routeFinishCb(null, url, null);
  }

  _handleDoneError(routeFinishCb, error) {
    routeFinishCb(null, null, error);
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
    const location = this._buildLocation(url, route && route.path);
    // first arg to finishCallback will always be location, regardless of outcome
    routeFinishCb = routeFinishCb.bind(this, location);
    // when no route found, invoke callback without any args (no args indicates not found)
    if (!route) return routeFinishCb();
    // invoke the route
    const done = this._buildDone(routeFinishCb);
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
  const path = parts[0];
  const queryString = (parts[1] || '');
  // TODO: ditch map() and reduce() for better compatibility
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
