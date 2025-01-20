<template>
  <ele-upload-image
    :class="desc.class"
    :style="desc.style"
    v-bind="attrs"
    v-model="newValue"
    v-on="onEvents"
  />
</template>

<script>
import EleUploadImage from '../ele-upload-image/EleUploadImage.vue'
import formMixin from '@/components/ele-form/mixins/formMixin'
import uploadMixin from '@/components/ele-form/mixins/uploadMixin'

export default {
  name: 'image-upload',
  mixins: [formMixin, uploadMixin],
  components: {
    EleUploadImage
  },

  data () {
    return {
      defaultAttrs: {
        size: 10
      }
    }
  }
}
</script>
