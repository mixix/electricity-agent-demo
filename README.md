# Household electricity calculator

A static, dependency-free calculator created by an independent Engineer worker for a bounded Engineer/QA experiment.

## Use and test

Double-click `Calculator.html` or `Start calculator.cmd`. This standalone version opens directly in your browser without Node or installation. The original modular site can alternatively be served with `node serve.mjs` when Node is on PATH.

With Node 22 or newer, run `npm test` from this directory. If npm is unavailable, use `node --test tests/*.test.mjs qa/*.test.mjs`. Serve `site/` with any local static HTTP server and open it in a browser. ES modules need HTTP serving rather than opening the HTML directly as a file.

Inputs are appliance watts, daily hours (0–24 inclusive), and euros per kWh. Values must be finite and non-negative; blank fields are rejected. Daily kWh = watts / 1000 × hours. Daily cost = daily kWh × rate. Monthly and annual estimates multiply unrounded daily cost by 30 and 365. Currency is rounded only for display. Example: 1000 W, 2 hours, €0.30/kWh → €18.00 monthly, €219.00 annually. Estimates exclude fixed charges and assume constant power and usage.

## GitHub

Upload the contents of this directory as the repository root. `Tests` runs on pushes, pull requests, or manual dispatch. It uses Node's built-in test runner and requires no package installation or model credentials.

Publishing is a separate manual action: enable Pages with GitHub Actions as its source, then manually run `Publish calculator`. Its verification job must pass before deployment. GitHub must permit Actions and Pages; repository plan/visibility restrictions may apply. The workflow requests Pages write and OIDC permissions only for its deployment job. Configure a required reviewer on the `github-pages` environment if an explicit deployment approval is desired. No deployment is triggered by pushing this project.

Only `site/` is deployed; evidence and agent instructions are not published with the calculator. Relative asset paths support project Pages URLs.

## Evidence

Engineer handoffs live in `evidence/`. The orchestration controller and independent QA worker maintain their own records and acceptance results. The Engineer does not own the QA verdict. No bugs are deliberately planted.

