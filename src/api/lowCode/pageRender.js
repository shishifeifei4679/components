import request from "@/axios/request";
import url from "@/axios/url";
const { adminUrl, preUrl } = url();

// 获取页面渲染配置信息
export function getConfigInfo(params = {}) {
  return request({
    url: `${adminUrl}config/render/${params.functionCode}/${params.dataModelId}/${params.pageModelId}`,
    method: "GET",
  });
}

// 获取表格数据
export function getList(params = {}) {
  let path = params.sysCode === 'platform' ? url().adminUrl : url()[`${params.sysCode}Url`];
  return request({
    url: `${path}engine/${params.functionCode}/${params.dataModelId}/${params.pageModelId}`,
    method: "GET",
    params
  });
}

// 获取树结构数据
export function getTreeList(params = {}) {
  let path = params.sysCode === 'platform' ? url().adminUrl : url()[`${params.sysCode}Url`];
  return request({
    url: `${path}engine/${params.functionCode}/${params.dataModelId}/${params.pageModelId}/tree/`,
    method: "GET",
  });
}

// 获取单条数据详情
export function getDetail(params = {}) {
  let path = params.sysCode === 'platform' ? url().adminUrl : url()[`${params.sysCode}Url`];
  return request({
    url: `${path}engine/${params.functionCode}/${params.dataModelId}/${params.pageModelId}/info/${params.id}`,
    method: "GET",
  });
}

// 删除表格数据
export function deleteData(params = {}) {
  let path = params.sysCode === 'platform' ? url().adminUrl : url()[`${params.sysCode}Url`];
  return request({
    url: `${path}engine/${params.functionCode}/${params.dataModelId}/${params.pageModelId}/${params.ids}`,
    method: "DELETE",
  });
}

// 导出表格数据
export function exportData(params = {}) {
  const { sysCode, functionCode, dataModelId, pageModelId, exportType, btnActionTarget } = params;
  let path = sysCode === 'platform' ? url().adminUrl : url()[`${sysCode}Url`];
  // exportType 0:默认（低代码导出） 1:自定义导出
  if (exportType === '0') {
    return `${path}engine/${functionCode}/${dataModelId}/${pageModelId}/export`;
  } else if (exportType === '1') {
    return path.slice(0, -1) + btnActionTarget;
  }
}

// 调用接口
export function apiInvoker(url, params = {}) {
  // 对url进行判断，是否以http开头，如果不是，取preUrl，线上直接使用/根路径即可
  !url.startsWith('http') && (url = (preUrl || '') + url);
  return request({
    url,
    method: "GET",
    params
  });
}

// 获取功能id
export function getFunctionId(params = {}) {
  return request({
    url: `${adminUrl}config/render/functionInfo`,
    method: "GET",
    params
  });
}

// 获取页面模型列表
export function getListPageModel(params = {}) {
  return request({
    url: `${adminUrl}devFunctionPageModel/list`,
    method: 'GET',
    headers: {
      'functionId': params.functionId,
    },
    params
  });
}

// 新增表单
export function addForm(params = {}) {
  let path = params.sysCode === 'platform' ? url().adminUrl : url()[`${params.sysCode}Url`];
  return request({
    url: `${path}engine/${params.functionCode}/${params.dataModelId}/${params.pageModelId}`,
    method: "POST",
    data: params.data,
  });
}

// 修改表单
export function updateForm(params = {}) {
  let path = params.sysCode === 'platform' ? url().adminUrl : url()[`${params.sysCode}Url`];
  return request({
    url: `${path}engine/${params.functionCode}/${params.dataModelId}/${params.pageModelId}`,
    method: "PUT",
    data: params.data,
  });
}

// 下载导入模板
export function downloadTemplate(params = {}) {
  const { sysCode, functionCode, dataModelId, pageModelId, importType, importTemplateUrl } = params;
  let path = sysCode === 'platform' ? url().adminUrl : url()[`${sysCode}Url`];
  // importType 0:默认（低代码导入） 1:自定义导入 2:动态模板导入(在组件ele-import-drawer中有处理)
  if (importType === '0') {
    return `${path}engine/${functionCode}/${dataModelId}/${pageModelId}/template`;
  } else if (importType === '1') {
    return path.slice(0, -1) + importTemplateUrl;
  }
}

// 导入文件路径
export function importUrl(params = {}) {
  const { sysCode, functionCode, dataModelId, pageModelId, importType, btnActionTarget } = params;
  let path = sysCode === 'platform' ? url().adminUrl : url()[`${sysCode}Url`];
  // importType 0:默认（低代码导入） 1:自定义导入 2:动态模板导入(在组件ele-import-drawer中有处理)
  if (importType === '0') {
    return `${path}engine/${functionCode}/${dataModelId}/${pageModelId}/import`;
  } else if (importType === '1') {
    return path.slice(0, -1) + btnActionTarget;
  }
}

// 下载后端基础代码
export function downloadBackendBasicCode(params = {}) {
  return `${adminUrl}devFunction/downloadBasicCode?${params}`
}

// 测试API接口
export function testApi(url) {
  // 对url进行判断，是否以http开头，如果不是，取preUrl，线上直接使用/根路径即可
  !url.startsWith('http') && (url = (preUrl || '') + url);
  return request({
    url,
    method: 'GET',
  });
}
