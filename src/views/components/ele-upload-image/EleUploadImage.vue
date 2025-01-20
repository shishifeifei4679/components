<template>
  <div class="ele-upload-image">
    <!-- 上传组件 -->
    <el-upload
      :accept="accept"
      :action="action"
      :before-upload="handleBeforeUpload"
      :data="data"
      :disabled="uploading"
      :drag="Boolean(drag)"
      :headers="headers"
      :http-request="httpRequest"
      :limit="limit"
      :list-type="drag ? 'picture' : 'picture-card'"
      :multiple="multiple"
      :name="name"
      :auto-upload="autoUpload"
      :on-change="handleChange"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :on-success="handleUploadSuccess"
      :show-file-list="false"
      :file-list="fileList"
      :style="{
        marginBottom: multiple && computedValues.length ? '20px' : '0px',
      }"
      :withCredentials="withCredentials"
      ref="upload"
      v-if="!crop && !disabled"
      v-show="isShowUpload"
    >
      <div v-loading="uploading">
        <!-- drag显示 -->
        <template v-if="drag">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            {{ $t("common.dragUpload") }}
            <em>{{ $t("common.clickUpload") }}</em>
          </div>
        </template>

        <!-- 非drag -->
        <template v-else>
          <div
            :style="{
              width: size + 'px',
              height: size + 'px',
              lineHeight: size + 'px',
            }"
          >
            <i class="el-icon-plus"></i>
          </div>
        </template>
      </div>

      <!-- 公共 -->
      <div class="el-upload__tip" slot="tip" v-if="showTip">
        {{ $t("common.upload16") }}
        <b style="color: #f56c6c;">{{
            fileType.length ? fileType.join("/") : $t("common.upload14")
          }}</b>
        {{ $t("common.upload13") }}
        <template v-if="fileSize">
          {{ $t("common.upload15") }}
          <b style="color: #f56c6c;">{{ fileSize }}MB</b>
        </template>
        <template v-if="otherTip">
          {{ otherTip }}
        </template>
      </div>
    </el-upload>

    <div v-if="crop && !disabled">
      <div
        :style="{
          width: size + 'px',
          height: size + 'px',
          lineHeight: size + 'px',
        }"
        @click="isShowCrop = true"
        class="el-upload el-upload--picture-card"
        style="margin-bottom: 20px;"
        v-show="isShowUpload"
      >
        <i class="el-icon-plus avatar-uploader-icon"></i>
      </div>

      <cropper
        :field="name"
        :headers="headers"
        :height="cropHeight"
        :noCircle="cropHeight !== cropWidth"
        :params="data"
        :url="action"
        :width="cropWidth"
        :withCredentials="withCredentials"
        @crop-success="handleCropSuccess"
        @crop-upload-fail="handleCropUploadError"
        @crop-upload-success="handleCropUploadSuccess"
        @src-file-set="handleSetFileSet"
        class="ele-upload-image--cropper"
        img-format="png"
        ref="cropper"
        v-if="isShowCrop"
        v-model="isShowCrop"
      ></cropper>
    </div>
    <!-- 图片列表 -->
    <ele-gallery
      :class="{ 'ele-disabled': disabled }"
      :lazy="lazy"
      :remove-fn="handleRemove"
      :size="size"
      :sliceSingle="true"
      :source="galleryList"
      :thumbSuffix="thumbSuffix"
      :title="title"
    />
  </div>
</template>

<script>
import Cropper from "vue-image-crop-upload";
import EleGallery from "vue-ele-gallery";

export default {
  name: "EleUploadImage",
  props: {
    // 值
    value: {
      type: [String, Array],
      default() {
        return [];
      },
    },
    // 是否剪裁
    crop: {
      type: Boolean,
      default: false,
    },
    // 图片显示大小
    size: {
      type: Number,
      default: 150,
    },
    // 裁剪高度
    cropHeight: {
      type: Number,
    },
    // 裁剪宽度
    cropWidth: {
      type: Number,
    },
    // 大小限制(MB)，默认3M
    fileSize: {
      type: Number,
      size: 3,
    },
    // 响应处理函数
    responseFn: Function,
    // 文件类型, 例如['png', 'jpg', 'jpeg']
    fileType: {
      type: Array,
      default: () => [],
    },
    // 是否显示上传成功的提示
    isShowSuccessTip: {
      type: Boolean,
      default: false,
    },
    autoUpload: {
      type: Boolean,
      default: true,
    },
    // 缩略图后缀, 例如七牛云缩略图样式 (?imageView2/1/w/20/h/20)
    thumbSuffix: {
      type: String,
      default: "",
    },
    // 是否显示提示
    isShowTip: {
      type: Boolean,
      default: true,
    },
    // 弹窗标题
    title: String,
    // 图片懒加载
    lazy: {
      type: Boolean,
      default: false,
    },
    // 上传地址 (同官网)
    action: {
      type: String,
      required: true,
    },
    // 设置上传的请求头部(同官网)
    headers: {
      type: Object,
      default() {
        return {
          Satoken: this.$store.getters.token,
        };
      },
    },
    // 上传图片个数，默认6张图片
    limit: {
      type: Number,
      default: 6,
    },
    // 是否启用拖拽上传 (同官网)
    drag: {
      type: Boolean,
      default: false,
    },
    // 	支持发送 cookie 凭证信息 (同官网)
    withCredentials: {
      type: Boolean,
      default: false,
    },
    // 是否支持多选文件 (同官网)
    multiple: {
      type: Boolean,
      default: false,
    },
    // 上传时附带的额外参数(同官网)
    data: Object,
    // 上传的文件字段名 (同官网)
    name: {
      type: String,
      default: "file",
    },
    // 覆盖默认的上传行为，可以自定义上传的实现 (同官网)
    httpRequest: Function,
    // 接受上传的文件类型（thumbnail-mode 模式下此参数无效）(同官网)
    accept: String,
    // 删除前的操作
    beforeRemove: Function,
    disabled: {
      type: Boolean,
      default: false,
    },
    // 补充的其它提醒信息
    otherTip: {
      type: String,
      default: "",
    },
    // 返回数据格式，string和array
    returnDataFormat: {
      type: String,
      default: 'array',
    }
  },
  components: {
    Cropper,
    EleGallery,
  },
  data() {
    return {
      cropData: {},
      isShowCrop: false,
      uploading: false,
      fileList: [],  // 上传文件列表，格式为[{ name: '', url: '' }]
      galleryList: [],  // 图片列表，格式为[{ title: '', src: '' }]
    };
  },
  computed: {
    // 是否显示提示
    showTip() {
      return this.isShowTip && (this.fileType.length || this.fileSize);
    },
    computedValues() {
      if (this.value) {
        if (typeof this.value === "string") {
          return [this.value];
        } else {
          return [...this.value];
        }
      } else {
        return [];
      }
    },
    isShowUpload() {
      return this.limit ? this.computedValues.length < this.limit :true;
    },
    successFiles() {
      return this.fileList.filter((file) => file.status === "success");
    },
  },
  watch: {
    isShowCrop(value) {
      if (value === false) {
        this.cropData = {};
      }
    },
    value: {
      handler(val) {
        if (val) {
          // 初始化值为字符串时，转为数组
          if (typeof val === 'string') {
            // 不自动上传时，直接返回base64代码
            if (!this.autoUpload) {
              this.fileList = [ { url: val } ];
              this.galleryList = [ { src: val } ];
            } else {
              // 自动上传时，初始化值是图片地址，逗号分隔
              const valArr = val.split(',');
              // 判断数据格式是否为url
              if (valArr.every(item => item.startsWith('http'))) {
                this.fileList = valArr.map(item => ({
                  name: item.split('/').pop(),
                  url: item,
                }))
                this.galleryList = valArr.map(item => ({
                  title: item.split('/').pop(),
                  src: item,
                }))
              } else {
                console.error('初始化值的图片地址格式错误');
              }
            }
            return;
          }
          // 初始化值为数组时，且长度大于0
          if (Array.isArray(val)) {
            if (val.length) {
              // 判断数据格式是否错误，如果错误，进行提示
              if (!val.every(item => ((item.status && item.status === 'success') || !item.status ? !!item.src : true))) {
                console.error('初始化值数据格式错误，正确数据格式为[{ title: "", src: "" }]');
                return;
              } else {
                this.fileList = val.map(item => ({
                  ...item,
                  name: item.title,
                  url: item.src,
                }));
                this.galleryList = [];
                val.forEach(file => {
                  ((file.status && file.status === 'success') || !file.status)
                  &&
                  this.galleryList.push({
                    title: file.title,
                    src: file.src,
                  })
                })
                return;
              }
            } else {
              this.fileList = [];
              this.galleryList = [];
            }
          }
          // 错误情况，如果初始化值是对象
          if (typeof val === 'object' && !Array.isArray(val)) {
            if (val.title && val.src) {
              this.fileList = [{
                name: val.title,
                url: val.src,
              }];
              this.galleryList = [ val ];
            } else {
              this.fileList = [];
              this.galleryList = [];
              console.error('初始化值数据格式错误，正确数据格式为[{ title: "", src: "" }]');
            }
          }
        } else {
          this.fileList = [];
          this.galleryList = [];
        }
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    handleSetFileSet(fileName, fileType, fileSize) {
      const uid = this.cropData.uid || new Date().getTime();
      this.cropData = {
        name: fileName,
        percentage: 0,
        size: fileSize,
        type: fileType,
        status: "ready",
        uid: uid,
      };
    },
    handleCropSuccess(b64Data) {
      this.cropData.url = b64Data;
    },
    handleCropUploadError(status) {
      this.$message.error(this.$t("common.upload10"));
      this.$emit("error", status);
    },
    handleCropUploadSuccess(response) {
      this.cropData.status = "success";
      this.cropData.percentage = 100;
      this.cropData.response = response;
      const file = Object.assign({}, this.cropData);
      const index = this.fileList.findIndex((item) => item.uid === file.uid);
      if (index > -1) {
        this.fileList.splice(index, 1, file);
      } else {
        this.fileList.push(file);
      }
      this.handleUploadSuccess(response, file, this.fileList);
    },
    // 上传前校检格式和大小
    handleBeforeUpload(file) {
      let isImg = false;
      if (this.fileType.length) {
        let fileExtension = "";
        if (file.name.lastIndexOf(".") > -1) {
          fileExtension = file.name.slice(file.name.lastIndexOf(".") + 1);
        }
        isImg = this.fileType.some((type) => {
          if (file.type.indexOf(type) > -1) return true;
          if (fileExtension && fileExtension.indexOf(type) > -1) return true;
          return false;
        });
      } else {
        isImg = file.type.indexOf("image") > -1;
      }

      if (!isImg) {
        this.$message.error(
          `${this.$t("common.upload4")}${this.fileType.join("/")} ${this.$t(
            "common.upload5"
          )}`
        );
        return false;
      }

      if (this.fileSize) {
        const isLt = file.size / 1024 / 1024 < this.fileSize;
        if (!isLt) {
          this.$message.error(
            `${this.$t("common.upload6")} ${this.fileSize} MB!`
          );
          return false;
        }
      }

      this.uploading = true;
      return true;
    },
    handleChange(file, fileList) {
      const _this = this;
      this.fileList = fileList;
      if (!this.autoUpload) {
        if (this.handleBeforeUpload(file.raw)) {
          let reader = new FileReader();
          reader.readAsDataURL(file.raw);
          reader.onload = function (e) {
            _this.$emit("input", e.target.result);
            this.uploading = false;
          };
        }
      }
    },
    // 文件个数超出
    handleExceed() {
      this.$message.error(
        `${this.$t("common.upload8")} ${this.limit} ${this.$t(
          "common.upload9"
        )}`
      );
    },
    // 上传失败
    handleUploadError(err) {
      this.uploading = false;
      this.$message.error(this.$t("common.upload10"));
      this.$emit("error", err);
    },
    // 上传成功回调
    handleUploadSuccess(response, file, uploadFiles) {
      // 判断是否全部上传成功
      if (uploadFiles.every(item => item.status === "success")) {
        this.uploading = false;
      }
      if (this.isShowSuccessTip) {
        this.$message.success(this.$t("common.upload11"));
      }
      let resResult;
      if (this.responseFn) {
        resResult = this.responseFn(response, file, this.successFiles);
      }
      const fileList = [ ...this.fileList ];
      // 防止重复添加，初次调用时，双向数据绑定上传列表，添加uid，el-upload上传成功对比uid，对比成功才调用成功回调
      // uid必须存在，且不能修改
      uploadFiles.forEach(item => {
        item.raw && (item.raw = JSON.parse(JSON.stringify(item.raw)));
        const index = fileList.findIndex(file => file.uid === item.uid);
        let result = typeof resResult === 'string' ? { url: resResult, src: resResult, } : resResult;
        if (index > -1) {
          // 当前上传的文件已经在列表中，更新文件信息
          // 不是当前上传的文件，且在列表中，不处理
          file.uid === item.uid && (fileList[index] = { ...fileList[index], ...result, uid: item.uid });
        } else {
          // 首次添加
          fileList.push(file.uid === item.uid ? { ...item, ...result, uid: item.uid } : item)
        }
      })
      this.$emit("input", this.returnDataFormat === 'string' ? fileList.map(item => item.src).join(',') : fileList);
      // 上传成功
      this.$emit("success", resResult, this.fileList);
    },
    doRemove(index) {
      if (this.limit === 1) {
        this.$emit("input", this.returnDataFormat === 'string' ? '' : []);
      } else {
        const data = [...this.fileList];
        data.splice(index, 1);
        this.$emit("input", data || []);
      }
    },
    handleRemove(index) {
      if (!this.beforeRemove) {
        this.doRemove(index);
      } else if (typeof this.beforeRemove === "function") {
        const file = this.limit === 1
          ? this.computedValues
          : this.computedValues[index];

        const before = this.beforeRemove(file, this.computedValues);
        if (before && before.then) {
          before.then(
            () => {
              this.doRemove(index);
            },
            () => {}
          );
        } else if (before !== false) {
          this.doRemove(index);
        }
      }
    },
  },
  mounted() {
    // 插入到body中, 避免弹出层被遮盖
    if (this.crop && this.$refs.cropper) {
      document.body.appendChild(this.$refs.cropper.$el);
    }
  },
};
</script>

<style>
.ele-upload-image {
  line-height: 1;
}
.ele-upload-image .el-loading-spinner {
  line-height: 1;
}
.ele-upload-image .el-icon-plus {
  vertical-align: middle;
}
.ele-upload-image .el-upload--picture-card {
  width: auto;
  height: auto;
  background: none;
  line-height: inherit;
}

/* 裁剪 */
.vue-image-crop-upload.ele-upload-image--cropper {
  z-index: 99;
}
.ele-upload-image--cropper .vicp-drop-area {
  background-color: #fbfdff !important;
}
.ele-upload-image--cropper .vicp-icon1-arrow {
  border-bottom-color: #909399 !important;
}
.ele-upload-image--cropper .vicp-icon1-body {
  background-color: #909399 !important;
}
.ele-upload-image--cropper .vicp-icon1-bottom {
  border-color: #909399 !important;
}
.ele-disabled .el-icon-delete {
  display: none;
}
</style>
