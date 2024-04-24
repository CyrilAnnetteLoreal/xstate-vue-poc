export default {
  modules: [
    {
      id: '1',
      events: {
        onRestart: {
          module: '1',
        },
        onError: {
          module: '1',
        },
      },
      steps: [
        {
          id: '1_1',
          navigation: {
            next: { step: '1_2' },
          },
          widgets: [
            {
              id: 'favorite-color',
              type: 'question',
              title: 'What is your favorite color ?',
              data: {
                answers: [
                  'red',
                  'blue',
                  'green',
                  'yellow',
                ],
              },
            },
            {
              id: 'lotr-vs-sw',
              type: 'question',
              title: 'Lord of the Rings or Star Wars ?',
              data: {
                answers: [
                  'LOTR',
                  'SW',
                ],
              },
            },
          ],
        },
        {
          id: '1_2',
          navigation: {
            next: { module: '2' },
            previous: { step: '1_1' },
          },
          inputs: [
            { step: '1_1' },
          ],
          widgets: [
            {
              id: 'pineaple-on-pizza',
              type: 'question',
              title: 'Pineaple on pizza ?',
              required: true,
              data: {
                answers: [
                  'YES!',
                  'NOOOOOOO',
                ],
              },
            }
          ],
        }
      ]
    },
    {
      id: '2',
      steps: [
        {
          id: '2_1',
          navigation: {
            next: { step: '2_2' },
            previous: { module: '1', step: '1_2' },
          },
          widgets: [
            {
              id: 'whats-best-in-life',
              type: 'multiple-question',
              title: 'Conan! What is best in life ?',
              data: {
                answers: [
                  'The open steppe',
                  'A fleet horse',
                  'Falcons at your wrist',
                  'The wind in your hair',
                  'To crush your enemies',
                  'See them driven before you',
                  'Hear the lamentations of their women'
                ],
              },
            },
          ],
        },
        {
          id: '2_2',
          navigation: {
            previous: { step: '2_1' },
            next: { module: '3', step: '3_1' },
          },
          inputs: [
            { module: '1', step: '1_1' },
            { module: '1', step: '1_2' },
            { module: '2', step: '2_1' },
          ],
          queries: {
            outputs: [
              {
                id: 'test',
                url: 'https://jsonplaceholder.typicode.com/posts', // fake API
                params: [
                  { key: 'pineaple', input: 'pineaple-on-pizza' },
                  'whats-best-in-life',
                ],
              }
            ],
            inputs: [],
          },
        }
      ]
    },
    {
      id: '3',
      steps: [
        {
          id: '3_1',
          navigation: {
            previous: { module: '2', step: '2_2' },
            next: { module: '3', step: '3_2' },
          },
          widgets: [
            {
              id: 'file-test',
              type: 'json-file',
              title: 'Pease upload a file containing some JSON',
            },
            {
              id: 'img-test',
              type: 'img-file',
              title: 'Please upload an image',
            },
          ],
        },
        {
          id: '3_2',
          navigation: {
            previous: { module: '3', step: '3_1' },
          },
          widgets: [
            {
              id: 'recap-test',
              type: 'recap',
              title: 'Queries results recap',
            },
          ],
          queries: {
            inputs: [
              { module: '2', step: '2_2' },
            ]
          }
        },
      ]
    },
  ]
}