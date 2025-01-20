<template>
  <!-- 树模型 -->
  <div class="tree-model" v-loading="loading">
    <!-- 左侧树结构 -->
    <div class="main-left">
      <el-input
        :placeholder="$t('common.filter')"
        v-model="filterText"
        clearable
      ></el-input>
      <el-tree
        v-if="dataSource.length"
        :data="dataSource"
        :props="defaultProps"
        ref="tree"
        accordion
        node-key="id"
        @node-click="nodeClick"
        :filter-node-method="filterNode"
        style="margin-top: 6px;"
      >
        <span class="custom-tree-node" slot-scope="{ node, data }">
          <span>{{ node.label }}</span>
          <span>
            <i class="el-icon-plus" v-if="treeConfig.includes('0')" @click.stop="() => handleForm(data, '1')"></i>
            <i class="el-icon-edit" v-if="treeConfig.includes('1') && data[primaryKey] !== '-1'" @click.stop="() => handleForm(data, '2')"></i>
            <i class="el-icon-delete" v-if="treeConfig.includes('3') && data[primaryKey] !== '-1'" @click.stop="() => handleDelete(data['id'])"></i>
          </span>
        </span>
      </el-tree>
    </div>
    <!-- 右侧表单 -->
    <div class="main-right">
      <ele-form
        v-model="formDataDialog"
        :formDesc="formDesc.formDesc"
        :rules="formDesc.rules"
        :request-fn="handleSubmit"
        handleCancelClick
        ref="form"
        :isLoading="isLoading"
        :key="key"
        :span="22"
        :isShowSubmitBtn="!!formDesc.isShowSubmitBtn"
        :isShowCancelBtn="!!formDesc.isShowCancelBtn"
        :isShowBackBtn="false"
        @cancel="handleCancel"
        :labelWidth="formDesc.labelWidth || '100px'"
      >
      </ele-form>
    </div>
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
  apiInvoker,
  getConfigInfo,
  getTreeList,
  getDetail,
  deleteData,
  addForm,
  updateForm,
} from '../../../../api/lowCode/pageRender';
import { parseForm } from '../utils/parseForm';
import treeConfig from '../utils/parseTree';
import { PAGE_TYPE } from '../constant';
import dialogMixin from '../mixins/dialogMixin';

export default {
  name: "TreeModel",
  mixins: [ dialogMixin ],
  props: {
    configInfo: {
      type: Object,
      default: () => {}
    },
    pageModelObj: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      loading: false,
      isLoading: false,
      functionName: '',  // 根节点名称
      filterText: "",
      dataSource: [],  // 左侧树结构数据源
      defaultProps: {
        children: "children",
        label: "name",
      },
      formDataDialog: {},
      formDesc: {
        isShowSubmitBtn: true,
        isShowBackBtn: true,
        formDesc: {}
      },
      key: new Date().getTime(),
      treeConfig: [],  // 树节点操作按钮配置
      primaryKey: null,  // 主键，用于删除、编辑等操作
      currentId: null,  // 当前操作的节点id
      type: null,  // 当前操作类型，1:新增，2:编辑，3:详情
    }
  },
  watch: {
    configInfo: {
      handler(val) {
        if (Object.keys(val).length === 0) return;
        const { pageBasicConfig, searchConfig, fieldListConfig, topOperateConfig, rowOperateConfig } = val;
        const { functionName } = pageBasicConfig;
        this.functionName = functionName;
        this.treeConfig = [...rowOperateConfig || [], ...topOperateConfig || []].map(item => item.btnType);
        this.primaryKey = treeConfig(val)['primaryKey'];
        this.getTreeList();
        this.getFormConfig('3');
      },
      immediate: true,
      deep: true
    },
    filterText(val) {
      this.$refs.tree.filter(val);
    },
  },
  methods: {
    // 获取树结构数据源
    getTreeList() {
      this.loading = true;
      getTreeList(this.$route.params).then((res) => {
          this.dataSource = [
            {
              [this.primaryKey]: '-1',
              name: this.functionName,
              children: res.data.result,
            },
          ];
          this.$nextTick(() => {
            this.$refs.tree.filter(this.filterText);
          });
        }).finally(_ => this.loading = false);
    },
    // 获取新增、编辑、详情配置信息
    // btnType: 1:新增，2:编辑，3:详情
    async getFormConfig(btnType) {
      const _this = this;
      // 错误提示
      if (!!!this.pageModelObj[btnType]) {
        const pageType = PAGE_TYPE.find(item => item.value === btnType);
        return this.$message.error($i18n.t('dev.function.pagemodel.hintMessage2', { name: pageType.label }));  // 请配置【${pageType.label}】页面模型
      }
      let formDescDialog = await parseForm({
        ...this.$route.params,
        pageModelId: this.pageModelObj[btnType]
      }, btnType, { data: this, functionName: this.functionName  });
      // 对弹窗进行特殊处理
      const { formDesc } = formDescDialog;
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
      });
      // 新增、编辑提交按钮固定
      if (['1', '2'].includes(btnType)) {
        this.$refs.form.$refs.form.resetFields();
        formDescDialog.isShowSubmitBtn = true;
        formDescDialog.isShowCancelBtn = true;
      }
      this.formDesc = formDescDialog;
      this.key = new Date().getTime();
    },
    // 获取节点信息
    async getDetail(id) {
      // this.currentId = id;
      const res = await getDetail({ ...this.$route.params, pageModelId: this.pageModelObj['3'], id });
      this.formDataDialog = res.data.result;
    },
    // 节点点击事件
    async nodeClick(data) {
      if (data[this.primaryKey] !== '-1') {
        await this.handleForm(data, '3');
      }
    },
    // 筛选过滤
    filterNode(value, data) {
      if (!value) return true;
      const label = this.defaultProps ? this.defaultProps.label : "label";
      return data[label].indexOf(value) !== -1;
    },
    // 删除
    handleDelete(id) {
      this.$confirm($i18n.t('common.deleteSingle', { name: $i18n.t('dev.function.pagemodel.name2') }), $i18n.t('common.tip'), {
        confirmButtonText: $i18n.t('common.ok'),
        cancelButtonText: $i18n.t('common.cancel'),
        type: 'warning',
      }).then(() => {
        deleteData({ ...this.$route.params, ids: id }).then(res => {
          this.$message.success(res.data.message || $i18n.t('common.deleteSuccess'));  // 删除成功
          this.getTreeList();
          this.clearData();
        });
      });
    },
    // 表单动作
    async handleForm(data, type) {
      this.type = type;
      await this.getFormConfig(type);
      // 详情和编辑需要请求数据
      if (['2', '3'].includes(type)) {
        this.currentId = data['id'];
        await this.getDetail(data['id']);
      } else if (type === '1') {
        this.currentId = null;
        let formDataDialog = { parentId: data['id'] };
        // 新增时，部分字段有默认值，从formDesc的default字段中获取
        const formDesc = this.formDesc.formDesc;
        Object.keys(formDesc).forEach(item => formDesc[item].default && (formDataDialog[item] = formDesc[item].default));
        this.formDataDialog = formDataDialog;
      }
    },
    // 提交表单
    handleSubmit() {
      this.isloading = true;
      const data = { ...this.formDataDialog, [this.primaryKey]: this.currentId };
      const params = {
        ...this.$route.params,
        pageModelId: this.pageModelObj[this.type],
        data,
      };
      const api = this.currentId ? updateForm : addForm;
      const hintMessage = this.currentId ? $i18n.t('common.editSuccess') : $i18n.t('common.addSuccess');
      api(params).then(res => {
        this.$message.success(res.data.message || hintMessage);
        this.getTreeList();
        this.formDataDialog = {};
        this.key = new Date().getTime();
      }).finally(_ => this.isloading = false);
    },
    // 取消表单
    handleCancel() {
      this.formDataDialog = {};
      this.getFormConfig('3');
      this.currentId = null;
      this.type = null;
    },
    // 清空数据
    clearData() {
      this.formDataDialog = {};
      this.currentId = null;
      this.type = null;
    },
  }
}
</script>

<style lang="scss" scoped>
.tree-model {
  display: flex;
  // 左侧树结构区域
  .main-left {
    width: 35%;
    background-color: #ffffff;
    padding: 10px;
    margin-right: 10px;
    height: calc(100vh - 142px);
    overflow: auto;
    .custom-tree-node {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      padding-right: 8px;
      i {
        color: #333333;
        margin: 0 10px;
      }
      // 删除图标颜色
      .el-icon-delete {
        color: #f56c6c;
      }
    }
  }
  // 右侧表单区域
  .main-right {
    width: 62%;
    padding: 10px;
    background-color: #ffffff;
  }
  /deep/ .el-input__suffix {
    display: flex;
    align-items: center;
  }
}
</style>
