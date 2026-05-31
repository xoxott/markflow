import { describe, expect, it } from 'vitest';
import type { ElegantConstRoute } from '@elegant-router/types';
import { sortRoutesByOrder } from '../shared';

describe('sortRoutesByOrder', () => {
  it('does not mutate the input array or nested children', () => {
    const routes: ElegantConstRoute[] = [
      {
        name: 'b',
        path: '/b',
        component: 'layout.base$view.b',
        meta: { title: 'B', order: 2 }
      },
      {
        name: 'a',
        path: '/a',
        component: 'layout.base$view.a',
        meta: { title: 'A', order: 1 },
        children: [
          {
            name: 'child-b',
            path: '/child-b',
            component: 'layout.base$view.child-b',
            meta: { title: 'B', order: 2 }
          },
          {
            name: 'child-a',
            path: '/child-a',
            component: 'layout.base$view.child-a',
            meta: { title: 'Child A', order: 1 }
          }
        ]
      }
    ];

    const snapshot = structuredClone(routes);
    const sorted = sortRoutesByOrder(routes);

    expect(routes).toEqual(snapshot);
    expect(sorted.map(route => route.name)).toEqual(['a', 'b']);
    expect(sorted[0].children?.map(route => route.name)).toEqual(['child-a', 'child-b']);
  });
});
