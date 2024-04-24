<template>
  <input type="file" :id="widget.id" @change="onFileUpload($event)" />
</template>

<script>
export default {
  name: 'Widget',
  props: [
    'widget',
    'saveValue',
    'onError',
  ],
  setup: (props) => {
    return {
      onFileUpload: (e) => {
        try {
          const blob = e.target.files[0];
          if (blob) {
            var imageObjectURL = window.URL.createObjectURL(blob);
            props.saveValue(props.widget.id, imageObjectURL);
          }
        }
        catch (e) {
          props.onError(e);
        }
      },
    }
  }
}
</script>