import { defineComponent, ref } from 'vue';
import { NCollapse, NCollapseItem, NEmpty, NIcon, NScrollbar } from 'naive-ui';
import { Icon } from '@iconify/vue';
import { WORKFLOW_DRAG_MIME } from '../constants/workflow-layout';
import { getNodeTypeConfig, getNodesByCategory } from '../registry/node-registry';
import { setWorkflowDragImage } from '../shared/createWorkflowDragImage';
import WorkflowNodeCard from '../shared/WorkflowNodeCard';

export default defineComponent({
  name: 'NodeLibraryPanel',
  setup() {
    const categories = getNodesByCategory();
    const expandedKeys = ref(['control', 'ai', 'data', 'integration']);

    const categoryLabels = {
      control: '控制流',
      ai: 'AI',
      data: '数据处理',
      integration: '集成'
    };

    const handleDragStart = (type: Api.Workflow.NodeType, e: DragEvent) => {
      if (!e.dataTransfer) return;

      const config = getNodeTypeConfig(type);
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData(WORKFLOW_DRAG_MIME, type);
      setWorkflowDragImage(e, config);
    };

    return () => (
      <div class="node-library-panel h-full w-64 flex flex-col">
        <div class="node-library-panel__header border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <h3 class="flex items-center gap-1.5 text-xs text-gray-800 font-semibold dark:text-gray-100">
            <NIcon size={16}>
              <Icon icon="mdi:view-grid-plus-outline" />
            </NIcon>
            节点库
          </h3>
        </div>

        <NScrollbar class="flex-1">
          <div class="p-3">
            <NCollapse v-model:expanded-names={expandedKeys.value} accordion={false}>
              {Object.entries(categories).map(([category, nodes]) => (
                <NCollapseItem
                  key={category}
                  name={category}
                  title={categoryLabels[category as keyof typeof categoryLabels]}
                >
                  {nodes.length > 0 ? (
                    <div class="node-library-panel__list">
                      {nodes.map(({ type, config }) => (
                        <div
                          key={type}
                          class="node-library-item"
                          draggable
                          onDragstart={(e: DragEvent) => handleDragStart(type, e)}
                        >
                          <WorkflowNodeCard
                            label={config.label}
                            description={config.description}
                            icon={config.icon}
                            color={config.color}
                            variant="library"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <NEmpty description="暂无节点" size="small" />
                  )}
                </NCollapseItem>
              ))}
            </NCollapse>
          </div>
        </NScrollbar>
      </div>
    );
  }
});
