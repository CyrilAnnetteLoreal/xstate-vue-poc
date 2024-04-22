<template>
  <input type="file" :id="widget.id" @change="onFileUpload($event)" />
</template>

<script>
export default {
  name: 'Widget',
  props: [
    'config',
    'saveValue',
    'onError',
  ],
  setup: (props) => {
    return {
      widget: props.config,
      onFileUpload: (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        if (file) {
          reader.addEventListener('load', () => {
            try {
              const { result } = reader;
              const decoded = window.atob(result.split(',')[1]); // decode the base64-encoded string
              const asJSON = JSON.parse(decoded);
              props.saveValue(props.config.id, asJSON);
            }
            catch (e) {
              props.onError(e);
            }
          }, false);
          reader.readAsDataURL(file);
        }
      },
    }
  }
}
</script>