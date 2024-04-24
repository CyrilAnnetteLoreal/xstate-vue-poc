<template>
  {{ queries.current.input }}
</template>

<script>
export default {
  name: 'Recap',
  props: [
    'queries',
  ],
}
</script>