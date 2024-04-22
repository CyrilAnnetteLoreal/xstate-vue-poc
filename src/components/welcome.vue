<template>
  <h1>Welcome</h1>

  <nav>
    <button @click="start">Start</button>
  </nav>
</template>

<script>
import { useRouter } from 'vue-router';


export default {
  name: 'Welcome',
  props: [
    'actor',
    'config',
  ],
  setup: (props) => {
    const router = useRouter();
    props.actor.on('NAVIGATION', (e) => {
      const { moduleId, stepId } = e.data;
      router.push(`/step/${moduleId}/${stepId}`); // go to first step page
    });

    return {
      start: () => {
        props.actor.start();
        props.actor.send({ type: 'INIT', data: props.config });
      }
    }
  }
}
</script>

<style></style>