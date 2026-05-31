import { computed, nextTick, ref, shallowRef } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import { defineStore } from 'pinia';
import { useBoolean } from '@suga/hooks';
import type {
  CustomRoute,
  ElegantConstRoute,
  LastLevelRouteKey,
  RouteKey,
  RouteMap
} from '@elegant-router/types';
import { router } from '@/router';
import { fetchUserRoutes } from '@/service/api/menu';
import { useSvgIcon } from '@/hooks/common/icon';
import { isAuthHttpStatus, resolveHttpStatus } from '@/utils/request/http-status';
import { $t } from '@/locales';
import { SetupStoreId } from '@/enum';
import { createStaticRoutes, getAuthVueRoutes } from '@/router/routes';
import { ROOT_ROUTE } from '@/router/routes/builtin';
import { getRouteName, getRoutePath } from '@/router/elegant/transform';
import { useAuthStore } from '../auth';
import { useTabStore } from '../tab';
import {
  buildDynamicGlobalMenus,
  buildStaticGlobalMenus,
  getBreadcrumbsByRoute,
  getSelectedMenuKeyPathByKey,
  transformMenuToSearchMenus,
  updateLocaleOfGlobalMenus
} from './global-menus';
import {
  filterAuthRoutesByPermissions,
  getCacheRouteNames,
  isRouteExistByRouteName,
  sortRoutesByOrder
} from './shared';

type AuthRouteMode = 'static' | 'dynamic';

function readAuthRouteMode(): AuthRouteMode {
  return import.meta.env.VITE_AUTH_ROUTE_MODE === 'dynamic' ? 'dynamic' : 'static';
}

export const useRouteStore = defineStore(SetupStoreId.Route, () => {
  const authStore = useAuthStore();
  const tabStore = useTabStore();
  const { SvgIconVNode: renderIcon } = useSvgIcon();
  const { bool: isInitConstantRoute, setBool: setIsInitConstantRoute } = useBoolean();
  const { bool: isInitAuthRoute, setBool: setIsInitAuthRoute } = useBoolean();

  const authRouteMode = ref<AuthRouteMode>(readAuthRouteMode());
  const routeHome = ref(import.meta.env.VITE_ROUTE_HOME);

  function setRouteHome(routeKey: LastLevelRouteKey) {
    routeHome.value = routeKey;
  }

  const constantRoutes = shallowRef<ElegantConstRoute[]>([]);
  const authRoutes = shallowRef<ElegantConstRoute[]>([]);
  const dynamicSerializedMenus = shallowRef<Api.MenuManagement.SerializedMenuNode[] | null>(null);

  const menus = ref<App.Global.Menu[]>([]);
  const searchMenus = computed(() => transformMenuToSearchMenus(menus.value));

  const removeRouteFns: (() => void)[] = [];

  function addConstantRoutes(routes: ElegantConstRoute[]) {
    constantRoutes.value = dedupeRoutesByName(routes);
  }

  function addAuthRoutes(routes: ElegantConstRoute[]) {
    authRoutes.value = dedupeRoutesByName(routes);
  }

  function dedupeRoutesByName(routes: ElegantConstRoute[]): ElegantConstRoute[] {
    return Array.from(new Map(routes.map(route => [route.name, route])).values());
  }

  function buildMenus(routes: ElegantConstRoute[]) {
    if (authRouteMode.value === 'dynamic') {
      menus.value = dynamicSerializedMenus.value?.length
        ? buildDynamicGlobalMenus(dynamicSerializedMenus.value, renderIcon)
        : [];
      return;
    }

    menus.value = buildStaticGlobalMenus(routes, renderIcon);
  }

  function updateGlobalMenusByLocale() {
    menus.value = updateLocaleOfGlobalMenus(menus.value);
  }

  const cacheRoutes = ref<RouteKey[]>([]);
  const excludeCacheRoutes = ref<RouteKey[]>([]);

  function getCacheRoutes(routes: RouteRecordRaw[]) {
    cacheRoutes.value = getCacheRouteNames(routes);
  }

  async function resetRouteCache(routeKey?: RouteKey) {
    const routeName = routeKey || (router.currentRoute.value.name as RouteKey);
    excludeCacheRoutes.value.push(routeName);
    await nextTick();
    excludeCacheRoutes.value = [];
  }

  const breadcrumbs = computed(() =>
    getBreadcrumbsByRoute(router.currentRoute.value, menus.value, renderIcon)
  );

  async function resetStore() {
    useRouteStore().$reset();
    resetVueRoutes();
    await initConstantRoute();
  }

  function resetVueRoutes() {
    removeRouteFns.forEach(fn => fn());
    removeRouteFns.length = 0;
  }

  async function initConstantRoute() {
    if (isInitConstantRoute.value) return;

    const { constantRoutes: staticConstantRoutes } = createStaticRoutes();
    addConstantRoutes(staticConstantRoutes);
    handleConstantAndAuthRoutes();
    setIsInitConstantRoute(true);
    tabStore.initHomeTab();
  }

  async function initAuthRoute() {
    if (!authStore.userInfo.id || !authStore.userInfo.username) {
      await authStore.initUserInfo();
    }

    if (authRouteMode.value === 'static') {
      initStaticAuthRoute();
    } else {
      await initDynamicAuthRoute();
    }

    tabStore.initHomeTab();
  }

  function initStaticAuthRoute() {
    const { authRoutes: staticAuthRoutes } = createStaticRoutes();
    const routes = authStore.isSuperPermission
      ? staticAuthRoutes
      : filterAuthRoutesByPermissions(staticAuthRoutes, authStore.permissionCodes);

    addAuthRoutes(routes);
    handleConstantAndAuthRoutes();
    setIsInitAuthRoute(true);
  }

  async function initDynamicAuthRoute() {
    const { data, error } = await fetchUserRoutes();

    if (error) {
      if (isAuthHttpStatus(resolveHttpStatus(error))) {
        authStore.resetStore();
      } else {
        window.$message?.error($t('common.error'));
      }
      return;
    }

    const { routes, home, menus: serializedMenus } = data;

    dynamicSerializedMenus.value = serializedMenus ?? null;
    addAuthRoutes(routes);
    handleConstantAndAuthRoutes();
    setRouteHome(home);
    handleUpdateRootRouteRedirect(home);
    setIsInitAuthRoute(true);
  }

  async function reloadAuthRoutes() {
    setIsInitAuthRoute(false);
    resetVueRoutes();
    await initAuthRoute();
  }

  function handleConstantAndAuthRoutes() {
    const sortedRoutes = sortRoutesByOrder([...constantRoutes.value, ...authRoutes.value]);
    const vueRoutes = getAuthVueRoutes(sortedRoutes);

    resetVueRoutes();
    addRoutesToVueRouter(vueRoutes);
    buildMenus(sortedRoutes);
    getCacheRoutes(vueRoutes);
  }

  function addRoutesToVueRouter(routes: RouteRecordRaw[]) {
    routes.forEach(route => {
      removeRouteFns.push(router.addRoute(route));
    });
  }

  function handleUpdateRootRouteRedirect(redirectKey: LastLevelRouteKey) {
    const redirect = getRoutePath(redirectKey);
    if (!redirect) return;

    const rootRoute: CustomRoute = { ...ROOT_ROUTE, redirect };
    router.removeRoute(rootRoute.name);

    const [rootVueRoute] = getAuthVueRoutes([rootRoute]);
    router.addRoute(rootVueRoute);
  }

  async function getIsAuthRouteExist(routePath: RouteMap[RouteKey]) {
    const routeName = getRouteName(routePath);
    if (!routeName) return false;

    if (authRouteMode.value === 'static') {
      const { authRoutes: staticAuthRoutes } = createStaticRoutes();
      return isRouteExistByRouteName(routeName, staticAuthRoutes);
    }

    return isRouteExistByRouteName(routeName, authRoutes.value);
  }

  function getSelectedMenuKeyPath(selectedKey: string) {
    return getSelectedMenuKeyPathByKey(selectedKey, menus.value);
  }

  async function onRouteSwitchWhenLoggedIn() {
    await authStore.initUserInfo();
  }

  async function onRouteSwitchWhenNotLoggedIn() {
    // reserved for anonymous route hooks
  }

  return {
    resetStore,
    routeHome,
    menus,
    searchMenus,
    updateGlobalMenusByLocale,
    cacheRoutes,
    excludeCacheRoutes,
    resetRouteCache,
    breadcrumbs,
    initConstantRoute,
    isInitConstantRoute,
    initAuthRoute,
    isInitAuthRoute,
    setIsInitAuthRoute,
    reloadAuthRoutes,
    getIsAuthRouteExist,
    getSelectedMenuKeyPath,
    onRouteSwitchWhenLoggedIn,
    onRouteSwitchWhenNotLoggedIn
  };
});
