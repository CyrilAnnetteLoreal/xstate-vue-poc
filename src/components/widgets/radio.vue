<template>
  <ul>
    <li v-for="(answer, index) in widget.data.answers" :key="index">
      <input name="widget.id" type="radio" :id="widget.id + '-' + index" @click="saveValue(widget.id, answer)" />
      <label :for="widget.id + '-' + index">{{ answer }}</label>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'Widget',
  props: [
    'config',
    'saveValue',
  ],
  setup: (props) => {
    return {
      widget: props.config,
    }
  }
}
</script>