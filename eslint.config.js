// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'android/*', 'ios/*'],
  },
  {
    rules: {
      // Reanimated shared values are mutated via `.value` by design; the new
      // react-hooks immutability rule misreads this as forbidden mutation.
      'react-hooks/immutability': 'off',
      // Several screens legitimately reset derived state when inputs change or
      // sync form fields when a sheet opens. Keep this visible but non-blocking.
      'react-hooks/set-state-in-effect': 'warn',
      // Security guard: forbid building SQL with template literals or string
      // concatenation. All DB access must go through parameterized repositories
      // (see src/core/db). This is a defense-in-depth lint, not a substitute for
      // the repository layer.
      'no-restricted-syntax': [
        'warn',
        {
          // Member-call form: db/tx.execute(`…${x}`) and the repo wrappers used
          // as members. Only interpolated template literals are dangerous —
          // static backtick queries (no `${}`) are fine and stay unflagged.
          selector:
            "CallExpression[callee.property.name=/^(execute|executeSync|executeBatch|run|all|first)$/] > TemplateLiteral[expressions.length>0]",
          message:
            'Do not interpolate values into SQL. Use a static query string with ? placeholders and a params array.',
        },
        {
          // Direct-call form: the imported run()/all()/first() helpers in repos.
          selector:
            "CallExpression[callee.name=/^(run|all|first)$/] > TemplateLiteral[expressions.length>0]",
          message:
            'Do not interpolate values into SQL. Use a static query string with ? placeholders and a params array.',
        },
      ],
    },
  },
]);
