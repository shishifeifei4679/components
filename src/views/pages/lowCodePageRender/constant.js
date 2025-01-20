// 所有按钮列表
// btnType 0:新增，1:修改，2:详情，3:删除，4:批量删除，5:导入，6:导出，7:自定义(顶部)，8:自定义(行内)
// sort 排序，页面上按钮显示顺序，1-5是表格上方按钮排序，6-9是表格行内按钮排序
export const ALL_BUTTONS = [
  {
    btnType: '0',
    label: $i18n.t('common.add'),  // 新增
    text: '新增',
    textEn: 'Add',
    icon: "el-icon-circle-plus-outline",
    btnStyle: '1',
    handleName: "add",
    position: 'top',  // 按钮的位置，top:表格上方的按钮，row:表格行内的按钮
    sort: 0,
  },
  {
    btnType: '1',
    prop: "edit",
    label: $i18n.t('common.edit'),  // 修改
    text: '修改',
    textEn: 'Edit',
    btnStyle: '1',
    handleName: "edit",
    position: 'row',
    sort: 6,
  },
  {
    btnType: '2',
    prop: "detail",
    label: $i18n.t('common.details'),  // 详情
    text: '详情',
    textEn: 'Details',
    btnStyle: '5',
    handleName: "detail",
    position: 'row',
    sort: 7,
  },
  {
    btnType: '3',
    prop: "delete",
    label: $i18n.t('common.delete'),  // 删除
    text: '删除',
    textEn: 'Delete',
    btnStyle: '4',
    handleName: "delete",
    position: 'row',
    sort: 8,
  },
  {
    btnType: '4',
    label: $i18n.t('dev.function.pagemodel.batchDelete'),  // 批量删除
    text: '批量删除',
    textEn: 'Batch Delete',
    icon: "el-icon-delete",
    btnStyle: '4',
    handleName: "batchDelete",
    position: 'top',
    sort: 2,
  },
  {
    btnType: '5',
    label: $i18n.t('common.import'),  // 导入
    text: '导入',
    textEn: 'Import',
    icon: "el-icon-upload2",
    btnStyle: '1',
    handleName: "import",
    position: 'top',
    sort: 4,
  },
  {
    btnType: '6',
    label: $i18n.t('common.export'),  // 导出
    text: '导出',
    textEn: 'Export',
    icon: "el-icon-download",
    btnStyle: '1',
    handleName: "export",
    position: 'top',
    sort: 3,
  },
  {
    btnType: '7',
    label: $i18n.t('dev.function.pagemodel.customTop'),  // 自定义(顶部)
    class: "row-btn-primary",
    handleName: "customTop",
    position: 'top',
    sort: 5,
  },
  {
    btnType: '8',
    label: $i18n.t('dev.function.pagemodel.customInline'),  // 自定义(行内)
    class: "row-btn-primary",
    handleName: "customRow",
    position: 'row',
    sort: 9,
  },
];

export const BUTTON_STYLE = [
  {
    value: '0',
    text: 'default'
  },
  {
    value: '1',
    text: 'primary'
  },
  {
    value: '2',
    text: 'success'
  },
  {
    value: '3',
    text: 'warning'
  },
  {
    value: '4',
    text: 'danger'
  },
  {
    value: '5',
    text: 'info'
  }
];

// 表单字段显示类型对应关系
export const FORM_DESC_FIELD_TYPE = {
  '10': 'input',
  '11': 'textarea',
  '12': 'wang-editor',
  '13': 'password',
  '20': 'number',
  '30': 'datetime',
  '40': 'dialog',
  '50': 'select',
  '51': 'tree-select',
  '60': 'upload-file',
}

// 正则表达式
export const REG_EXP = {
  // 数字
  '1': /^\d*$/,
  // 密码
  '10': /^[a-zA-Z]\w{5,17}$/,
  // 日期
  '6': /^\d{4}-\d{2}-\d{2}$/,
  // URL
  '7': /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
  // 邮件
  '8': /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // 手机号
  '9': /^1[3-9]\d{9}$/,
  // 数字+字母
  '13': /^[A-Z0-9]+$/
}

// 页面模型新增时，页面类型
export const PAGE_TYPE = [
  {
    value: "0",
    text: $i18n.t('dev.function.pagemodel.list'),  // 列表
    label: $i18n.t('dev.function.pagemodel.list'),
  },
  {
    value: "1",
    text: $i18n.t('common.add'),  // 新增
    label: $i18n.t('common.add'),
  },
  {
    value: "2",
    text: $i18n.t('dev.function.pagemodel.edit'),  // 编辑
    label: $i18n.t('dev.function.pagemodel.edit'),
  },
  {
    value: "3",
    text: $i18n.t('common.details'),  // 详情
    label: $i18n.t('common.details'),
  },
];
