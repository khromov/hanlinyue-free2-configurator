export type Route = 'presets' | 'custom' | 'scripts' | 'light' | 'more';

const ROUTES: Route[] = ['presets', 'custom', 'scripts', 'light', 'more'];

function parse(): Route {
  const name = location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(name) ? name : 'presets';
}

class Router {
  current = $state<Route>(parse());

  constructor() {
    window.addEventListener('hashchange', () => {
      this.current = parse();
    });
  }

  go(route: Route) {
    location.hash = `/${route}`;
  }
}

export const router = new Router();
