import type { PropType } from 'vue';
import { computed, defineComponent, watch } from 'vue';
import {
  type FormRules,
  NButton,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch
} from 'naive-ui';
import { useNaiveForm, useSyncedFormModel } from '@/hooks/common/form';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import { getMenuTypeOptions } from '../constants';
import {
  menuTypeRequiresPermissionCodes,
  menuTypeRequiresRouteRegistry,
  menuTypeShowsRouteFields,
  menuTypeUsesExternalUrl
} from '../utils/menu-type';
import { collectMenuIcons, findMenuNode } from '../utils/menu-tree';
import type { MenuFormDialogConfig } from './dialog';
import RouteKeySelect from './RouteKeySelect';
import ActiveMenuTreeSelect from './ActiveMenuTreeSelect';
import PermissionCodeSelect from './PermissionCodeSelect';
import IconSelect from './IconSelect';

export default defineComponent({
  name: 'MenuFormDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<MenuFormDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const { formRef, validate } = useNaiveForm();
    const formModel = useSyncedFormModel(() => props.config.formData);

    watch(
      () => formModel.type,
      type => {
        if (type === 'group') {
          formModel.routeKey = '';
          formModel.hideInMenu = false;
          formModel.activeMenu = '';
          formModel.permissionCodes = [];
        }
        if (type === 'external') {
          formModel.hideInMenu = false;
          formModel.activeMenu = '';
        }
      }
    );

    watch(
      () => formModel.hideInMenu,
      hideInMenu => {
        if (!hideInMenu) {
          formModel.activeMenu = '';
          return;
        }
        if (formModel.activeMenu.trim()) return;
        const parent = formModel.parentId
          ? findMenuNode(props.config.menuTreeData, formModel.parentId)
          : null;
        if (parent) {
          formModel.activeMenu = parent.sidebarKey;
        }
      }
    );

    const showActiveMenuField = computed(
      () =>
        menuTypeShowsRouteFields(formModel.type) &&
        (formModel.hideInMenu || Boolean(formModel.activeMenu))
    );

    const formRules = computed((): FormRules => {
      const rules: FormRules = {
        name: [
          { required: true, message: $t('page.menuManagement.nameRequired'), trigger: 'blur' }
        ],
        type: [
          { required: true, message: $t('page.menuManagement.typeRequired'), trigger: 'change' }
        ]
      };

      if (menuTypeRequiresRouteRegistry(formModel.type)) {
        rules.routeKey = [
          {
            required: true,
            message: $t('page.menuManagement.routeKeyRequired'),
            trigger: 'change'
          }
        ];
      }

      if (menuTypeRequiresPermissionCodes(formModel.type)) {
        rules.permissionCodes = [
          {
            type: 'array' as const,
            required: true,
            min: 1,
            message: $t('page.menuManagement.permissionCodesRequired'),
            trigger: 'change'
          }
        ];
      }

      return rules;
    });

    const typeOptions = computed(() => getMenuTypeOptions());

    const handleClose = () => {
      props.config.onClose?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title: props.config.title ?? (props.config.isEdit ? $t('common.edit') : $t('common.add')),
      width: props.config.width ?? 720,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const handleConfirm = async () => {
      const isValid = await validate();
      if (!isValid) return;
      await props.config.onConfirm({ ...formModel });
      handleClose();
    };

    const renderSectionTitle = (title: string) => (
      <div class="menu-management__form-section">{title}</div>
    );

    const menuUsedIcons = computed(() => collectMenuIcons(props.config.menuTreeData));

    return () => (
      <BaseDialog show={props.show} config={dialogConfig.value}>
        {{
          default: () => (
            <NForm
              ref={formRef}
              model={formModel}
              rules={formRules.value}
              labelPlacement="left"
              labelWidth={108}
            >
              {renderSectionTitle($t('page.menuManagement.sectionBasic'))}
              <NGrid cols={2} xGap={16}>
                <NGi>
                  <NFormItem label={$t('page.menuManagement.type')} path="type">
                    <NSelect v-model:value={formModel.type} options={typeOptions.value} />
                  </NFormItem>
                </NGi>
                <NGi>
                  <NFormItem label={$t('page.menuManagement.order')} path="order">
                    <NInputNumber v-model:value={formModel.order} min={0} class="w-full" />
                  </NFormItem>
                </NGi>
                <NGi span={2}>
                  <NFormItem label={$t('page.menuManagement.name')} path="name">
                    <NInput
                      v-model:value={formModel.name}
                      placeholder={$t('page.menuManagement.namePlaceholder')}
                    />
                  </NFormItem>
                </NGi>
                <NGi span={2}>
                  <NFormItem label={$t('page.menuManagement.parent')} path="parentId">
                    <NSelect
                      v-model:value={formModel.parentId}
                      options={props.config.parentOptions}
                      clearable
                      placeholder={$t('page.menuManagement.parentTopLevel')}
                    />
                  </NFormItem>
                </NGi>
              </NGrid>

              {renderSectionTitle($t('page.menuManagement.sectionDisplay'))}
              <NGrid cols={2} xGap={16}>
                <NGi span={2}>
                  <NFormItem label={$t('page.menuManagement.i18nKey')} path="i18nKey">
                    <NInput
                      v-model:value={formModel.i18nKey}
                      placeholder={$t('page.menuManagement.i18nKeyPlaceholder')}
                    />
                  </NFormItem>
                </NGi>
                {menuTypeRequiresRouteRegistry(formModel.type) ? (
                  <NGi span={2}>
                    <NFormItem label={$t('page.menuManagement.routeKey')} path="routeKey">
                      <RouteKeySelect
                        v-model:value={formModel.routeKey}
                        options={props.config.routeKeyOptions}
                      />
                    </NFormItem>
                  </NGi>
                ) : null}
                {menuTypeUsesExternalUrl(formModel.type) ? (
                  <NGi span={2}>
                    <NFormItem label={$t('page.menuManagement.externalUrl')} path="routeKey">
                      <NInput
                        v-model:value={formModel.routeKey}
                        placeholder={$t('page.menuManagement.externalUrlPlaceholder')}
                      />
                    </NFormItem>
                  </NGi>
                ) : null}
                <NGi span={2}>
                  <NFormItem label={$t('page.menuManagement.icon')} path="icon">
                    <IconSelect v-model:value={formModel.icon} usedIcons={menuUsedIcons.value} />
                  </NFormItem>
                </NGi>
                <NGi>
                  <NFormItem label={$t('page.menuManagement.isActive')} path="isActive">
                    <NSwitch v-model:value={formModel.isActive} />
                  </NFormItem>
                </NGi>
                {menuTypeShowsRouteFields(formModel.type) ? (
                  <NGi span={showActiveMenuField.value ? 2 : undefined}>
                    <NFormItem label={$t('page.menuManagement.hideInMenu')} path="hideInMenu">
                      <NSwitch v-model:value={formModel.hideInMenu} />
                    </NFormItem>
                  </NGi>
                ) : null}
                {showActiveMenuField.value ? (
                  <NGi span={2}>
                    <NFormItem
                      label={$t('page.menuManagement.activeMenu')}
                      path="activeMenu"
                      feedback={$t('page.menuManagement.activeMenuHint')}
                    >
                      <ActiveMenuTreeSelect
                        v-model:value={formModel.activeMenu}
                        treeData={props.config.menuTreeData}
                        excludeSidebarKey={props.config.excludeSidebarKey}
                        excludeMenuId={props.config.excludeMenuId}
                      />
                    </NFormItem>
                  </NGi>
                ) : null}
              </NGrid>

              {menuTypeRequiresPermissionCodes(formModel.type)
                ? renderSectionTitle($t('page.menuManagement.sectionAuth'))
                : null}
              {menuTypeRequiresPermissionCodes(formModel.type) ? (
                <NFormItem label={$t('page.menuManagement.permissionCodes')} path="permissionCodes">
                  <PermissionCodeSelect v-model:value={formModel.permissionCodes} />
                </NFormItem>
              ) : null}
            </NForm>
          ),
          footer: () => (
            <NSpace justify="end">
              <NButton onClick={handleClose}>{$t('common.cancel')}</NButton>
              <NButton type="primary" onClick={handleConfirm}>
                {$t('common.confirm')}
              </NButton>
            </NSpace>
          )
        }}
      </BaseDialog>
    );
  }
});
