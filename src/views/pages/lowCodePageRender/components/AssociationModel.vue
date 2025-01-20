<template>
  <div class="associative-model">
    <div class="main">
      <!-- 主模型 -->
      <div :style="{ 'width': mainWidth }">
        <EleTableItem
          v-if="Object.keys(configInfo).length"
          v-bind="$attrs"
          :configInfo="configInfo['main']"
          :pageModelObj="pageModelObj['main']"
          ref="mainTable"
          pageModelFlag="MAIN"
          :beforeRequest="beforeRequest"
          :isDesign="isDesign"
          :params="params"
          @rowClick="handleClick"
        ></EleTableItem>
      </div>
      <!-- 分割线 -->
      <div class="divider"></div>
      <!-- 子模型 -->
      <div :style="{ 'width': subWidth }">
        <EleTableItem
          v-if="Object.keys(configInfo).length"
          v-bind="$attrs"
          :configInfo="configInfo['sub']"
          :pageModelObj="pageModelObj['sub']"
          ref="subTable"
          pageModelFlag="SUB"
          :beforeRequest="subBeforeRequest"
          :apiImmediate="false"
          :isDesign="isDesign"
          :params="params"
        ></EleTableItem>
      </div>
    </div>
  </div>
</template>

<script>
import EleTableItem from './EleTableItem';
import { parseField } from '../utils/parseForm'

export default {
  name: "AssociationModel",
  components: {
    EleTableItem
  },
  props: {
    configInfo: {
      type: Object,
      default: () => {
      }
    },
    pageModelObj: {
      type: Object,
      default: () => {}
    },
    isDesign: {
      type: Boolean,
      default: false
    },
    params: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      title: null,
      searchConfig: {},
      currentItem: null,  // 当前选中的主表数据，不一定是id标识
    }
  },
  computed: {
    mainWidth() {
      return this.isDesign ? (this.$route.query['pageModelFlag'] === 'MAIN' ? 'calc(60% - 13px)' : 'calc(40% - 13px)') : 'calc(50% - 13px)';
    },
    subWidth() {
      return this.isDesign ? (this.$route.query['pageModelFlag'] === 'SUB' ? 'calc(60% - 13px)' : 'calc(40% - 13px)') : 'calc(50% - 13px)';
    }
  },
  watch: {
    'configInfo.main': {
      handler(val) {
        if (val) {
          let { pageBasicConfig, searchConfig, fieldListConfig, topOperateConfig, rowOperateConfig } = val;
          // 查询配置
          if (searchConfig) {
            this.searchConfig = {
              inline: true,
              formDesc: {}
            }
            searchConfig.forEach(item => {
              const { showCode, showName } = item['propBasicInfo'];
              const { searchGridCount } = item['propPageInfo'];
              const res = parseField(item);
              this.searchConfig.formDesc[showCode] = {
                type: 'input',
                label: showName,
                ...res,
                layout: searchGridCount,
              };

            })
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    // 解析配置
    parseConfig(val, searchConfig, column) {

    },
    handleOperateEvent() {
      console.log(2)
    },
    // 主表行操作事件
    masterRowOperate({ handleName, row }) {
      const fun = {
        edit: () => {},
        config: () => {},
        delete: () => {}
      }
      fun[handleName] && fun[handleName]()
    },
    handleSubOperateEvent() {
      console.log(1)
    },
    // 子表行操作事件
    subRowOperate({ handleName, row }) {
      const fun = {
        edit: () => {},
        config: () => {},
        delete: () => {}
      }
      fun[handleName] && fun[handleName]()
    },
    handleClick(data) {
      // 主键
      const key = this.configInfo['main']['pageBasicConfig']['associationModelPropConfig']['mainPropInfo']['propShowCode'];
      // 当前选中行的主键的值
      this.currentItem = data[key];
      this.refresh('subTable');
    },
    // 提交表单
    handleSubmit() {

    },
    // 查询
    handleSearch() {
      this.refresh('mainTable');
      this.currentItem = null;
      this.refresh('subTable');
    },
    // 刷新表
    refresh(table, isReset = true) {
      this.$nextTick(() => {
        this.$refs[table].$refs.eleTable.getTableData(isReset);
      });
    },
    beforeRequest(data) {
      return { ...data, ...this.params };
    },
    // 子表查询参数
    subBeforeRequest(data) {
      const { associationModelPropConfig } = this.configInfo['main']['pageBasicConfig'];
      const { mainPropInfo, subPropInfo } = associationModelPropConfig;
      const { functionCode, sysCode } = this.params;
      return {
        ...data,
        sysCode,
        functionCode,
        dataModelId: this.configInfo['main']['pageBasicConfig']['associationDataModelId'],
        pageModelId: this.pageModelObj['sub']['0'],
        [subPropInfo['propShowCode']]: this.currentItem || '',
      }
    },
    // 重置
    handleReset() {
      this.refresh('mainTable');
    }
  }
}
</script>

<style lang="scss" scoped>
.associative-model {
  .main {
    display: flex;
    justify-content: space-between;
    > div:first-child, div:last-child {
      //flex-shrink: 1;
    }
    // 分割线
    .divider {
      background-color: #eff2fb;
      margin: 0 8px;
      box-sizing: border-box;
      flex: 0 0 10px;
    }
  }
}
</style>
