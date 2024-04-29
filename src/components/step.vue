<template>
  <div>
    <!-- <h3>Current module: {{ currentModule.id }}</h3>
    <h3>Current step: {{ currentStep.id }}</h3>
    <p>CURRENT STEP: {{ currentStep }}</p> -->
    <p>
      OUTPUT: {{ output.current }}
      <br />
      INPUT: {{ input.current }}
      <br />
      <span v-if="queries.current.response">API RESULTS : {{ queries.current.response }}</span>
      <!-- <br /> -->
      <!-- <span v-if="Object.keys(queries.current.input).length > 0">QUERY INPUT : {{ queries.current.input }}</span> -->
    </p>
  </div>

  <div v-for="(widget) in currentStep?.widgets" :key="widget.id">
    <Widget :widget="widget" :output="output" :input="input" :queries="queries" :saveValue="saveValue"
      :onError="onError" />
  </div>

  <hr />

  <div>
    <button v-if="currentStep.navigation.previous" v-bind:disabled="!currentStep?.navigation?.previous"
      @click="previous">
      PREVIOUS
    </button>

    &nbsp;
    &nbsp;

    <button v-if="currentStep.navigation.next" v-bind:disabled="!currentStep?.navigation?.next || !canNext"
      @click="next">
      {{ Object.keys(output.current).length === 0 && (currentStep?.widgets ?? []).length > 0 ? 'Skip' : 'Next' }}
    </button>

    &nbsp;
    &nbsp;

    <span v-for="(customRoute, index) in currentStep.navigation.custom" :key="index">
      <button @click="navigate(customRoute.module, customRoute.step)">
        {{ customRoute.title }}
      </button>
    </span>

    <br /><br />

    <button @click="restart">RESTART</button>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import Widget from './widget.vue';

export default {
  name: 'Step',
  props: [
    'actor',
  ],
  components: {
    Widget
  },
  setup: (props) => {
    const router = useRouter()

    const currentModule = ref({});
    const currentStep = ref({});
    
    const output = ref({});
    const input = ref({});

    const queries = ref({});

    const canNext = ref(true);

    props.actor.subscribe({
      next(snapshot) {
        if (snapshot.context.debug) {
          console.log(snapshot.context);
          console.log('############################## \n');
        }
        /* retrieve useful values from the xstate */
        currentModule.value = { ...snapshot.context.routes.current.module };
        currentStep.value = { ...snapshot.context.routes.current.step };
        output.value = { ...snapshot.context.output };
        input.value = { ...snapshot.context.input };
        queries.value = { ...snapshot.context.queries };

        /* Check if the user can click on next based on required step elements */
        canNext.value = (currentStep.value?.widgets ?? [])
          .reduce((acc, cur) => {
            if (!cur.required) return acc;
            return acc && output.value.current[cur.id]?.length > 0;
          }, true);

      },
      error(err) {
        console.error(err);
        props.actor.send({ type: 'ERROR' });
      }
    });
    props.actor.on('NAVIGATION', (e) => {
      const { moduleId, stepId } = e.data;
      router.push(`/step/${moduleId}/${stepId}`);
      window.history.pushState(`${moduleId}/${stepId}`, `Module ${moduleId} - Step ${stepId}`, `/step/${moduleId}/${stepId}`);
    });
    props.actor.send({ type: 'RESTART-STEP', data: props.config }); // restart current step on load to retrieve actor informations

    return {
      currentModule,
      currentStep,
      output,
      input,

      queries,

      canNext,

      navigate:(moduleId, stepId) => props.actor.send({ type: 'NAVIGATE', data: { moduleId, stepId } }),
      next: () => props.actor.send({ type: 'NEXT' }),
      previous: () => props.actor.send({ type: 'PREVIOUS' }),
      restart: () => props.actor.send({ type: 'RESTART' }),
      onError: (e) => {
        console.error('An error occured: ', e);
        props.actor.send({ type: 'ERROR' });
      },
      saveValue: (key, value, options = {}) => props.actor.send({ type: 'SAVE_FORM', data: { [key]: value }, options }),
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;

  ul {
    width: 300px;
    margin: auto;

    li {
      list-style-type: none;
      text-align: left;
    }
  }


}
</style>