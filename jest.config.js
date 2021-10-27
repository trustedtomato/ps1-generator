export default {
  roots: ['src'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.[jt]s?(x)',
    // Does not work due to https://github.com/mihar-22/svelte-jester/issues/72
    // 'src/**/*.svelte'
  ], 
  transform: {
    '^.+\\.svelte$': [
      'svelte-jester',
      { preprocess: './svelte.config.test.js' }
    ],
    '^.+\\.[tj]s$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'ts', 'svelte'],
}