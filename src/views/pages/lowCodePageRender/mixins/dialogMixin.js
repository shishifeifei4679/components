import { apiInvoker } from '../../../../api/lowCode/pageRender'

export default {
  data() {
    return {
      listDialogVisible: false,  // 字段选择数据弹窗
      listSearchConfig: {
        inline: true,
        formDesc: {}
      },  // 字段选择数据弹窗搜索配置
      listColumn: [],  // 字段选择数据弹窗表格配置
      getDialogList: null,  // 字段选择数据弹窗获取数据API
      returnParam: null,  // 字段选择数据弹窗回显配置
      pagination: false,  // 字段选择数据弹窗是否分页
    }
  },
  methods: {
    // 显示字段选择数据弹窗
    showListDialog(data) {
      this.listSearchConfig.formDesc = {};
      // 处理弹窗的column以及接口
      const {
        apiAddr,  // api地址
        isPage,  // 是否分页，1:分页，0:不分页
        searchParam,  // 搜索字段
        returnParam,  // 表头配置
      } = data;
      this.getDialogList = async (params) => await apiInvoker(apiAddr, params);
      this.pagination = isPage === '1';
      this.returnParam = returnParam;
      this.listColumn = (JSON.parse(returnParam || '[]')).map(item => ({
        prop: item.key,
        label: item.desc,
      }));
      this.listColumn.unshift({
        type: 'radio',
      });
      const searchConfig = JSON.parse(searchParam || '[]');
      if (searchConfig.length) {
        searchConfig.forEach(item => {
          this.listSearchConfig.formDesc[item.key] = {
            type: 'input',
            label: item.desc,
            layout: 8,
          }
        })
      } else {
        this.listSearchConfig = {};
      }
      this.getDataList = async (params) => await apiInvoker(apiAddr, params);
      this.listDialogVisible = true;
    },
    // 选择数据弹窗数据返回的是不分页数据时，需要转换
    transformData(data) {
      return Promise.resolve({ records: this.pagination ? data.data.result.records : data.data.result, total: data.data.result.total });
    },
    // 字段选择数据回调
    setSelectData(data) {
      const returnParam = JSON.parse(this.returnParam);
      returnParam.forEach(item => item['fillPropCode'] && this.$set(this.formDataDialog, item['fillPropCode'], data[0][item['key']]));
    },
    // 清除弹窗字段的值
    clearDialogField(showCode, returnParam) {
      this.$set(this.formDataDialog, showCode, '');
      returnParam.forEach(item => this.$set(this.formDataDialog, item, ''));
    },
  }
}
