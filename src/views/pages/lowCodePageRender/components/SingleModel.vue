<template>
  <!-- 单模型 -->
  <div class="single-model">
    <ele-page
      v-if="column.length"
      v-loading="loading"
      :formConfig="searchConfig"
      ref="eleTable"
      :operateList="operateList"
      @handleOperateEvent="handleOperateEvent"
      :column="column"
      :getList="getList"
      :otherParams="params"
      uniqueId="singleModel"
      :searchShow="false"
      :beforeAjax="beforeAjax"
    >
    </ele-page>
    <!-- 新增、修改、详情侧抽 -->
    <ele-form-drawer
      class="dialog-pack"
      :isLoading="isLoading"
      v-model="formDataDialog"
      v-bind="formDescDialog"
      :request-fn="handleSubmit"
      :visible.sync="visible"
      :drawerAttrs="{
        'destroy-on-close': true,
      }"
      :title="title">
    </ele-form-drawer>
    <!-- 字段选择窗口弹窗 -->
    <ele-dialog-table
      :title="$i18n.t('common.select')"
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
import {
  getList,
  deleteData,
  exportData,
  apiInvoker,
  downloadTemplate,
  importUrl,
} from '../../../../api/lowCode/pageRender';
import { parseForm } from '../utils/parseForm';
import { exportExcel } from '@/utils/judge';
import tableMixin from '../mixins/tableMixin';
import watchMixin from '../mixins/watchMixin';
import dialogMixin from '../mixins/dialogMixin';

export default {
  name: "SingleModel",
  mixins: [ tableMixin, watchMixin, dialogMixin ],
  props: {
    // 配置信息
    configInfo: {
      type: Object,
      default: () => {}
    },
    // 页面模型列表
    pageModelObj: {
      type: Object,
      default: () => {}
    },
    // 路径参数，在设计页面也使用了该组件，所以使用props传入，而不是$route.params
    params: {
      type: Object,
      default: () => {}
    },
    // 当前是否处于设计模式
    isDesign: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      num: 1,
      title: null,
      visible: false,  // 表单弹窗
      importVisible: false,  // 导入弹窗
      isLoading: false,
      loading: false,
      primaryKey: 'id',  // 表格数据主键，用于删除、详情等
      searchConfig: {  // 查询配置
        inline: true,
        formDesc: {}
      },
      column: [],
      operateList: [],
      formDataDialog: {},
      formDescDialog: {formDesc: {}},
      getList,
      customEvent: {  // 按钮的自定义事件
        top: {},  // 表格上方按钮
        row: {},  // 表格行内按钮
      },
      importConfig: {},  // 导入配置，多处使用
    }
  },
  computed: {
    importUrl() {
      const { importType, btnActionTarget } = this.importConfig;
      return importUrl({
        ...this.params,
        pageModelId: this.pageModelObj['1'],
        importType,
        btnActionTarget
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
          const { topOperateConfig } = this.configInfo;
          const { exportType = '', btnActionTarget = '' } = topOperateConfig.find(item => item.btnType === '6');
          exportExcel(exportData({ ...this.params, exportType, btnActionTarget }));
        },
        // 新增
        add: async () => {
          await this.getFormConfig('1');
          this.formDescDialog.disabled = false;
          this.formDescDialog.isShowSubmitBtn = true;
          this.formDataDialog = {};
          this.visible = true;
        },
        // 批量删除
        batchDelete: () => {
          this.$confirm($i18n.t('common.deleteBatch', {name: $i18n.t('dev.function.pagemodel.data')}), $i18n.t('common.tip'), {
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
          this.getDetail({...this.params, pageModelId: this.pageModelObj['2'], id: row[this.primaryKey]})
          this.visible = true;
        },
        // 详情
        detail: async () => {
          // 调接口获取详情模型id
          await this.getFormConfig('3');
          this.formDescDialog.disabled = true;
          this.formDescDialog.isShowSubmitBtn = false;
          this.formDescDialog.isShowCancelBtn = true;
          console.log(this.params, 'this.params')
          this.getDetail({...this.params, pageModelId: this.pageModelObj['3'], id: row[this.primaryKey]})
        },
        // 单条删除
        delete: () => {
          this.$confirm($i18n.t("common.deleteSingle", {name: $i18n.t('dev.function.pagemodel.data')}), $i18n.t("common.tip"), {
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
    // 删除
    rowDel(ids) {
      this.loading = true;
      deleteData({...this.params, ids})
        .then(res => {
          const message = res.data.message;
          this.$message.success(message || $i18n.t('common.deleteSuccess'));
          this.refresh();
        })
        .finally(_ => this.loading = false);
    },
    // 提交表单 handleSubmit mixin引入
    // 刷新表格数据
    refresh(isReset = true) {
      this.$refs.eleTable.refresh(isReset);
    },
    // 下载导入模板
    downloadTemplate() {
      const { importType, importTemplateUrl } = this.importConfig;
      exportExcel(downloadTemplate({ importType, importTemplateUrl, ...this.params }));
    },
    // 字段选择数据回调 setSelectData mixin引入
    // 显示字段选择数据弹窗 showListDialog mixin引入
    // 清除弹窗字段的值 clearDialogField mixin引入
    // 获取新增、编辑、详情配置信息
    async getFormConfig(btnType) {
      this.formDescDialog = await parseForm(
        {...this.params, pageModelId: this.pageModelObj[btnType]},
        btnType,
        { data: this }
      );
    },
    // 选择数据弹窗数据返回的是不分页数据时，需要转换 transformData mixin引入
    // 临时处理一下
    beforeAjax(data) {
      let params = {}
      Object.keys(data).forEach(item => data[item] && (params[item] = data[item]));
      return params;
    }
  }
}
</script>

<style lang="scss" scoped>
.single-model {
  /deep/ .el-input__suffix {
    display: flex;
    align-items: center;
  }
}
</style>
