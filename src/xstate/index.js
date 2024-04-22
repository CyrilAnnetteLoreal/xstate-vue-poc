import { createActor } from 'xstate';

import machine from './machine.js';


const actor = createActor(machine, {
  input: { debug: true }
});

export default actor;