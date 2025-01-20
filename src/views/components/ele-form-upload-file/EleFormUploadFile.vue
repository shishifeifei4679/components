<template>
  <ele-upload-file
    :class="desc.class"
    :style="desc.style"
    class="ele-form-upload-file"
    v-bind="attrs"
    v-model="newValue"
    v-on="onEvents"
  />
</template>

<script>
import EleUploadFile from "../ele-upload-file/EleUploadFile.vue";
import formMixin from "@/components/ele-form/mixins/formMixin";
import uploadMixin from "@/components/ele-form/mixins/uploadMixin";

export default {
  name: "EleFormUploadFile",
  mixins: [formMixin, uploadMixin],
  components: {
    EleUploadFile,
  },
};
</script>

<style>
.ele-form-upload-file .el-upload__tip {
  line-height: 1.5;
}

.ele-form-upload-file .el-upload-list__item:first-child {
  margin-top: 5px;
}
</style>
