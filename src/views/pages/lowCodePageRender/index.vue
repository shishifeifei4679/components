<template>
  <div>
    <component
      v-loading="loading"
      :is="modelName"
      :key="$route.fullPath"
      :configInfo="configInfo"
      :pageModelObj="pageModelObj"
      :params="params"
      class="page-render"
      v-bind="$attrs"
    ></component>
  </div>
</template>

<script>
import { getDict } from '@/api/common';
import { getConfigInfo, getListPageModel, getFunctionId } from '../../../api/lowCode/pageRender';
import SingleModel from './components/SingleModel';
import TreeModel from './components/TreeModel';
import AssociationModel from './components/AssociationModel';

// pageModelType:页面模型类型
// single:单模型，report:报表模型，tree:树模型，associationMaster:关联模型
const PAGE_TYPE_OBJ = {
  'single': SingleModel,
  'report': SingleModel,
  'tree': TreeModel,
  'associationMaster': AssociationModel,
}

export default {
  name: "pageRender",
  props: {
    modelParams: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      modelName: SingleModel,
      functionType: {},  // 模型类型数据字典
      configInfo: {},  // 页面配置信息
      pageModelObj: {},  // 页面模型对象，用于获取新增、修改、详情的配置信息
      loading: true,
      sysCode: '',  // 组件编码，platform/mes/wms等
    }
  },
  computed: {
    // 获取路径参数，在设计界面，这个参数取自props，而在预览界面，这个参数取自$route.params
    params() {
      return Object.keys(this.modelParams || {}).length ? this.modelParams : { ...this.$route.params, sysCode: this.sysCode };
    }
  },
  watch: {
    '$route' () {
      this.clearData();
      this.fetchData();
    }
  },
  async created() {
    await this.fetchData();
  },
  methods: {
    // 获取配置信息
    async fetchData() {
      // 获取模型类型数据字典
      // 0:单模型，1:报表模型，2:树模型，3:关联模型
      const functionTypeRes = await getDict('function_type');
      functionTypeRes.data.result.forEach(item => this.functionType[item.value] = item.description);
      const params = this.params;
      // 获取页面配置信息
      const configInfoRes = await getConfigInfo(params);
      const { pageBasicConfig, rowOperateConfig, topOperateConfig } = configInfoRes.data.result;
      PAGE_TYPE_OBJ[pageBasicConfig['pageModelType']] && (this.loading = false);
      // 关联模型需要特殊处理，需要根据主模型返回的信息，作为参数查询子模型配置信息
      let subConfigInfoRes;
      if (pageBasicConfig['pageModelType'] === 'associationMaster') {
        // 子模型的数据模型ID和页面模型ID
        const { associationDataModelId: dataModelId, associationPageModelId: pageModelId } = pageBasicConfig;
        // 获取子模型的配置信息
        subConfigInfoRes = await getConfigInfo({ functionCode: this.params.functionCode, dataModelId, pageModelId });
      }
      // 使用code换取functionId，并且取出组件编码sysCode，platform/mes/wms等
      const functionIdRes = await getFunctionId({ functionCode: this.params.functionCode });
      const { sysCode, id: functionId } = functionIdRes.data.result || {};
      this.sysCode = sysCode;
      // 获取页面模型列表
      // 关联模型需要传递pageModelFlag参数，主模型为master，子模型为sub
      const getPageModel = async (flag) => {
        const res = await getListPageModel({ functionId, pageModelFlag: flag });
        let modelObj = {};
        if (res.data.result?.length) {
          // pageType:页面模型类型，0:列表，1:新增，2:编辑，3:详情
          res.data.result.forEach(item => modelObj[item.pageType] = item['id']);
          flag ? this.pageModelObj[flag] = modelObj : this.pageModelObj = modelObj;
        }
      }
      if (pageBasicConfig['pageModelType'] === 'associationMaster') {
        // 主模型页面模型列表
        await getPageModel('main');
        // 子模型页面模型列表
        await getPageModel('sub');
        const subConfigInfo = subConfigInfoRes.data.result;
        // 将关联模型的外键信息传递给子模型
        subConfigInfo['pageBasicConfig']['associationModelPropConfig'] = configInfoRes.data.result['pageBasicConfig']['associationModelPropConfig'];
        subConfigInfo['pageBasicConfig']['associationDataModelId'] = configInfoRes.data.result['pageBasicConfig']['associationDataModelId'];
        this.configInfo = {
          'main': configInfoRes.data.result,
          'sub': subConfigInfoRes.data.result
        }
      } else {
        await getPageModel();
        this.configInfo = configInfoRes.data.result;
      }
      // 根据模型类型渲染不同的组件
      this.modelName = PAGE_TYPE_OBJ[pageBasicConfig['pageModelType']] || SingleModel;
    },
    clearData() {
      this.configInfo = {};
      this.pageModelObj = {};
    }
  }
}
</script>

<style lang="scss" scoped>
.page-render {
  height: calc(100vh - 126px);
}
</style>
