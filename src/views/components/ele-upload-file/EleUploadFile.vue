<template>
  <div class="ele-upload-file" v-loading="loading">
    <el-upload
        :before-upload="handleBeforeUpload"
        :drag="false"
        :file-list="fileList"
        :limit="limit"
        :multiple="multiple"
        :on-change="handleChange"
        :on-error="handleUploadError"
        :on-exceed="handleExceed"
        v-bind="$attrs"
        :on-success="handleUploadSuccess"
        :show-file-list="false"
        class="ele-upload-file-uploader"
        ref="upload"
        :headers="headers"
        v-if="!disabled"
    >
      <!-- 上传按钮 -->
      <el-button size="small" type="primary">{{ btnText }}</el-button>
      <!-- 上传提示 -->
      <div class="el-upload__tip" slot="tip" v-if="showTip">
        {{ this.$t("common.upload2") }}
        <template v-if="fileSize">
          {{ this.$t("common.uploadSize") }}
          <b style="color: #f56c6c">{{ fileSize }}MB</b>
        </template>
        <template v-if="fileType">
          {{ this.$t("common.uploadType") }}
          <b style="color: #f56c6c">{{ fileType.join("/") }}</b>
        </template>
        {{ this.$t("common.upload3") }}
      </div>
    </el-upload>

    <!-- 列表 -->
    <ele-upload-list
        :disabled="disabled"
        :files="list"
        :isCanDelete="isCanDelete"
        :isCanDownload="isCanDownload"
        :isShowDeleteConfim="isShowDeleteConfim"
        :isShowSize="isShowSize"
        @remove="handleRemove"
    />
  </div>
</template>

<script>
import EleUploadList from "./EleUploadList"

export default {
  inheritAttrs: false,
  name: "EleUploadFile",
  components: {
    EleUploadList
  },
  props: {
    // 值
    value: [String, Object, Array],
    // 大小限制(MB)，默认10MB
    fileSize: {
      type: Number,
      default: 10,
    },
    // 响应处理函数
    responseFn: Function,
    // 文件类型, 例如['png', 'jpg', 'jpeg']
    fileType: Array,
    // 提示
    placeholder: String,
    // 是否禁用
    disabled: Boolean,
    // 是否显示文件大小
    isShowSize: {
      type: Boolean,
      default: true
    },
    // 是否显示下载
    isCanDownload: {
      type: Boolean,
      default: true
    },
    // 是否可删除
    isCanDelete: {
      type: Boolean,
      default: true
    },
    // 是否显示删除确认弹窗
    isShowDeleteConfim: {
      type: Boolean,
      default: true
    },
    // 是否可上传相同文件
    isCanUploadSame: {
      type: Boolean,
      default: true
    },
    // 是否显示提示
    isShowTip: {
      type: Boolean,
      default: true
    },
    // 是否显示上传成功的提示
    isShowSuccessTip: {
      type: Boolean,
      default: true
    },
    // 是否支持多选文件
    // 同 element-ui upload 组件
    multiple: {
      type: Boolean,
      default: true
    },
    // 最大允许上传个数，默认最多上传3个文件
    // 同 element-ui upload 组件
    limit: {
      type: Number,
      default: 3
    },
    // 删除前的操作
    // 同 element-ui upload 组件
    beforeRemove: Function,
    // 返回数据格式
    returnDataFormat: {
      type: String,
      default: 'array'
    }
  },
  data() {
    return {
      fileList: [],
      loading: false,
      headers: {
        Satoken: this.$store.getters.token
      }
    }
  },
  computed: {
    // 按钮文本
    btnText() {
      if (this.placeholder) {
        return this.placeholder
      } else {
        return this.limit === 1 ? this.$t("common.uploadFileSingle") : this.$t("common.uploadFile");
      }
    },
    // 是否显示提示
    showTip() {
      return this.isShowTip && (this.fileType || this.fileSize)
    },
    // 列表
    list() {
      let temp = 1
      if (this.value) {
        // 首先将值转为数组
        const list = Array.isArray(this.value) ? this.value : [this.value]
        // 然后将数组转为对象数组
        return list.map((item) => {
          if (typeof item === "string") {
            item = { name: item, url: item }
          }
          item.uid = item.uid || new Date().getTime() + temp++
          return item
        })
      } else {
        return []
      }
    }
  },
  watch: {
    value: {
      handler(val) {
        this.fileList = this.list
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    // 文件改变
    handleChange(file, fileList) {
      this.fileList = fileList
    },
    // 上传前校检格式和大小
    handleBeforeUpload(file) {
      // 校检文件类型
      if (this.fileType) {
        let fileExtension = ""
        if (file.name.lastIndexOf(".") > -1) {
          fileExtension = file.name.slice(file.name.lastIndexOf(".") + 1)
        }
        const isTypeOk = this.fileType.some((type) => {
          if (file.type.indexOf(type) > -1) return true
          if (fileExtension && fileExtension.toLowerCase()==type.toLowerCase()) return true
          return false
        })
        if (!isTypeOk) {
          this.$message.error(`${this.$t("common.upload4")} ${this.fileType.join("/")} ${this.$t("common.upload5")}!`)
          return false;
        }
      }
      // 校检文件大小
      if (this.fileSize) {
        const isLt = file.size / 1024 / 1024 < this.fileSize
        if (!isLt) {
          this.$message.error(`${this.$t("common.upload6")} ${this.fileSize} MB!`)
          return false;
        }
      }
      // 校检相同文件
      if (!this.isCanUploadSame) {
        const isSame = this.list.some((item) => item.name + item.size === file.name + file.size)
        if (isSame) {
          this.$message.error(this.$t("common.upload7"))
          return false;
        }
      }
    },
    // 文件个数超出
    handleExceed() {
      this.$message.error(`${this.$t("common.upload8")} ${this.limit} ${this.$t("common.upload9")}`)
    },
    // 上传失败
    handleUploadError(err) {
      this.loading = false
      this.$message.error(this.$t("common.upload10"))
      this.$emit("error", err)
    },
    // 上传成功回调
    handleUploadSuccess(response, file, uploadFiles) {

      this.loading = false
      if (this.isShowSuccessTip) {
        this.$message.success(this.$t("common.upload11"))
      }
      if (this.responseFn) {
        response = this.responseFn(response, file, this.list)
      }
      const fileList = [...this.list];
      // 防止重复添加，初次调用时，双向数据绑定上传列表，添加uid，el-upload上传成功对比uid，对比成功才调用成功回调
      // uid必须存在，且不能修改
      uploadFiles.forEach(item => {
        item.raw && (item.raw = JSON.parse(JSON.stringify(item.raw)));
        const index = fileList.findIndex(file => file.uid === item.uid);
        // 如果responseFn返回的是字符串，需要组合成对象
        let result = typeof response === 'string' ? { url: response, src: response, } : response;
        if (index > -1) {
          // 当前上传的文件已经在列表中，更新文件信息
          // 不是当前上传的文件，且在列表中，不处理
          file.uid === item.uid && (fileList[index] = { ...fileList[index], ...result, uid: item.uid });
        } else {
          // 首次添加
          fileList.push(file.uid === item.uid ? { ...item, ...result, uid: item.uid } : item)
        }
      })
      // 为兼容旧版本的错误写法，returnDataFormat默认为'array' 时，返回数组
      let returnResult = fileList;
      if (this.returnDataFormat === 'string') {
        returnResult = fileList.map(item => item.url).join(',')
      } else if (this.returnDataFormat === 'object') {
        if (this.limit === 1) {
          returnResult = fileList[0];
        } else {
          console.error('多文件上传，不能返回对象格式');
          returnResult = fileList;
        }
      }
      this.$emit("input", returnResult);
      // 上传成功
      this.$emit("success", response, this.list)
    },
    handleRemove(index) {
      if (!this.beforeRemove) {
        this.doRemove(index)
      } else if (typeof this.beforeRemove === "function") {
        const before = this.beforeRemove(this.list[index], this.list)
        if (before && before.then) {
          before.then(
              () => {
                this.doRemove(index)
              },
              () => {}
          )
        } else if (before !== false) {
          this.doRemove(index)
        }
      }
    },
    // 删除
    doRemove(index) {
      this.$emit("remove", this.list[index], this.list);
      // this.fileList.splice(index, 1)
      if (this.limit === 1) {
        this.$emit("input", null)
      } else {
        const data = [...this.list]
        data.splice(index, 1)
        this.$emit("input", data || [])
      }
    }
  },
  created() {
    this.fileList = this.list
  }
}
</script>

<style>
.ele-upload-file-uploader {
  margin-bottom: 5px;
}
</style>
