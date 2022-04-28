# microbs-core

`@microbs.io/core` contains the common libraries used by the microbs CLI and the
microbs plugins.

## Usage

```js
const { config, context, logger, state, utils } = require('@microbs.io/core')
```

### `config`

`config` provides a read-only interface to the microbs configuration file
(config.yaml) and stores its values in memory as a read-only object.

* `config.load(filepath?: string)`
* `config.get(path?: string)`


### `context`

`context` provides information about the microbs execution environment.

* `context.get(key?: string)`


### `logger`

`logger` provides a standardized logger that can serialize objects, colorize
outputs based on log levels, display verbose metadata, and filter outputs by
log levels.

* `logger.debug(message: any)`
* `logger.info(message: any)`
* `logger.warn(message: any)`
* `logger.error(message: any)`


### `state`

`state` provides a read-write interface to the microbs state file (.state)
and stores its values in memory as a read-write object.

* `state.load()`
* `state.get(path?: string)`
* `state.set(path: string, value: string)`
* `state.save()`


### `utils`

`utils` provides commonly used functions to simplify the development of plugins
and help ensure consistent behavior across plugins.

* `utils.configHas(fields: string[])`
* `utils.createEnvFile(obj: string, outPath: string)`
* `utils.exec(command: string, hideStdout: boolean)`
* `utils.expandvars(str: string, values: string[])`
* `utils.flatten(obj: object)`
* `utils.http(opts?: object)` (async)
* `utils.loadFile(filepath: string)`
* `utils.loadJson(filepath: string)`
* `utils.loadTemplate(filepath: string, values: string[])`
* `utils.loadTemplateJson(filepath: string, values: string[])`
* `utils.objToEnv(obj: object)`
* `utils.sleep(ms: number)`
