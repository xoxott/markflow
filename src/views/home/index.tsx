import { computed, defineComponent } from 'vue';
import { NGi, NGrid, NSpace } from 'naive-ui';
import { useAppStore } from '@/store/modules/app';
import CapabilityCards from './modules/CapabilityCards';
import QuickAccess from './modules/QuickAccess';
import WelcomeBanner from './modules/WelcomeBanner';
import './styles/home.scss';

export default defineComponent({
  name: 'Home',
  setup() {
    const appStore = useAppStore();
    const gap = computed(() => (appStore.isMobile ? 0 : 16));

    return () => (
      <NSpace vertical size={16}>
        <WelcomeBanner />
        <CapabilityCards />
        <NGrid xGap={gap.value} yGap={16} responsive="screen" itemResponsive>
          <NGi span={24}>
            <QuickAccess />
          </NGi>
        </NGrid>
      </NSpace>
    );
  }
});
