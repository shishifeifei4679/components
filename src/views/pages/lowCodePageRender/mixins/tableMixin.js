import {addForm, deleteData, getDetail, updateForm} from '../../../../api/lowCode/pageRender'

export default {
  methods: {
    // 提交表单
    handleSubmit() {
      this.isLoading = true;
      let formApi, hintMessage, pageModelId;
      if (this.formDataDialog[this.primaryKey]) {
        formApi = updateForm;
        hintMessage = $i18n.t('common.editSuccess');
        pageModelId = this.pageModelObj['2'];
      } else {
        formApi = addForm;
        hintMessage = $i18n.t('common.addSuccess');
        pageModelId = this.pageModelObj['1'];
      }
      const { formDesc } = this.formDescDialog;
      const data = _.cloneDeep(this.formDataDialog);
      // 如果表单含上传文件或图片，需要将数据处理成字符串
      Object.keys(formDesc).forEach(item => {
        const type = formDesc[item]['type'];
        if (type === 'upload-file') {
          // 如果是单文件上传，直接取url，如果是多文件上传，取url拼接成字符串
          if (formDesc[item]['attrs']['limit'] === 1) {
            data[item] = data[item]['url'];
          } else {
            if (data[item] && data[item].length) {
              data[item] = data[item].map(it => it['url']).join(',');
            }
          }
        } else if (type === 'image-upload') {
          // if (data[item] && Array.isArray(data[item]) && data[item].length) {
          //   data[item] = data[item].map(it => it['src']).join(',');
          // } else {
          //   data[item] = '';
          // }
        }
      })
      let params = {
        ...this.params,
        pageModelId,
        data
      };
      // 如果是关联模型的子表单，需要传递子表单的数据模型id
      if (this.configInfo?.['pageBasicConfig']?.['pageModelType'] === 'associationSub') {
        params['dataModelId'] = this.configInfo['pageBasicConfig']['associationDataModelId']
      }
      formApi(params)
        .then(res => {
          this.$message.success(res.data.message || hintMessage);
          this.visible = false;
          this.formDataDialog = {};
          this.refresh();
        })
        .finally(_ => this.isLoading = false);
    },
    // 删除
    rowDel(ids) {
      this.loading = true;
      const params = { ...this.params, ids };
      // 如果是关联模型的子表单，需要传递子表单的数据模型id
      if (this.configInfo?.['pageBasicConfig']?.['pageModelType'] === 'associationSub') {
        params['dataModelId'] = this.configInfo['pageBasicConfig']['associationDataModelId'];
        params['pageModelId'] = this.pageModelObj['0'];
      }
      deleteData(params)
        .then(res => {
          const message = res.data.message;
          this.$message.success(message || $i18n.t('common.deleteSuccess'));
          this.refresh();
        })
        .finally(_ => this.loading = false);
    },
    // 获取单条数据详情
    getDetail(params) {
      this.loading = true;
      getDetail(params)
        .then(res => {
          let formDataDialog = res.data.result;
          const formDesc = this.formDescDialog['formDesc'];
          Object.keys(formDesc).forEach(item => {
            if (formDataDialog[item]) {
              if (formDesc[item]['type'] === 'upload-file') {
                // 附件上传，需要将字符串转换成数组
                if (formDesc[item]['attrs']['limit'] === 1) {
                  formDataDialog[item] = [{
                    url: formDataDialog[item],
                    name: formDataDialog[item]
                  }];
                } else {
                  const fileArr = formDataDialog[item].split(',');
                  // 如果是多文件上传，但是只有一个文件，直接取url，多个文件就拆分成数组
                  if (fileArr.length > 1) {
                    formDataDialog[item] = fileArr.map(it => ({
                      url: it,
                      name: it
                    }));
                  } else {
                    formDataDialog[item] = [{
                      url: formDataDialog[item],
                      name: formDataDialog[item]
                    }];
                  }
                }
              } else if (formDesc[item]['type'] === 'image-upload') {
                // 新的图片上传组件，不需要转换
                // 图片上传，如果是多个图片，需要转换成数组
                // const imgArr = formDataDialog[item].split(',').map(it => ({
                //   src: it
                // }));
                // imgArr.length && (formDataDialog[item] = imgArr);
              }
            }
          })
          this.formDataDialog = formDataDialog;
          this.visible = true;
        })
        .finally(_ => this.loading = false)
    },
  }
}
