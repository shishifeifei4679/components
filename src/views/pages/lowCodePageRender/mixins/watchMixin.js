import parseColumns from '../utils/parseColumns';
import { apiInvoker } from '../../../../api/lowCode/pageRender';
import { ALL_BUTTONS, BUTTON_STYLE } from '../constant';

export default {
  watch: {
    configInfo: {
      handler(val) {
        const _this = this;
        const operateList = [];
        const { pageBasicConfig, searchConfig, fieldListConfig, topOperateConfig, rowOperateConfig } = val;
        const { pageModelType } = pageBasicConfig || {};
        // 表格配置
        this.column = parseColumns(val, _this, searchConfig);
        // 表格上方按钮配置
        topOperateConfig && topOperateConfig.forEach(item => {
          const {
            btnText,
            btnTextEn,
            btnCode,
            btnIcon,
            btnStyle,
            btnType,
            btnAction,
            btnActionTarget,
            pageModelId,
            importType,  // 导入类型 0:默认（低代码导入） 1:自定义导入 2:动态模板导入
            importTemplateUrl,  // 导入模板地址
          } = item;
          // 自定义按钮的2个动作，1:打开新页面，2:调用接口
          const customEvent = (btnAction, btnActionTarget) => {
            if (btnAction === '1') {
              this.$router.push(btnActionTarget);
              return;
            }
            if (btnAction === '2') {
              this.loading = true;
              apiInvoker(btnActionTarget).then(res => {
                this.$message.success(res.data.message || $i18n.t('dev.function.pagemodel.hintMessage3'));  // 调用接口成功
              }).finally(_ => this.loading = false);
            }
          }
          // TODO 待处理
          // 增加表格上方按钮自定义事件
          btnType === '7' && (this.customEvent.top[btnCode] = () => {
            customEvent(btnAction, btnActionTarget);
          });
          // 增加表格行内按钮自定义事件
          btnType === '8' && (this.customEvent.row[btnCode] = () => {
            customEvent(btnAction, btnActionTarget);
          });
          // 表格上方按钮的配置
          let btnObj;
          // 导入按钮单独处理
          if (btnCode === 'import') {
            this.importConfig = {
              importType,
              btnActionTarget,
              importTemplateUrl,
            }
            btnObj = {
              btnType,
              render: (h, scope) => {
                return this.isDesign ? (
                  h('el-button', {
                      type: BUTTON_STYLE.find(i => i.value === btnStyle)?.text || 'default', icon: btnIcon || '', style: { 'margin-right': '10px' }, },
                    this.$store.getters.language === 'en' ? btnTextEn : btnText)) :
                  h('ele-import-drawer', {
                    props: {
                      importAction: importType === '2' ? undefined : this.importUrl,
                      exportFuntion: importType === '2' ? undefined : this.downloadTemplate,
                      btnText: this.$store.getters.language === 'en' ? btnTextEn : btnText,
                    },
                    style: { 'margin-right': '10px' },
                    on: {
                      success: () => {
                        this.refresh();
                      },
                    },
                  });
              },
            };
          } else {
            btnObj = {
              name: this.$store.getters.language === 'en' ? btnTextEn : btnText,
              btnType,
              type: BUTTON_STYLE.find(i => i.value === btnStyle)?.text || 'default',
              icon: btnIcon || '',
              handleName: btnCode,
              pageModelId,
            };
          }
          if (btnCode === 'batchDelete') {
            btnObj['disabled'] = (data) => !data.length;
          }
          operateList.push(btnObj);
        });
        // 对operateList进行排序，根据ALL_BUTTONS中是sort字段，升序排列
        operateList.forEach(item => item['sort'] = ALL_BUTTONS.find(i => i.btnType === item.btnType)?.sort);
        this.operateList = operateList.sort((a, b) => a.sort - b.sort);
      },
      immediate: true,
      deep: true
    }
  }
}
