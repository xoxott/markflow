import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import { NDataTable, NEmpty, NTag, NText } from 'naive-ui';
import { formatApiDateTime } from '@/utils/datetime';
import { $t } from '@/locales';
import BaseDialog from '@/components/base-dialog';
import type { OnlineUsersDialogConfig } from './dialog';

export default defineComponent({
  name: 'OnlineUsersDialog',
  props: {
    show: { type: Boolean, required: true },
    config: {
      type: Object as PropType<OnlineUsersDialogConfig>,
      required: true
    }
  },
  emits: ['update:show'],
  setup(props, { emit }) {
    const handleClose = () => {
      props.config.onClose?.();
      emit('update:show', false);
    };

    const dialogConfig = computed(() => ({
      ...props.config,
      onClose: handleClose,
      title: props.config.title ?? $t('page.userManagement.onlineUsersTitle'),
      width: props.config.width ?? 720,
      height: props.config.height ?? 'auto',
      draggable: props.config.draggable ?? true,
      resizable: props.config.resizable ?? false
    }));

    const columns = [
      {
        title: $t('page.userManagement.username'),
        key: 'username',
        width: 140
      },
      {
        title: $t('page.userManagement.email'),
        key: 'email',
        ellipsis: { tooltip: true }
      },
      {
        title: $t('page.userManagement.role'),
        key: 'roles',
        width: 180,
        render: (row: Api.UserManagement.User) => {
          if (!row.roles?.length) return '-';
          return row.roles.map(role => (
            <NTag key={role.id} type="info" size="small" round class="mr-4px">
              {role.name}
            </NTag>
          ));
        }
      },
      {
        title: $t('page.userManagement.lastActivityAt'),
        key: 'lastActivityAt',
        width: 160,
        render: (row: Api.UserManagement.User) => (
          <NText depth={row.lastActivityAt ? 1 : 3}>
            {row.lastActivityAt
              ? formatApiDateTime(row.lastActivityAt)
              : $t('page.userManagement.neverActive')}
          </NText>
        )
      }
    ];

    return () => (
      <BaseDialog show={props.show} config={dialogConfig.value}>
        {{
          default: () =>
            props.config.users.length > 0 ? (
              <NDataTable
                columns={columns}
                data={props.config.users}
                rowKey={(row: Api.UserManagement.User) => row.id}
                size="small"
                maxHeight={400}
              />
            ) : (
              <NEmpty description={$t('page.userManagement.noOnlineUsers')} />
            )
        }}
      </BaseDialog>
    );
  }
});
