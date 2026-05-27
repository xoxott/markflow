import { defineComponent } from 'vue';
import { describe, expect, it } from 'vitest';
import { DEFAULT_FLOW_CONFIG } from '../config/default-config';
import { cloneConfig } from '../utils/config-utils';

const PillNode = defineComponent({
  name: 'TestPillNode',
  setup: () => () => null
});

describe('cloneConfig', () => {
  it('preserves nodeTypes.component references after clone', () => {
    const source = {
      ...DEFAULT_FLOW_CONFIG,
      nodes: {
        ...DEFAULT_FLOW_CONFIG.nodes,
        nodeTypes: {
          pill: {
            name: 'Pill',
            component: PillNode,
            defaultConfig: { size: { width: 200, height: 48 } }
          }
        }
      }
    };

    const cloned = cloneConfig(source);

    expect(cloned.nodes?.nodeTypes?.pill).toBeDefined();
    expect((cloned.nodes?.nodeTypes?.pill as { component?: unknown }).component).toBe(PillNode);
  });
});
