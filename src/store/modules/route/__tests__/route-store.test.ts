import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchUserRoutesMock, addRouteMock, removeRouteMock, initHomeTabMock, authMock } =
  vi.hoisted(() => ({
    fetchUserRoutesMock: vi.fn(),
    addRouteMock: vi.fn(() => vi.fn()),
    removeRouteMock: vi.fn(),
    initHomeTabMock: vi.fn(),
    authMock: {
      userInfo: {
        id: 0,
        username: '',
        permissionCodes: [] as string[]
      },
      isSuperPermission: false,
      permissionCodes: [] as string[],
      initUserInfo: vi.fn().mockResolvedValue(undefined),
      resetStore: vi.fn().mockResolvedValue(undefined)
    }
  }));

vi.mock('@/service/api/menu', () => ({
  fetchUserRoutes: fetchUserRoutesMock
}));

vi.mock('@/router', () => ({
  router: {
    addRoute: addRouteMock,
    removeRoute: removeRouteMock,
    currentRoute: { value: { name: 'home', meta: {} } }
  }
}));

vi.mock('@/hooks/common/icon', () => ({
  useSvgIcon: () => ({
    SvgIconVNode: () => () => null
  })
}));

vi.mock('@/store/modules/tab', () => ({
  useTabStore: () => ({
    initHomeTab: initHomeTabMock
  })
}));

vi.mock('@/store/modules/auth', () => ({
  useAuthStore: () => authMock
}));

function configureAuth(options: {
  permissionCodes?: string[];
  userId?: number;
  username?: string;
}) {
  const permissionCodes = options.permissionCodes ?? ['*:*'];
  const isSuper = permissionCodes.includes('*:*');

  authMock.userInfo.id = options.userId ?? 1;
  authMock.userInfo.username = options.username ?? 'admin';
  authMock.userInfo.permissionCodes = permissionCodes;
  authMock.permissionCodes = permissionCodes;
  authMock.isSuperPermission = isSuper;
}

async function loadRouteStore(mode: 'static' | 'dynamic') {
  vi.stubEnv('VITE_AUTH_ROUTE_MODE', mode);
  vi.resetModules();
  const { useRouteStore } = await import('../index');
  return useRouteStore;
}

describe('useRouteStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    configureAuth({});
    (window.$message!.error as ReturnType<typeof vi.fn>).mockClear();
  });

  describe('static mode', () => {
    it('initAuthRoute registers filtered auth routes and grouped menus', async () => {
      const useRouteStore = await loadRouteStore('static');
      const routeStore = useRouteStore();
      await routeStore.initAuthRoute();

      expect(routeStore.isInitAuthRoute).toBe(true);
      expect(routeStore.menus.some(menu => menu.key === 'home')).toBe(true);
      expect(routeStore.menus.some(menu => menu.key === 'system-management')).toBe(true);
      expect(addRouteMock).toHaveBeenCalled();
      expect(authMock.initUserInfo).not.toHaveBeenCalled();
    });

    it('calls initUserInfo when user profile is missing', async () => {
      configureAuth({ userId: 0, username: '', permissionCodes: ['*:*'] });
      authMock.initUserInfo.mockImplementation(async () => {
        authMock.userInfo.id = 1;
        authMock.userInfo.username = 'admin';
      });

      const useRouteStore = await loadRouteStore('static');
      const routeStore = useRouteStore();
      await routeStore.initAuthRoute();

      expect(authMock.initUserInfo).toHaveBeenCalledTimes(1);
      expect(routeStore.isInitAuthRoute).toBe(true);
    });
  });

  describe('dynamic mode', () => {
    it('initAuthRoute builds menus from serialized API tree', async () => {
      fetchUserRoutesMock.mockResolvedValue({
        data: {
          routes: [
            {
              name: 'home',
              path: '/home',
              component: 'layout.base$view.home',
              meta: { permissionCodes: ['dashboard:read'] }
            }
          ],
          home: 'home',
          menus: [
            {
              key: 'home',
              label: 'home',
              i18nKey: 'route.home',
              routeKey: 'home',
              routePath: '/home'
            }
          ]
        },
        error: null
      });

      const useRouteStore = await loadRouteStore('dynamic');
      const routeStore = useRouteStore();
      await routeStore.initAuthRoute();

      expect(routeStore.isInitAuthRoute).toBe(true);
      expect(routeStore.menus).toHaveLength(1);
      expect(routeStore.menus[0]?.key).toBe('home');
      expect(routeStore.routeHome).toBe('home');
    });

    it('logs out only on auth errors from user-routes', async () => {
      fetchUserRoutesMock.mockResolvedValue({
        data: null,
        error: { response: { status: 401 } }
      });

      const useRouteStore = await loadRouteStore('dynamic');
      const routeStore = useRouteStore();
      await routeStore.initAuthRoute();

      expect(authMock.resetStore).toHaveBeenCalledTimes(1);
      expect(routeStore.isInitAuthRoute).toBe(false);
    });

    it('shows error toast on transient user-routes failure without logout', async () => {
      fetchUserRoutesMock.mockResolvedValue({
        data: null,
        error: { response: { status: 503 } }
      });

      const useRouteStore = await loadRouteStore('dynamic');
      const routeStore = useRouteStore();
      await routeStore.initAuthRoute();

      expect(authMock.resetStore).not.toHaveBeenCalled();
      expect(window.$message?.error).toHaveBeenCalled();
      expect(routeStore.isInitAuthRoute).toBe(false);
    });
  });
});
