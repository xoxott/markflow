/** Naive UI 抽屉/弹窗默认约 2000；抽屉上叠弹窗时使用更高层级。 长期应收敛到 createDialogInstance / useDrawer 统一抬升，而非各页面散落常量。 */
export const DIALOG_OVER_DRAWER_Z_INDEX = 3000;

/** 弹窗内 Select 下拉菜单需高于弹窗遮罩（与 DIALOG_OVER_DRAWER_Z_INDEX 成对使用） */
export const SELECT_MENU_OVER_DIALOG_Z_INDEX = 3500;
