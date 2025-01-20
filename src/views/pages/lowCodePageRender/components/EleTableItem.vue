<template>
  <div class="ele-table-item">
    <!-- 设计页面，编辑主模型时，子模型部分加遮罩，反之亦然 -->
    <div v-if="isDesign && pageModelFlag !== $route.query['pageModelFlag']" class="overlay"></div>
    <ele-table
      v-bind="$attrs"
      v-on="$listeners"
      ref="eleTable"
      :column="column"
      :getList="getList"
      :operateList="operateList"
      :pagination="true"
      @row-click="rowClick"
      @handleOperateEvent="handleOperateEvent"
    >
    </ele-table>
    <ele-form-drawer
      :isLoading="isLoading"
      v-model="formDataDialog"
      v-bind="formDescDialog"
      :request-fn="handleSubmit"
      :visible.sync="visible"
      :title="title"
    >
    </ele-form-drawer>
    <!-- 字段选择窗口弹窗 -->
    <ele-dialog-table
      title="选择"
      width="800px"
      ref="listDialog"
      :visible.sync="listDialogVisible"
      :formConfig="listSearchConfig"
      :column="listColumn"
      @getSelectData="setSelectData"
      :getList="getDialogList"
      :pagination="pagination"
      :transFormdata="transformData"
    >
    </ele-dialog-table>
  </div>
</template>

<script>
import { apiInvoker, exportData, getDetail, getList, importUrl } from '../../../../api/lowCode/pageRender';
import { exportExcel } from '@/utils/judge'
import { parseForm } from '../utils/parseForm'
import tableMixin from '../mixins/tableMixin';
import watchMixin from '../mixins/watchMixin';
import dialogMixin from '../mixins/dialogMixin';

export default {
  name: "EleTableItem",
  mixins: [tableMixin, watchMixin, dialogMixin],
  props: {
    // 配置信息
    configInfo: {
      type: Object,
      default: () => {
      }
    },
    // 页面模型列表
    pageModelObj: {
      type: Object,
      default: () => {
      }
    },
    // 主子模型标识
    pageModelFlag: {
      type: String,
      default: 'MAIN'
    },
    // 当前是否处于设计模式
    isDesign: {
      type: Boolean,
      default: false
    },
    // 请求参数，此处的params都是主模型的数据
    params: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      isLoading: false,
      visible: false,
      formDataDialog: {},
      formDescDialog: {formDesc: {}},
      title: null,
      column: [],
      operateList: [],
      getList,
      customEvent: {  // 按钮的自定义事件
        top: {},  // 表格上方按钮
        row: {},  // 表格行内按钮
      },
      mainKey: null,  // 主键
      subKey: null,  // 外键
    }
  },
  created() {
    const {associationModelPropConfig} = this.configInfo['pageBasicConfig'];
    const {mainPropInfo, subPropInfo} = associationModelPropConfig;
    this.mainKey = mainPropInfo['propShowCode'];
    this.subKey = subPropInfo['propShowCode'];
  },
  computed: {
    importUrl() {
      return importUrl({
        ...this.params,
        pageModelId: this.pageModelObj['1']
      })
    }
  },
  methods: {
    // 表格上方按钮事件，新增、批量删除等
    handleOperateEvent({handleName, name, rows}) {
      this.title = name;
      if (this.isDesign) return;  // 设计页面不执行事件
      let fnc = {
        // 导出
        export: () => {
          exportExcel(exportData(this.$route.params));
        },
        // 新增
        add: async () => {
          // 关联模型，如果新增子表数据时，未选择主表行，提示选择主表行
          if (this.pageModelFlag === 'SUB' && !this.$parent.currentItem) {
            return this.$message.error($i18n.t('dev.function.pagemodel.hintMessage1'));  // 请先选择主表数据
          }
          await this.getFormConfig('1');
          this.formDescDialog.disabled = false;
          this.formDescDialog.isShowSubmitBtn = true;
          // 如果是关联模型的子表，需要设置外键的值
          if (this.pageModelFlag === 'SUB') {
            this.formDataDialog = {};
            this.$set(this.formDataDialog, this.subKey, this.$parent.currentItem);
          } else {
            this.formDataDialog = {};
          }
          this.visible = true;
        },
        // 批量删除
        batchDelete: () => {
          this.$confirm($i18n.t('common.deleteBatch', {name: $i18n.t('common.data')}), $i18n.t('common.tip'), {
            confirmButtonText: $i18n.t('common.ok'),
            cancelButtonText: $i18n.t('common.cancel'),
            type: 'warning'
          }).then(_ => this.rowDel(rows.map(val => val[this.primaryKey]).join(',')));
        },
        // 自定义按钮事件
        ...this.customEvent['top']
      };
      fnc[handleName] && fnc[handleName]();
      // operateEventList[data.handleName] && operateEventList[data.handleName](data, this);
    },
    rowClick(data) {
      if (this.pageModelFlag !== 'MAIN') return
      this.$emit('rowClick', data);
    },
    // 表格行按钮事件，修改、查看等
    rowOperate({handleName, name, row}) {
      this.title = name;
      if (this.isDesign) return;  // 设计页面不执行事件
      const fnc = {
        // 修改
        edit: async () => {
          await this.getFormConfig('2');
          this.formDescDialog.disabled = false;
          this.formDescDialog.isShowSubmitBtn = true;
          this.formDescDialog.isShowCancelBtn = true;
          this.formDataDialog = row;
          let params = {...this.params, pageModelId: this.pageModelObj['2'], id: row[this.primaryKey]}
          // 如果是关联模型的子模型，dataModelId为子模型的dataModelId
          if (this.configInfo?.['pageBasicConfig']?.['pageModelType'] === 'associationSub') {
            params['dataModelId'] = this.configInfo['pageBasicConfig']['associationDataModelId']
          }
          this.getDetail(params);
          this.visible = true;
        },
        // 详情
        detail: async () => {
          // 调接口获取详情模型id
          await this.getFormConfig('3');
          this.formDescDialog.disabled = true;
          this.formDescDialog.isShowSubmitBtn = false;
          this.formDescDialog.isShowCancelBtn = true;
          let params = {...this.params, pageModelId: this.pageModelObj['3'], id: row[this.primaryKey]};
          // 如果是关联模型的子模型，dataModelId为子模型的dataModelId
          if (this.configInfo?.['pageBasicConfig']?.['pageModelType'] === 'associationSub') {
            params['dataModelId'] = this.configInfo['pageBasicConfig']['associationDataModelId'];
          }
          this.getDetail(params)
        },
        // 单条删除
        delete: () => {
          this.$confirm($i18n.t("common.deleteSingle", {name: $i18n.t('common.data')}), $i18n.t("common.tip"), {
            confirmButtonText: $i18n.t("common.ok"),
            cancelButtonText: $i18n.t("common.cancel"),
            type: "warning",
          }).then(_ => this.rowDel(row[this.primaryKey]));
        },
        // 自定义按钮事件
        ...this.customEvent['row']
      };
      fnc[handleName] && fnc[handleName]();
    },
    // 获取新增、编辑、详情配置信息
    async getFormConfig(btnType) {
      const _this = this;
      let params = {
        ...this.$route.params,
        pageModelId: this.pageModelObj[btnType]
      };
      // 如果是关联模型的子模型，dataModelId为子模型的dataModelId
      if (this.configInfo?.['pageBasicConfig']?.['pageModelType'] === 'associationSub') {
        params['dataModelId'] = this.configInfo['pageBasicConfig']['associationDataModelId']
      }
      let formDescDialog = await parseForm(params, btnType, {data: this});
      // 对弹窗进行特殊处理
      const {formDesc} = formDescDialog;
      Object.keys(formDesc || {}).forEach(item => {
        if (formDesc[item]['type'] === 'dialog') {
          formDesc[item]['type'] = 'input';
          formDesc[item]['slots'] = {
            append(h) {
              return (
                <i
                  class="el-icon-search"
                  onClick={() => _this.showListDialog(formDesc[item]['propExtendInfo'])}
                  style={{"cursor": "pointer"}}>
                </i>
              )
            },
            suffix(h, data) {
              return (
                _this.formDataDialog[item] ?
                  <i
                    class="el-icon-circle-close"
                    onClick={() => _this.$set(_this.formDataDialog, item, null)}
                    style={{"cursor": "pointer"}}>
                  </i> : null
              )
            }
          };
        }
      })
      this.formDescDialog = formDescDialog;
    },
    // 表单提交，mixin引入
    // handleSubmit() {}
    // 刷新表格数据
    refresh(isReset = true) {
      this.$nextTick(() => {
        this.$refs.eleTable.getTableData(isReset);
      });
    },
    // 处理getList请求参数
    // beforeRequest(data) {
    //   let params = {
    //     ...data,
    //     functionCode: this.$route.query.functionCode,
    //     dataModelId: '1852167089453314049',
    //     pageModelId: this.pageModelObj['0']
    //   }
    //   return params;
    // },
  }
}
</script>

<style lang="scss" scoped>
.ele-table-item {
  width: 100%;
  position: relative;
  overflow: hidden;
  // 遮罩层
  .overlay {
    background-color: rgba(0, 0, 0, 0.2);
    z-index: 100;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
</style>
