import { setup, emit, fromPromise } from 'xstate';
import * as types from './types/index.js';

const debug = ({ context }, params) => {
  if (!context.debug) return;
  console.log(params);
}

const navigate = ({ context, event }, params) => {
  let { moduleId, stepId } = event?.data ?? {};
  /* params values override event values */
  if (params) {
    moduleId = params.moduleId;
    stepId = params.stepId;
  }

  /* use current step / module if not specified */
  if (!moduleId && stepId) {
    moduleId = context.routes.current.moduleId;
  }
  else if (!stepId && moduleId) {
    stepId = context.config.modules.find(m => m.id === moduleId)?.steps?.[0]?.id; // first module step
  }

  debug({ context }, `- Navigating to route ${moduleId}::${stepId}`);

  if (moduleId) context.routes.current.moduleId = moduleId;
  context.routes.current.module = context.config.modules.find(m => m.id === moduleId);

  if (stepId) context.routes.current.stepId = stepId;
  context.routes.current.step = context.routes.current.module.steps.find(s => s.id === stepId);

  /* Previous destination */
  context.routes.previous = {
    moduleId: context.routes.current.step?.navigation?.previous?.module,
    stepId: context.routes.current.step?.navigation?.previous?.step,
  };

  /* Next destination */
  context.routes.next = {
    moduleId: context.routes.current.step?.navigation?.next?.module,
    stepId: context.routes.current.step?.navigation?.next?.step,
  };

  /* onRestart destination */
  if (context.routes.current.module?.events?.onRestart) {
    context.routes.restart = {
      moduleId: context.routes.current.module?.events?.onRestart?.module,
      stepId: context.routes.current.module?.events?.onRestart?.step,
    };
  }

  /* onError destination */
  if (context.routes.current.module?.events?.onError) {
    context.routes.error = {
      moduleId: context.routes.current.module?.events?.onError?.module,
      stepId: context.routes.current.module?.events?.onError?.step,
    };
  }

  /* Params for the emitter */
  return {
    type: 'NAVIGATION',
    data: {
      moduleId,
      stepId,
    }
  };
}

const readPreviousInput = ({ context }) => {
  const { moduleId, stepId } = context.routes.previous;
  context.input.current = context.output.history
    .find((h) => {
      return h.moduleId === moduleId && h.stepId === stepId;
    })?.data;
};

export default setup({
  actors: {
    callAPIs: fromPromise(async (context) => {
      const { queries, currentInputs } = context.input;
      if (!queries) {
        return null;
      }
      return await Promise.all(
        queries.map((apiConfig) => {
          const payload = (apiConfig?.params ?? [])
            .reduce((acc, cur) => {
              if (typeof cur === 'object') {
                if (!cur.key || !currentInputs?.[cur?.input])
                  return acc;
                return { ...acc, [cur.key]: currentInputs[cur.input] };
              } else {
                if (!currentInputs[cur])
                  return acc;
                return { ...acc, [cur]: currentInputs[cur] }
              }
            }, {});
          const options = {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
          }
          return fetch(apiConfig.url, options)
            .then((response) => response.json())
        })
      );
    }),
  },
  actions: {
    /* Config injection */
    readConfig: emit(({ context, event }) => {
      const { data = {} } = event;
      context.config = data; // inject config into the context
      debug(({ context, event }), '- Configuration loaded');

      const firstModuleId = context.config?.modules?.[0]?.id;
      const firstStepId = context.config.modules?.[0].steps?.[0]?.id;

      return navigate({ context }, {
        moduleId: firstModuleId,
        stepId: firstStepId,
      })
    }),

    /* Navigation */
    navigate: emit(navigate),
    next: emit(({ context }) => {
      return navigate({ context }, {
        moduleId: context.routes.next.moduleId,
        stepId: context.routes.next.stepId,
      })
    }),
    previous: emit(({ context }) => {
      return navigate({ context }, {
        moduleId: context.routes.previous.moduleId,
        stepId: context.routes.previous.stepId,
      })
    }),
    restart: emit(({ context }) => {
      return navigate({ context }, {
        moduleId: context.routes.restart.moduleId,
        stepId: context.routes.restart.stepId,
      })
    }),
    restartStep: emit(({ context }) => {
      return navigate({ context }, {
        moduleId: context.routes.current.moduleId,
        stepId: context.routes.current.stepId,
      })
    }),
    fallback: emit(({ context }) => {
      return navigate({ context }, {
        moduleId: context.routes.error.moduleId,
        stepId: context.routes.error.stepId,
      })
    }),

    /* Input / Output management */
    storeCurrentOutput: ({ context }) => {
      /* remove any existing duplicate in history */
      const existingEntryIndex = context.output.history.findIndex((h) => {
        return h.moduleId === context.routes.current.moduleId
          && h.stepId === context.routes.current.stepId;
      });
      if (existingEntryIndex !== -1) {
        context.output.history.splice(existingEntryIndex, 1);
      }

      /* store the new values in history */
      context.output.history = [...context.output.history, {
        moduleId: context.routes.current.moduleId,
        stepId: context.routes.current.stepId,
        data: context.output.current
      }];
    },
    clearCurrentOutput: ({ context }) => {
      context.output.current = {};
    },
    clearOutputHistory: ({ context }) => {
      context.output.history = [];
    },
    appendCurrentOutput: ({ context, event }) => {
      const { data, options: { asArray = false } } = event;
      Object.keys(data)
        .forEach((key) => {
          const value = data[key];
          if (!asArray) {
            context.output.current[key] = value;
          } else {
            if (!context.output.current[key]) context.output.current[key] = [];
            if (!context.output.current[key].includes(value)) {
              context.output.current[key].push(value);
            }
            else {
              /* Toggle the value off if already exists */
              const indexToRemove = context.output.current[key].indexOf(value);
              context.output.current[key].splice(indexToRemove, 1);
            }
          }
        });
      debug({ context }, `- Storing ${JSON.stringify(data)} into output`);
    },
    readPreviousInput,
    readRequiredInputs: ({ context }) => {
      if (!context.routes.current.step?.inputs) {
        return readPreviousInput({ context }); // if no specific input policy = read the last step's input
      } else {
        context.input.current = context.routes.current.step.inputs
          .reduce((acc, cur) => {
            let {
              module: moduleId,
              step: stepId,
              id: inputId
            } = cur;
            let outputData = context.output.history
              .find((h) => {
                if (!moduleId && stepId) {
                  moduleId = context.routes.current.moduleId
                }
                if (moduleId && stepId)
                  return h.moduleId === moduleId && h.stepId === stepId;
                if (inputId)
                  return h?.data[inputId] !== undefined;
              })?.data;

            if (inputId && outputData?.[inputId])
              outputData = { [inputId]: outputData[inputId] };

            return { ...acc, ...outputData };
          }, {});
      }
    },
    validateInputs: ({ context }) => {
      (context.routes.current.step?.inputs ?? []).forEach((inputConfig) => {
        if (!inputConfig.type) return;

        const validate = types[inputConfig.type];
        const currentInputToValidate = context.input.current[inputConfig?.id];
        console.log({currentInputToValidate})
        if (!currentInputToValidate) return;
        const isValid = validate(currentInputToValidate);
        if (!isValid) {
          console.error(`Invalid input type: ${inputConfig?.id}`);
        }
      });
    },

    /* Queries management */
    storeQueryResponse: ({ context, event }) => {
      /* remove any existing duplicate in history */
      const existingEntryIndex = context.queries.history.findIndex((h) => {
        return h.moduleId === context.routes.current.moduleId
          && h.stepId === context.routes.current.stepId;
      });
      if (existingEntryIndex !== -1) {
        context.queries.history.splice(existingEntryIndex, 1);
      }

      context.queries.current.response = (event.output ?? []).reduce((acc, cur) => ({ ...acc, ...cur }), {}); // merge all response attributes
      context.queries.history = [...context.queries.history, {
        moduleId: context.routes.current.moduleId,
        stepId: context.routes.current.stepId,
        data: context.queries.current.response,
      }];
    },
    readRequiredQueryInput: ({ context }) => {
      context.queries.current.input = (context.routes.current.step?.queries?.inputs ?? [])
        .reduce((acc, cur) => {
          const outputData = context.queries.history
            .find((h) => {
              const { module: moduleId = context.routes.current.moduleId, step: stepId } = cur;
              return h.moduleId === moduleId && h.stepId === stepId;
            })?.data;
          return { ...acc, ...outputData };
        }, {});
    },
  }
})
  .createMachine({
    id: 'flow',
    context: ({ input }) => {
      const { debug = false } = input;
      return {
        debug,
        config: {},
        routes: {
          current: {
            moduleId: 0, module: {},
            stepId: 0, step: {},
          },
          next: {},
          previous: {},
          restart: {},
          error: {},
        },
        input: {
          current: {}
        },
        output: {
          current: {},
          history: [],
        },
        queries: {
          current: {
            response: {},
            input: {},
          },
          history: [],
        },
      }
    },
    initial: 'idle',
    states: {
      idle: {
        on: {
          'INIT': {
            target: 'loading',
            actions: [
              { type: 'readConfig' },
            ]
          }
        }
      },
      loading: {
        invoke: {
          src: 'callAPIs',
          input: ({ context }) => ({
            queries: context.routes.current.step?.queries?.outputs,
            currentInputs: context.input.current,
          }),
          onDone: {
            target: 'ready',
            actions: [
              { type: 'storeQueryResponse' },
              { type: 'readRequiredQueryInput' },
            ],
          },
        }
      },
      ready: {
        // entry: [
        //   ({ context, event }) => {
        //     debug(({ context, event }), '- Experience started');
        //   }
        // ],
        on: {
          'NAVIGATE': {
            target: 'loading',
            actions: [
              { type: 'storeCurrentOutput' },
              { type: 'navigate' },
              { type: 'readRequiredInputs' },
              { type: 'validateInputs' },
              { type: 'clearCurrentOutput' },
            ]
          },
          'NEXT': {
            target: 'loading',
            actions: [
              { type: 'storeCurrentOutput' },
              { type: 'next' },
              { type: 'readRequiredInputs' },
              { type: 'validateInputs' },
              { type: 'clearCurrentOutput' },
            ]
          },
          'PREVIOUS': {
            actions: [
              { type: 'previous' },
              { type: 'readRequiredInputs' },
              { type: 'clearCurrentOutput' },
            ]
          },
          'RESTART': {
            target: 'loading',
            actions: [
              { type: 'restart' },
              { type: 'readRequiredInputs' },
              { type: 'clearCurrentOutput' },
              { type: 'clearOutputHistory' },
            ]
          },
          'RESTART-STEP': {
            target: 'loading',
            actions: [
              { type: 'restartStep' },
              { type: 'readRequiredInputs' },
              { type: 'clearCurrentOutput' },
            ]
          },
          'ERROR': {
            target: 'loading',
            actions: [
              { type: 'fallback' },
              { type: 'clearCurrentOutput' },
              { type: 'clearOutputHistory' },
            ]
          },
          'SAVE_FORM': {
            actions: [{ type: 'appendCurrentOutput' }]
          },
          'COMPLETE': {
            target: 'complete',
            actions: [{ type: 'storeCurrentOutput' }]
          }
        },
      },
      complete: {
        entry: [
          ({ context, event }) => {
            debug(({ context, event }), '- Experience completed');
          }
        ]
      }
    },
  });
