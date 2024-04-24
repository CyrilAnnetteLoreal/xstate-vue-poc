<template>
  <ul>
    <li v-for="(answer, index) in widget.data.answers" :key="index">
      <input :name="widget.id" type="checkbox" :id="widget.id + '-' + index"
        @click="saveValue(widget.id, answer, { asArray: true })" />
      <label :for="widget.id + '-' + index">{{ answer }}</label>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'Widget',
  props: [
    'widget',
    'saveValue',
  ],
}
</script>