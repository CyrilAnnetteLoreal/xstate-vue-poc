<template>
    {{ queries.current.input }}
</template>

<script>
export default {
    name: 'Recap',
    props: [
        'config',
        'queries',
    ],
    setup: (props) => {
        return {
            widget: props.config,
        }
    }
}
</script>