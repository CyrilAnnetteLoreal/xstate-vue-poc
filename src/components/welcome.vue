<template>
  <h1>Welcome</h1>

  <p>Import a config file to start</p>
  <JsonFile :onChange="onChange" />

  <br/><br/>
  <nav>
    <button @click="start">Use the defaut configuration</button>
  </nav>
</template>

<script>
import { useRouter } from 'vue-router';

import exampleConfig from '../../public/config.example.json';
import JsonFile from './widgets/jsonFile.vue';

export default {
  name: 'Welcome',
  props: [
    'actor',
  ],
  components: {
    JsonFile
  },
  setup: (props) => {
    const router = useRouter();

    props.actor.start();

    props.actor.on('NAVIGATION', (e) => {
      const { moduleId, stepId } = e.data;
      router.push(`/step/${moduleId}/${stepId}`); // go to first step page
    });

    return {
      start: () => {
        props.actor.send({ type: 'INIT', data: exampleConfig });
      },
      onChange: (json) => {
        console.log({ json });
        props.actor.send({ type: 'INIT', data: json });
      },
    }
  }
}
</script>

<style></style>