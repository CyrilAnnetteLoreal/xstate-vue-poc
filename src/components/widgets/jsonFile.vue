<template>
  <input type="file" @change="onFileUpload($event)" />
</template>

<script>
export default {
  name: 'Widget',
  props: [
    'widget',
    'saveValue',
    'onError',
    'onChange'
  ],
  setup: (props) => {
    return {
      onFileUpload: (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        if (file) {
          reader.addEventListener('load', () => {
            try {
              const { result } = reader;
              const decoded = window.atob(result.split(',')[1]); // decode the base64-encoded string
              const asJSON = JSON.parse(decoded);
              if (props.onChange) {
                props.onChange(asJSON);
              }
              else {
                props.saveValue(props.widget.id, asJSON);
              }
            }
            catch (e) {
              if (props.onError)
                props.onError(e);
              else
                console.log(e);
            }
          }, false);
          reader.readAsDataURL(file);
        }
      },
    }
  }
}
</script>