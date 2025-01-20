import _ from 'lodash';
import store from '@/store';
import { deleteFile, getDict } from '@/api/common';
import { FORM_DESC_FIELD_TYPE, REG_EXP } from '../constant';
import { getConfigInfo, testApi } from '../../../../api/lowCode/pageRender';
import url from '@/axios/url';
const { adminUrl } = url();

// 对字段配置进行解析
export const parseField = (field, rules, others = {}, isRestore = false) => {
  const { propId, propExtendInfo, propBasicInfo, propPageInfo } = field;
  const {
    showCode,
    showName,
    showNameEn,
    showRequire,
    showPropType,
    verificationRules,  // 校验正则表达式
  } = propBasicInfo;
  const {
    minLen,
    maxLen,
    defaultVal,  // 数字类型的默认值
    precision,  // 数字类型的精度
    minVal,  // 数字类型的最小值
    maxVal,  // 数字类型的最大值
    dateFormat,  // 日期格式
    fileMax,  // 附件上传最大数量，比如3个
    fileShowType,  // 附件上传显示类型
    fileSize,  // 附件上传大小，比如3M
    fileType,  // 附件上传格式，比如pdf、jpg
    echoProp,  // 回显字段
    echoPropCode,  // 回显字段的showCode
    returnParam,  // 弹窗回显字段列表，JSON格式
  } = propExtendInfo || {};
  // 栅格数，是否可以编辑0:否 1:是，独立成行（暂不可用）
  const {
    formGridCount,
    formEditable,
    formIndependent,
    propIndex,
    widgetPrefixWords,    // 前缀文字，后缀文字
    widgetPostfixWords,
    widgetPrefixIcon,
    widgetPostfixIcon,
    widgetWordsCount,
    widgetPasswordVisible,  // 密码是否可见
    widgetNumberStep,  // 步长
  } = propPageInfo;
  let config = {
    type: FORM_DESC_FIELD_TYPE[showPropType],
    label: store.getters.language === 'en' ? showNameEn : showName,
    layout: formGridCount,
    required: showRequire === '1',
  }
  const _this = others.data || {};
  switch (showPropType) {
    // 普通输入框
    case '10':
      // 前缀文字
      if (widgetPrefixWords) {
        if (!isRestore) {
          _.set(config, 'slots.prepend', h => h('span', widgetPrefixWords))
        } else {
          _.set(config, 'slots.prepend', {
            dataType: 'function',
            isArrowFn: true,
            body: `h => h('span', '${widgetPrefixWords}')`
          })
        }
      }
      if (widgetPostfixWords) {
        if (!isRestore) {
          _.set(config, 'slots.append', h => h('span', widgetPostfixWords))
        } else {
          _.set(config, 'slots.append', {
            dataType: 'function',
            isArrowFn: true,
            body: `h => h('span', '${widgetPostfixWords}')`
          })
        }
      }
      // 前缀图标
      widgetPrefixIcon && (_.set(config, 'attrs.prefix-icon', widgetPrefixIcon));
      widgetPostfixIcon && (_.set(config, 'attrs.suffix-icon', widgetPostfixIcon));
      // 字数统计
      widgetWordsCount === 1 && (_.set(config, 'attrs.show-word-limit', true));
      // 最大长度、最小长度
      maxLen && (_.set(config, 'attrs.maxlength', parseInt(maxLen)));
      // parseInt(minLen) > 0 && (_.set(config, 'attrs.minlength', parseInt(minLen)));
      break;
    // 文本域
    case '11':
      // 字数统计
      widgetWordsCount === 1 && (_.set(config, 'attrs.show-word-limit', true));
      // 最大长度、最小长度
      maxLen && (_.set(config, 'attrs.maxlength', parseInt(maxLen)));
      // parseInt(minLen) > 0 && (_.set(config, 'attrs.minlength', parseInt(minLen)));
      break;
    // 富文本
    case '12':
      config['attrs'] = { id: showCode };
      break;
    // 密码
    case '13':
      // 前缀图标
      widgetPrefixIcon && (_.set(config, 'attrs.prefix-icon', widgetPrefixIcon));
      widgetPostfixIcon && (_.set(config, 'attrs.suffix-icon', widgetPostfixIcon));
      widgetPasswordVisible === '1' && (_.set(config, 'attrs.show-password', true));
      break;
    // 数字输入框
    case '20':
      defaultVal && (_.set(config, 'default', Number(defaultVal)));
      precision && (_.set(config, 'attrs.precision', Number(precision)));
      widgetNumberStep && (_.set(config, 'attrs.step', Number(widgetNumberStep)));
      minVal && (_.set(config, 'attrs.min', Number(minVal)));
      maxVal && (_.set(config, 'attrs.max', Number(maxVal)));
      break;
    // 日期选择
    case '30':
      // 设置日期的显示格式，时间戳转日期
      _.set(config, 'attrs.valueFormat', dateFormat);
      break;
    // 弹窗
    case '40':
      _.set(config, 'attrs.readonly', true);
      config['type'] = 'input';
      // 将回显字段存下来，需要进一步设置回显字段的disabled为true
      const returnParamArr = JSON.parse(returnParam || '[]').filter(item => item['fillPropCode'] !== showCode);
      config['returnParam'] = returnParamArr.map(item => item['fillPropCode']);
      config['slots'] = {
        append(h) {
          return others.btnType === '3'
            ? h('i', { class: 'el-icon-search', style: { cursor: 'not-allowed' }})
            : h('i', { class: 'el-icon-search', on: { click: () => _this.showListDialog(propExtendInfo) }, style: { cursor: 'pointer' }});
        },
        suffix(h, data) {
          return _this['formDataDialog'] && _this['formDataDialog'][showCode]
            ? h('i', { class: 'el-icon-circle-close', on: { click: () => _this.clearDialogField(showCode, config['returnParam']) }, style: { cursor: 'pointer' }})
            : null;
        }
      };

      break;
    // 下拉框/单选框
    case '50':
      config['prop'] = {
        value: 'value',
        text: 'description',
      };
      // 0:数据字典，1:API，2:静态数据
      if (propExtendInfo['dataSource'] === '0') {
        if (!isRestore) {
          config['options'] = async (data) => {
            const list = await getDict(propExtendInfo['dictType']);
            return list.data.result
          };
        } else {
          config['options'] = {
            dataType: 'function',
            isArrowFn: true,
            body: `async () => { const list = await getDict('${propExtendInfo['dictType']}'); return list.data.result; }`,
          };
          config['import'] = {
            functionName: 'getDict',
            from: '@/api/common'
          };
        }
      } else if (propExtendInfo['dataSource'] === '1') {
        if (!isRestore) {
          config['options'] = async (data) => {
            const list = await testApi(propExtendInfo['apiAddr']);
            return list.data.result
          }
        } else {
          config['options'] = {
            dataType: 'function',
            isArrowFn: true,
            body: `async () => { const list = await testApi('${propExtendInfo['apiAddr']}'); return list.data.result; }`,
          };
          config['import'] = {
            functionName: 'testApi',
            from: '@/api/lowCode/editField'
          };
        }
      } else if (propExtendInfo['dataSource'] === '2') {
        const value = JSON.parse(propExtendInfo['staticVal']);
        config['options'] = value;
      }
      // 处理回填字段
      if (echoProp && echoPropCode) {
        if (!isRestore) {
          _.set(config, 'on.oldOnChange', (data, item) => {
            _this.$set(_this.formDataDialog, echoPropCode, item['text'])
          })
        } else {
          _.set(config, 'on.oldOnChange', {
            dataType: 'function',
            isArrowFn: true,
            body: `(data, item) => { _this.$set(_this.formDataDialog, '${echoPropCode}', item['text']) }`,
          })
        }
      }
      break;
    // 树形结构
    case '51':
      config['attrs'] = {
        multiple: false,
        // appendToBody: true,
        disableBranchNodes: false,  // 只能选子节点
        flat: true,  // 设置true后，父节点可以设置为无法选中，不影响选中子节点，否则全部无法选中
        normalizer: (node) => ({
          label: node.name,
          isDisabled: node.id === '-1',
          ...node
        }),
      };
      // 1:API，2:静态数据
      if (propExtendInfo['dataSource'] === '1') {
        config['options'] = async (data) => {
          const list = await testApi(propExtendInfo['apiAddr']);
          return [{
            name: others['functionName'],
            id: '-1',
            children: list.data.result,
          }];
        }
      } else if (propExtendInfo['dataSource'] === '2') {
        config['options'] = JSON.parse(propExtendInfo['staticVal']);
      }
      // 处理回填字段
      echoProp && echoPropCode && _.set(config, 'on.select', data => {
        _this.$set(_this.formDataDialog, echoPropCode, data['label'])
      })
      break;
    // 附件上传
    case '60':
      config['attrs'] = {
        limit: parseInt(fileMax) || 1,
        fileType: JSON.parse(fileType).map(item => item[1]) || [],
        action: `${adminUrl}file`,
        data: {
          bucket: "messervice",
        },
        headers: {
          Satoken: store.getters.token,
        },
        // 是否可以选择多个文件
        multiple: fileMax > 1,
        beforeRemove: (data, list) => {
          return new Promise((resolve, reject) => {
            deleteFile(`${adminUrl}file`, { filename: data.name, bucket: 'messervice' })
              .then(res => resolve(res.data))
              .catch(err => reject(err))
          })
        },
        // autoUpload: false,
      };
      // 文件大小限制，单位M
      fileSize && (config['attrs']['fileSize'] = Math.floor(parseInt(fileSize) / 1024));
      if (fileShowType === '略缩图') {
        config['type'] = 'image-upload';
        config['attrs']['size'] = 80;
        config['attrs']['returnDataType'] = 'string';
        config['attrs']['stringToArrayFn'] = (data) => {
          return data.split(',').map(item => ({
            url: item,
            name: item.split('/').pop()
          }));
        };
        config['attrs']['responseFn'] = (res, file, files, fileList) => {
          return fileList.map(item => {
            item.response && (item = {
              name: item.response.result.object.split('/').pop(),
              url: item.response.result.path,
              ...item.response.result
            });
            return item;
          });
        };
      } else if (fileShowType === '文件名') {
        config['type'] = 'upload-file';
        config['attrs']['responseFn'] = (res, file) => ({
          url: res.result.path,
          name: res.result.object,
          ...res.result,
        });
      }
      break;
    default:
      break;
  }
  // 处理是否可以编辑
  formEditable === '0' && (config['disabled'] = true);
  // 处理校验规则
  // 设置了校验规则或者文本框文本域设置的最小长度或者最大长度
  // 暂停  || (['10', '11'].includes(showPropType) && (parseInt(minLen) > 0 || parseInt(maxLen) > 0))
  if (parseInt(verificationRules) > 0) {
    _.set(rules, showCode, parseRule(field))
  }
  return config;
}

const parseRule = (field) => {
  const { propBasicInfo, propExtendInfo } = field;
  const { showCode, verificationRules, verificationMsg, verificationMsgEn, regularExpression } = propBasicInfo;
  const rules = [];
  // 文本框的长度校验，暂停该功能
  // const { minLen, maxLen } = propExtendInfo;
  // if (['10', '11'].includes(propBasicInfo.showPropType)) {
  //   // 三种情况 1.只设置了最小长度 2.只设置了最大长度 3.都设置了
  //   if (minLen && !maxLen) {
  //     rules.push({
  //       min: parseInt(minLen),
  //       message: `长度至少为${minLen}`,
  //       trigger: ['blur', 'change']
  //     });
  //   } else if (!minLen && maxLen) {
  //     rules.push({
  //       max: parseInt(maxLen),
  //       message: `长度最大为${maxLen}`,
  //       trigger: ['blur', 'change']
  //     });
  //   } else if (minLen && maxLen) {
  //     rules.push({
  //       min: parseInt(minLen),
  //       max: parseInt(maxLen),
  //       message: `长度在${minLen}到${maxLen}之间`,
  //       trigger: ['blur', 'change']
  //     });
  //   }
  // }
  // 0是不校验，11是自定义正则表达式，其他是内置正则表达式
  if (verificationRules !== '0') {
    const expression = verificationRules === '11' ? new RegExp(regularExpression) : REG_EXP[verificationRules];
    rules.push({ validator: (rule, value, callback) => {
        // 空值不校验
        (!!!value || expression.test(value))
          ? callback()
          : callback(new Error(store.getters.language === 'en' ? verificationMsgEn : verificationMsg || $i18n.t('dev.function.pagemodel.hintMessage4')));  // 数据格式错误
      }, trigger: [ 'blur', 'change' ] });
  }
  return rules;
}

// 解析表单配置，others是额外的配置信息，比如说tree组件需要获取
export const parseForm = async (params, btnType, others = {}, isRestore = false) => {
  // 新增、修改、详情需要调用接口返回这3个表单的配置信息
  // 0:列表，1:新增，2:编辑，3:详情
  let formDescDialog = { formDesc: {} };
  let formGroupConfig = {};
  let rules = {};
  const fieldRelation = {
    '1': 'fieldAddConfig',
    '2': 'fieldEditConfig',
    '3': 'fieldDetailConfig'
  };
  const res = await getConfigInfo(params);
  const { pageBasicConfig } = res.data.result;
  const { labelWidth, submitText, cancelText, enableCancelBtn } = pageBasicConfig || {};
  const fieldConfig = res.data.result[fieldRelation[btnType]];
  formDescDialog['labelWidth'] = labelWidth;
  formDescDialog['isShowCancelBtn'] = enableCancelBtn === '1';
  formDescDialog['submitBtnText'] = submitText || '';
  formDescDialog['cancelBtnText'] = cancelText || '';
  fieldConfig.forEach(field => {
    !formGroupConfig[field.groupName] && (formGroupConfig[field.groupName] = []);
    formGroupConfig[field.groupName].push(field)
  })
  // 添加到表单配置中，btnType用于判断是否是详情，弹窗字段的搜索按钮在详情中不可点击，需要特殊处理
  const addField = field => formDescDialog.formDesc[field['propBasicInfo']['showCode']] = parseField(field, rules, { ...others, btnType }, isRestore);
  // 未分组的字段显示在最前面
  if (formGroupConfig['未分组']) {
    // 对字段进行排序
    formGroupConfig['未分组'].sort((a, b) => a['propPageInfo']['propIndex'] - b['propPageInfo']['propIndex']);
    formGroupConfig['未分组'].forEach(field => addField(field));
  }
  delete formGroupConfig['未分组'];
  // 分组字段在未分组字段后面显示
  // 对字段进行排序
  Object.keys(formGroupConfig).length && Object.keys(formGroupConfig).forEach((key, index) => {
    // 对formGroupConfig[key]进行排序
    formGroupConfig[key].sort((a, b) => a['propPageInfo']['propIndex'] - b['propPageInfo']['propIndex']);
  });
  Object.keys(formGroupConfig).length && Object.keys(formGroupConfig).forEach((key, index) => {
    formDescDialog.formDesc['group' + index.toString()] = {
      type: "section-name",
      label: '',
      labelWidth: '0',
      title: key,
      layout: 24,
    };
    formGroupConfig[key].forEach(field => addField(field));
  })
  Object.keys(rules).length && (formDescDialog['rules'] = rules);
  // 需要对弹窗的回显字段进行处理，设置disabled为true
  const formDesc = formDescDialog['formDesc'];
  Object.keys(formDesc).forEach(item => {
    if (formDesc[item]?.['returnParam']?.length) {
      formDesc[item]?.['returnParam'].forEach(it => {
        formDesc[it] && (formDesc[it]['disabled'] = true);
      })
    }
  })
  return formDescDialog;
}


