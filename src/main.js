import { createApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import actor from './xstate/index.js';
import config from './xstate/config.js';

import App from './App.vue'
import Welcome from './components/welcome.vue'
import Step from './components/step.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: Welcome,
      props: { actor, config }
    },
    {
      path: '/step/:moduleid/:stepid',
      component: Step,
      props: { actor }
    },
  ]
});

createApp(App)
  .use(router)
  .mount('#app')
