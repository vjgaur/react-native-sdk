export const samplePresentationDefinition = {
  presentation_definition: {
    id: 'first simple example',
    input_descriptors: [
      {
        id: 'A specific type of VC',
        name: 'A specific type of VC',
        purpose: 'We want a VC of this type',
        constraints: {
          fields: [
            {
              path: ['$.type'],
              filter: {
                type: 'string',
                pattern: '<the type of VC e.g. degree certificate>',
              },
            },
          ],
        },
      },
    ],
  },
};
