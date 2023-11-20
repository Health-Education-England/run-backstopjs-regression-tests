# HEE BackstopJS docker image

This docker image is a custom implementation of the [BackstopJS](https://github.com/garris/BackstopJS), which is a tool 
used within HEE to handle visual regression testing.

By making use of some custom node scripts, this image enables backstop configuration to be more scalable and easier to maintain,
by scanning your project structure and automatically generating scenarios and requiring no further configuration.

Traditionally new [backstop scenarios](https://github.com/garris/BackstopJS#required-config-properties) need to be added 
to your backstop config manually, but by using this docker image you are able to skip this step entirely.

## Getting started

Using the [HEE frontend prototype project](https://github.com/Health-Education-England/hee-prototypes) as a reference, 
below is how to get started with this docker image.

### Docker compose config

Below is an example `docker-compose.yml` implementation in order to get started using this image as a service:

```yaml
version: '3'
services:
  backstopjs:
    image: ghcr.io/health-education-england/run-backstopjs-regression-tests:main
    volumes:
      - ./tests/backstop:/app/src/backstop
      - ./public:/app/src/public
```

There are two different volumes worth noting:

`./tests/backstop`

This should point to where backstop lives within your codebase. It is used to store backstop data (reference screenshots, 
reports, etc.) and also your base config and scenario plugins (more on this later).

`./public`

This should point to where your project's compiled flat HTML files are located, and will be used to serve your project 
locally in order for backstop to access your site.

### Git ignore rules

Assuming you've used the same `volumes` defined in the `docker-compose.yml` example above, we recommend the following 
`.gitignore` rules:

```
tests/backstop/backstop_data/bitmaps_test/*
tests/backstop/backstop_data/html_report/*
tests/backstop/config/*
!tests/backstop/config/base.json
```

### Base backstop config

Next we need set define a base backstop config file, which is a normal backstop config file with no scenarios defined.

This base config file needs to be stored in the following location, assuming you've used the same `volumes` defined in the 
`docker-compose.yml` example above:

`tests/backstop/config/base.json`:

```json
{
  "id": "backstopjs-regression-tests",
  "asyncCaptureLimit": 5,
  "asyncCompareLimit": 50,
  "debug": false,
  "debugWindow": false,
  "engine": "playwright",
  "engineOptions": {
    "args": [
      "--no-sandbox"
    ]
  },
  "onBeforeScript": "playwright/onBefore.js",
  "onReadyScript": "playwright/onReady.js",
  "paths": {
    "bitmaps_reference": "/app/src/backstop/backstop_data/bitmaps_reference",
    "bitmaps_test": "/app/src/backstop/backstop_data/bitmaps_test",
    "engine_scripts": "/app/engine",
    "html_report": "/app/src/backstop/backstop_data/html_report",
    "ci_report": "/app/src/backstop/backstop_data/ci_report"
  },
  "report": [
    "browser"
  ],
  "viewports": [
    {
      "label": "desktop",
      "width": 1280,
      "height": 720
    },
    {
      "label": "tablet",
      "width": 768,
      "height": 1024
    },
    {
      "label": "mobile",
      "width": 375,
      "height": 667
    }
  ],
  "misMatchThreshold": 0.001,
  "scenarios": []
}

```
This example base config file uses Playwright as the Backstop engine, and also defines three example viewports.

Notice how the `scenarios` property is empty, as our docker image will take care of generating the scenario definitions
automatically.

For more information on configuring backstop please see the [official documentation](https://github.com/garris/BackstopJS#backstopjs).

### Define your first scenario plugin

A scenario plugin is a simple json file which tells backstop where to find all the HTML files you'd like to automatically 
add as backstop scenarios. 

It also allows you to override existing scenarios, or create new variations for existing scenarios if you so wish 
(more on this later).

Plugin files should be placed in:

`tests/backstop/config/scenarios`

Below is an example whereby we are including all our example template files from the [HEE frontend prototype](https://github.com/Health-Education-England/hee-prototypes/blob/master/tests/backstop/scenarios/templates.json).

`tests/backstop/config/scenarios/templates.json`:

```json
{
  "id": "templates",
  "pathPattern": "/app/src/public/templates/examples/*.html"
}
```

The `pathPattern` property points to the location of the compiled HTML files (from inside the container), which you'd like
to automatically include as scenarios.

It's worth noting that you're able to use glob wildcards to include files recursively too, like with this example:

`tests/backstop/config/scenarios/blocks.json`:

```json
{
  "id": "blocks",
  "pathPattern": "/app/src/public/blocks/**/examples/*.html"
}
```

### Create and commit reference screenshots

Now that backstop has been configured we need to capture an initial set of reference screenshots. These screenshots will
be used as backstop's "source of truth" when checking each individual scenario for differences.

Create the reference screenshots by running:

`docker-compose run backstopjs npm run backstop:ref`

The references will be output to: `tests/backstop/backstop_data/bitmaps_reference` and you should now commit these to your codebase
using git.

## Running backstop tests

In order to run backstop use the following command:

`docker-compose run backstopjs npm run backstop:test`

The above command executes `npm run backstop:test` within the `backstopjs` docker container, which accomplishes the 
following:

1. **Generates `backstop.json` config**
2. **Starts up a local webserver serving from the `public` directory via `http://127.0.0.1:8080`**
3. **Runs backstop using generated config**

Once complete an HTML report will be output to the following location:

`tests/backstop/backstop_data/html_report/index.html`

Opening `index.html` in your browser will allow you to view the report and inspect any differences between the reference 
screenshots and the test result screenshots.

## Approving backstop changes

If you are happy that the differences highlighted in the Backstop report are intentional changes, we need to approve the 
changes using this command:

`docker-compose run backstopjs npm run backstop:approve`

This will replace the reference screenshots with the new updated versions, and will then need to be committed via git.

Git will highlight the changes in the reference directory which is located here:

`tests/backstop/backstop_data/bitmaps_reference`

## Customising Backstop scenarios
<a name="backstop-customise"></a>

There may be certain situations where you need to customise the auto-generated scenarios. You can do this either by
amending an existing scenario, or creating a completely new variation of an existing scenario.

### Customising an existing scenario
<a name="backstop-customise-existing"></a>

An example of this might be adding a screenshot delay time, or hiding an iframe.

This can be achieved by adding a new entry to the `overrides` array within a scenario plugin config file.

To customise an existing scenario, ensure the `label` key matches the scenario you wish to customise.

For example, see this custom override adding a screenshot delay to an example Google Maps block component:

```
{
  ...
  "overrides": [
    ...
    {
      "label": "blocks-main-google-map",
      "delay": 5000
    }
    ...
  ]
}
```

The format of the `label` key is the scenario type `id` key in the scenario json file, plus the filename of the template.

Using the above example the `id` is:

`tests/backstop/scenarios/blocks.json`:
```
{
  "id": "blocks"
  ...
}
```

Filename without the file extension within `public/blocks/content/example/main-google-map.html` is `main-google-map`

Therefore, the correct `label` key in the format of `[id_scenario_file][html_filename_no_ext]` is `blocks-main-google-map`

### Creating a variation of an existing scenario.
<a name="backstop-customise-variation"></a>

It is also possible to create a variation of an existing scenario, by creating a custom label and including the `url`
property within the scenario definition.

See this example whereby the desktop menu is being captured after a click interaction, and only using the desktop viewport:

```
{
  "label": "blocks-header-navigation-desktop-submenu-click",
  "clickSelectors": [
    "li.nhsuk-subnav"
  ],
  "url": "http://127.0.0.1:8080/blocks/scaffolding/examples/header-navigation.html",
  "viewports": [
    {
      "label": "desktop",
      "width": 1280,
      "height": 720
    }
  ]
}
```

The `label` key is unique, but is a variation of the original `blocks-header-navigation-desktop-submenu` scenario label.

This will create a new scenario within the Backstop report, while keeping the original intact.

## Debugging 

If you would like to debug any changes made to the base configuration or scenarios without running any tests, you can
regenerate the config by running this command:

`docker-compose run backstopjs npm run backstop:generate-config`

The config properties within this base file, are combined with the auto-generated scenarios, and written to a json file,
resulting in a final backstop config located here:

`tests/backstop/config/backstop.json`

** **NB** ** - please note that this file is ignored by git and is compiled before every test run, so any edits made
directly to this file _**WILL BE OVERWRITTEN!**_.