// 对字段配置进行解析
export default function (treeConfig) {
  let config = {
    primaryKey: null
  };
  let { pageBasicConfig, fieldListConfig, rowOperateConfig } = treeConfig;

  fieldListConfig && fieldListConfig.forEach(item => {
    const { pageInfo, propBasicInfo, propPageInfo, propExtendInfo } = item;
    const { showCode, isPrimary } = propBasicInfo;
    // column中不展示主键，比如id，主键用于删除、详情等操作
    if (isPrimary === '1') {
      config.primaryKey = showCode;  // 设置主键，用于删除、详情等
    }
  })
  return config;
}
