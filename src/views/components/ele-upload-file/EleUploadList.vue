<template>
  <transition-group
    class="ele-upload-file-list el-upload-list el-upload-list--text"
    name="el-list"
    tag="ul"
  >
    <li
      :key="file.uid"
      class="el-upload-list__item ele-upload-list__item-content"
      v-for="(file, index) in files"
    >
      <el-link :href="file.url" :underline="false" target="_blank">
        <img
          :src="getExtension(file.name || file.title)"
          class="el-upload-list__item-content-name-icon"
        />
        <el-tooltip class="item" effect="dark" :content="file.name || file.title" placement="top-start">
          <span class="ele-file-name">{{ (file.name && file.name.length > 16 ? (file.name.slice(0, 16) + '...') : file.name) || (file.title && file.title.length > 16 ? (file.title.slice(0, 16) + '...') : file.title) }}</span>
        </el-tooltip>
      </el-link>
      <div class="ele-upload-list__item-content-action">
        <el-link :underline="false" v-if="isShowSize">{{
          getSize(file.size)
        }}</el-link>
        <el-link
          :underline="false"
          @click="handleDownload(file)"
          v-if="isCanDownload"
          >{{ $i18n.t("common.downLoad") }}</el-link
        >
        <el-link
          :underline="false"
          @click="handleDelete(index, file)"
          type="danger"
          v-if="!disabled && isCanDelete"
          >{{ $i18n.t("common.delete") }}</el-link
        >
      </div>
    </li>
  </transition-group>
</template>
<script>
import download from "ly-downloader";
import iconList from "./iconList";
const prettyBytes = require("pretty-bytes");

export default {
  name: "EleUploadList",
  props: {
    // 文件列表
    files: {
      type: Array,
      default() {
        return [];
      },
    },
    // 是否显示删除确认弹窗
    isShowDeleteConfim: {
      type: Boolean,
      default: true,
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false,
    },
    // 是否显示文件大小
    isShowSize: {
      type: Boolean,
      default: true,
    },
    // 是否显示下载
    isCanDownload: {
      type: Boolean,
      default: true,
    },
    // 是否可删除
    isCanDelete: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    // 获取扩展
    getExtension(name) {
      if (name.lastIndexOf(".") > -1) {
        const extension = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
        return iconList[extension] || iconList.file;
      } else {
        return iconList.file;
      }
    },
    // 获取文件大小
    getSize(size) {
      return size && !isNaN(Number(size)) ? prettyBytes(size) : "";
    },
    // 上传进度
    parsePercentage(val) {
      return parseInt(val, 10);
    },
    // 下载文件
    handleDownload(file) {
      if (file.url) {
        download(1, file.url, file.name || file.title);
      }
    },
    // 删除文件
    handleDelete(index, file) {
      if (this.isShowDeleteConfim) {
        this.$confirm($i18n.t("common.deleteFile"))
          .then(() => {
            this.$emit("remove", index, file);
          })
          .catch(() => {});
      } else {
        this.$emit("remove", index, file);
      }
    },
  },
};
</script>

<style>
.ele-upload-file-list .el-upload-list__item {
  border: 1px solid #e4e7ed;
  line-height: 2;
  margin-bottom: 10px;
  position: relative;
}

.ele-upload-file-list .ele-upload-list__item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: inherit;
}

.ele-upload-file-list .el-upload-list__item-content-name-icon {
  padding-left: 8px;
  padding-right: 5px;
  width: 20px;
  vertical-align: text-top;
  border-radius: 4px;
}
.ele-upload-list__item-content-action {
  min-width: 100px;
}
.ele-upload-list__item-content-action .el-link {
  margin-right: 10px;
}
.ele-file-name {
  word-break: break-all;
}
</style>
