<template>
  {{ queries.current.input }}
</template>

<script>
export default {
  name: 'Recap',
  props: [
    'widget',
    'queries',
  ],
}
</script>