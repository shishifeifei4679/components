import '@/public-path'
import axios from 'axios'
import { Message } from 'element-ui'
import store from '@/store'
import i18n from '@/lang/index'
import sys from '@/config'
import router from '@/router'

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

// 创建axios实例
const service = axios.create({
  // axios中请求配置有baseURL选项，表示请求URL公共部分
  baseURL: "",
  timeout: 30000,
});

// 异常情况下的退出，正常操作退出走vuex的logout
// 后端返回102（请重新登录）或者403（无权限）时，直接清除state和storage的数据，不再请求后端（不执行正常的退出登录）
function logout() {
  // 后端返回102（请重新登录）时，直接清除state和storage的数据，不再请求后端
  const tenantCode = store.getters.userInfo.tenantCode;
  store.commit("CLEAR_USER");
  localStorage.clear();
  sessionStorage.clear();
  // 作为qiankun子应用时，退出登录跳转到/mom/login/租户代码
  const publicPath = window.__POWERED_BY_QIANKUN__ ? ('/' + sys.publicPath.split('/')[1] + '/') : sys.publicPath;
  window.location.href = `${publicPath}login/${tenantCode}?redirect=${router.currentRoute.path}`;
}

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    let user = JSON.parse(sessionStorage.getItem('vuex') || '{}')?.user;
    // 线上环境，判断接口是否有权限，是否在microApps列表中，本地开发不限制
    if (process.env.NODE_ENV === 'production') {
      const pathname = config.url?.split('/')[1].replace('-biz', '');
      // const pathname = new URL(config.url).pathname?.split('/')[1].replace('-biz', '');  // 本地开发时，config.url是一个完整的url，http://www.xx.com/platform/xxx
      if (!config.url.startsWith('http') && pathname !== 'platform' && !(user['microApps'] || []).includes(pathname)) {
        return Promise.reject({
          response: {
            url: config.url,
            status: 'noPermission'
          }
        });
      }
    }
    let resourceId = "";
    let satoken = "";
    if (window.__POWERED_BY_QIANKUN__) {
      satoken = user?.token;
      resourceId = user?.resourceId;
    } else {
      satoken = store.getters.token || '';
      resourceId =  store.getters.resourceId || '';
    }
    config.headers["resourceId"] = resourceId;
    config.headers["lang"] = store.getters.language || "cn";
    config.headers['satoken'] = satoken
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (res) => {
    // code=102，后端返回请重新登录提示
    if (res.data.code == 102) {
      logout()
    } else {
      return res;
    }
  },
  (error) => {
    const mes = error.response?.data?.message;
    const message = mes ? mes : i18n.t('ajaxErr')[error.response?.status || 'default'];
    if (error.response?.status == 403) {
      // TODO message和退出的先后顺序待处理
      logout();
    }
    // 为解决拦截器拦截时，多个message会同时弹出，会叠加一起的问题
    setTimeout(() => {
      Message({
        message: message,
        type: "error",
        duration: 5 * 1000,
      });
    }, 50)
    return Promise.reject(error);
  }
);
service.all = axios.all;
service.spread = axios.spread;
export default service;
