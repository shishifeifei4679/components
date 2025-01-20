import { getDict } from '@/api/common';
import { ALL_BUTTONS } from '../constant';
import { testApi } from '../../../../api/lowCode/pageRender';
import { flattenArrayWithChildren } from '@/utils/judge';
// import { arrayToString } from '@/views/lowCode/codeRestoration/restoration/parseToString';
import store from '@/store/index';

// 对columns配置进行解析
// isRestore：是否是代码还原调用，如果是代码还原调用，需要将函数特殊处理
export default function (columnsConfig, that, searchConfig = [], isRestore = false) {
  let columns = [];
  // 将searchConfig变成对象形式，便于后续查找
  let searchConfigObj = {};
  searchConfig.forEach(item => searchConfigObj[item['propBasicInfo']['showCode']] = item);
  let { pageBasicConfig, fieldListConfig, rowOperateConfig } = columnsConfig;
  // 表格是否可以选择多行
  pageBasicConfig?.multipleChoice === '1' && columns.push({ type: 'selection' });
  // 对字段进行排序
  fieldListConfig = _.sortBy(fieldListConfig, data => data.propIndex);
  fieldListConfig && fieldListConfig.forEach(async item => {
    const { pageInfo, propBasicInfo, propPageInfo, propExtendInfo } = item;
    // showNameEn英文名称，根据当前语言显示哪个作为label
    const { showCode, showName, showNameEn, isPrimary, showPropType } = propBasicInfo || {};
    // 字段基本配置，宽度、超出是否隐藏，动作，最小宽度等
    const { listOverride, listWidth, listAction, listActionTarget } = propPageInfo || {};
    // column中不展示主键，比如id，主键用于删除、详情等操作
    let column = {
      prop: showCode,
      label: store.getters.language === 'en' ? showNameEn : showName,
    };
    // 是否是搜索字段
    let isSearchField = Object.keys(searchConfigObj).includes(showCode);
    // TODO 系统暂时无法配置搜索初始值和默认搜索值
    // 设置初始化搜索值
    // isSearchField && _.set(column, 'showColumnSearchConfig.value', '');
    // 设置默认搜索值，不同于初始化搜索值，当点击重置按钮时，搜索条件会重置为默认搜索值
    // isSearchField && _.set(column, 'showColumnSearchConfig.defaultValue', '');
    const { dataSource, dictType, apiAddr, staticVal } = propExtendInfo || {};
    if (isPrimary === '0') {
      switch (showPropType) {
        // 单选
        case '50':
          let optionConfig = {};
          // 数据源：0:数据字典 1:API 2:静态数据
          if (dataSource === '0') {
            if (!isRestore) {
              optionConfig['option'] = async () => {
                const list = await getDict(dictType);
                return list.data.result;
              }
            } else {
              optionConfig['option'] = {
                dataType: 'function',
                isArrowFn: true,
                body: `async () => { const list = await getDict('${dictType}'); return list.data.result; }`,
              };
              optionConfig['import'] = {
                functionName: 'getDict',
                from: '@/api/common'
              };
            }
          } else if (dataSource === '1') {
            if (!isRestore) {
              optionConfig['option'] = async () => {
                const list = await testApi(apiAddr);
                return list.data.result;
              }
            } else {
              optionConfig['option'] = {
                dataType: 'function',
                isArrowFn: true,
                body: `async () => { const list = await testApi('${apiAddr}'); return list.data.result; }`,
              };
              optionConfig['import'] = {
                functionName: 'testApi',
                from: '@/api/lowCode/editField'
              };
            }
          } else if (dataSource === '2') {
            // 在代码还原时，防止将变量代入
            const staticValue = JSON.parse(staticVal || '[]');
            if (!isRestore) {
              optionConfig['option'] = () => staticValue;
            } else {
              optionConfig['option'] = {
                dataType: 'function',
                isArrowFn: true,
                // body: `() => ${arrayToString(staticValue)}`,
              };
            }
          }
          optionConfig['optionProp'] = {
            value: 'value',
            label: "description",
          }
          column = {
            ...column,
            showOverflowTooltip: false,  // 关闭提示
            ...optionConfig,
          };
          // TODO
          // 设置搜索条件，没有option的情况暂不处理
          isSearchField && _.set(column, 'showColumnSearchConfig.type', 'radio');
          break;
        // 多选
        // TODO 表单中没有多选的字段
        // 日期型
        case '30':
          const { dateFormat } = propExtendInfo;
          // 设置搜索条件
          if (isSearchField) {
            _.set(column, 'showColumnSearchConfig.type', 'datePicker');
            _.set(column, 'showColumnSearchConfig.sort', true);
            _.set(column, 'showColumnSearchConfig.valueFormat', dateFormat);
          }
          break;
        // 树选
        case '51':
          // 数据源：1:API 2:静态数据
          let list = [];
          if (dataSource === '1') {
            const res = await testApi(apiAddr);
            list = res.data.result;
          } else if (dataSource === '2') {
            list = JSON.parse(staticVal || '[]');
          }
          const flattenList = flattenArrayWithChildren(list);
          column.render = (h, { row }) => {
            const item = flattenList.find(item => item.id === row[showCode]);
            return h('span', {}, item?.label || '');
          }
          // 设置搜索条件
          if (isSearchField) {
            _.set(column, 'showColumnSearchConfig.type', 'tree');
            _.set(column, 'showColumnSearchConfig.sort', true);
          }
          break;
      }
      // 设置搜索条件，通用的配置，比如value、type等
      if (Object.keys(searchConfigObj).includes(showCode)) {
        column['showColumnSearch'] = true;
        if (column['option']) {
          _.set(column, 'showColumnSearchConfig.type', 'radio');
          _.set(column, 'showColumnSearchConfig.showCheckbox', true);
        }
      }
      // 单元格是否有动作，比如点击打开、跳转等
      // 0:无 1:打开页面 2:调用窗口
      if (listAction === '1') {
        if (!isRestore) {
          column.render = (h, { row }) => {
            return h('el-button', { type: 'text', on: { click: () => that.$router.push('/platform/index') }}, row[showCode]);
          }
        } else {
          column.render = {
            dataType: 'function',
            isArrowFn: true,
            body: `(h, { row }) => { return (<el-button type='text' onClick={() => _this.$router.push('/platform/index')}>{row.${showCode}}</el-button>); }`
          }
        }
      } else if (listAction === '2') {

      }
      // 只要宽度，最大高度不起作用
      listWidth && (column['width'] = listWidth);
      listOverride === '1' && (column['showOverflowTooltip'] = true);
      columns.push(column);
    } else if (isPrimary === '1') {
      that && (that.primaryKey = showCode);  // 设置主键，用于删除、详情等
    }
  })
  // 表格操作列宽度自适应
  const renderHeader = (h, { column }) => {
    let totalWidth = 0, widthArr = [];
    $('.row-operation').each(function() {
      $(this).children().each(function() {
        totalWidth += this.offsetWidth;
      })
      widthArr.push(totalWidth);
      totalWidth = 0;
    });
    const width = Math.max(...widthArr) + 20 + 24;
    column.width = width < 160 ? 160 : width;  // 20是按钮直接的间距，24是单元格左右padding
    return h('span', {}, column.label);
  }
  // 表格操作列配置
  if (Array.isArray(rowOperateConfig) && rowOperateConfig.length) {
    let rowConfig = [];
    rowOperateConfig.forEach(item => {
      const { btnText, btnTextEn, btnCode, btnIcon, btnStyle, btnType } = item;
      rowConfig.push({
        name: store.getters.language === 'en' ? btnTextEn : btnText,
        type: 'primary',  // 行内操作按钮样式
        class: btnIcon,
        handleName: btnCode,
        btnType,
      });
    })
    // 对操作列的按钮进行排序
    rowConfig.forEach(item => item['sort'] = ALL_BUTTONS.find(i => i.btnType === item.btnType)?.sort);
    rowConfig = _.sortBy(rowConfig, data => data.sort);
    const operate = {
      prop: 'operate',
      label: $i18n.t('common.operation'),  // 操作
      fixed: 'right',
      width: 100,
      showOverflowTooltip: false,
    }
    if (!isRestore) {
      operate['renderHeader'] = renderHeader;
      operate['render'] = (h, scope) => {
        return h('ele-row-operation', { props: { scope: scope, rowConfig: rowConfig }, on: { rowOperate: that.rowOperate } });
        // return <ele-row-operation scope={scope} rowConfig={rowConfig} onRowOperate={that.rowOperate}></ele-row-operation>;
      }
    } else {
      operate['render'] = {
        dataType: 'function',
        isArrowFn: true,
        body: `(h, scope) => { return (<ele-row-operation scope={scope} rowConfig={_this.rowConfig} onRowOperate={_this.rowOperate}></ele-row-operation>); }`
      }
    }
    columns.push(operate);
  }
  return columns;
}
