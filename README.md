# node-reporter-sonarqube

[![Build and Test](https://github.com/sjinks/node-reporter-sonarqube/actions/workflows/build.yml/badge.svg)](https://github.com/sjinks/node-reporter-sonarqube/actions/workflows/build.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=sjinks_node-reporter-sonarqube&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=sjinks_node-reporter-sonarqube)

A [SonarQube](https://www.sonarsource.com/products/sonarqube/)/[SonarCloud](https://www.sonarsource.com/products/sonarcloud/) [test reporter](https://docs.sonarsource.com/sonarqube/latest/analyzing-source-code/test-coverage/generic-test-data/#generic-test-execution) for the Node.js [Test Runner](https://nodejs.org/api/test.html).

## Installation

```bash
npm i -D node-reporter-sonarqube
```

## Usage

```bash
node --test --test-reporter=node-reporter-sonarqube --test-reporter-destination=test-report.xml
```

Multiple reporters:

```bash
node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=node-reporter-sonarqube --test-reporter-destination=test-report.xml
```

GitHub Actions:

```yaml
# ...
    steps:
      - name: Check out the code
        uses: actions/checkout@v4

      - name: Set up Node.js environment
        uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm

      - name: Install dependencies
        run: npm ci --ignore-scripts
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Run postinstall scripts
        run: npm rebuild && npm run prepare --if-present

      - name: Run tests
        run: node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=node-reporter-sonarqube --test-reporter-destination=test-report.xml
        continue-on-error: true

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@v3
        env:
          GITHUB_TOKEN: ${{ github.token }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.testExecutionReportPaths=test-report.xml
```

[Workflow used by this repository](.github/workflows/sonarscan.yml)

See [Test reporters](https://nodejs.org/api/test.html#test-reporters) for details.
