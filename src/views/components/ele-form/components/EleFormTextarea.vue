<template>
  <el-input
    :class="desc.class"
    :style="desc.style"
    type="textarea"
    v-bind="attrs"
    v-model="newValue"
    v-on="onEvents"
  >
    <!-- 组件内部插槽 -->
    <template v-for="(render, key) of slots" v-slot:[key]>
      <extend-slot :key="key" :render="render" />
    </template>
  </el-input>
</template>

<script>
import formMixin from '@/components/ele-form/mixins/formMixin'

export default {
  name: 'EleFormTextarea',
  mixins: [formMixin],
  data () {
    return {
      mockRule: '@cparagraph',
      type: ['String', 'Number']
    }
  },
  computed: {
    defaultAttrs () {
      return {
        autosize: { minRows: 6 },
        placeholder: this.t('ele-form.input') + this.desc._label,
        // 设置默认最大长度为500，且显示字数统计
        maxlength: 500,
        'show-word-limit': true
      }
    }
  }
}
</script>
