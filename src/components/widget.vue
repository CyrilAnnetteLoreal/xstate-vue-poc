<template>
  <form onsubmit="return false;">
    <h4>{{ widget.title }} <span v-if="widget.required" :style="{ color: 'red' }">*</span></h4>
    <component :is="widgetType" v-bind="$props" />
  </form>
</template>

<script>
import widgetConfig from '../config/widgetConfig';

export default {
  name: 'Widget',
  props: [
    'config',
    'saveValue',
    'onError',
    'output',
    'input',
    'queries',
  ],
  setup: (props) => {
    const widgetType = widgetConfig[props.config.type];

    return {
      widget: props.config,
      widgetType,
    };
  }
}
</script>