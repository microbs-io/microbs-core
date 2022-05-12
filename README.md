# microbs-core

`@microbs.io/core` is a common library used by [`microbs-cli`](https://github.com/microbs-io/microbs-cli)
and microbs plugins. Contributors should use `@microbs.io/core` for things such
as logging, configuration management, command execution, and HTTP requests to
ensure a consistent experience in microbs.

## Usage

You can import all the core modules as follows:

```js
const { config, context, logger, rollout, state, utils } = require('@microbs.io/core')
```

Or you can limit your imports only to the modules you need. For example, if you
only need access to `config` and `logger`, then you can use:

```js
const { config, logger } = require('@microbs.io/core')
```

## Reference

* [`config`](#config)
* [`context`](#context)
* [`logger`](#logger)
* [`rollout`](#rollout)
* [`state`](#state)
* [`utils`](#utils)


### <a name="config"></a>`config`

`config` provides a read-only interface to the microbs configuration file
(`config.yaml`) and stores its values in memory as a read-only object.

#### <a name="config.load"></a>`config.load(filepath?: string)`

Load, parse, and persist in memory the microbs config file, which is located by
`filepath`. By default, `filepath` is `$CWD/config.yaml`, where `$CWD` is the
current directory of the user running the microbs CLI. If the file doesn't exist,
then the default `filepath` is `$HOME/.microbs/config.yaml`. Usually plugins
don't need to run `config.load()` except during tests, because the microbs CLI
will load the config file before it loads the plugins and store the filepath at
`context.get('path.config')`.

#### <a name="config.get"></a>`config.get(path?: string)`

Get a value from the config object by its key path in the object. Because the
config file can be nested, you can retrieve the values of nested keys by using
dot notation. For example, given the following configuration in config.yaml...

```yaml
deployment:
  plugins:
    observability: grafana-cloud
```

...you can use `config.get('deployment.plugins.observability')` to retrieve the
value of the observability plugin, which the function would return as
`'grafana-cloud'`.


### <a name="context"></a>`context`

`context` provides information about the microbs execution environment. Values
can be added to the context object, but they cannot be removed or changed once
they are added.

The microbs CLI sets the following context variables:

* `command` - The command that the user ran from the microbs CLI (e.g. `setup`)
* `args` - The arguments that the user supplied with `command` (e.g. `--kubernetes --log-level debug`)
* `path.cli` - Absolute path to the directory of the microbs CLI
* `path.user` - Absolute path to the current working directory of the user running the microbs CLI
* `path.config` - Absolute path to the config file (`config.yaml`) used to store deployment inputs
* `path.state` - Absolute path to the state file (`state.yaml`) used to store post-deployment details
* `path.env` - Absolute path to the .env file (`.env`) used by `microbs-secrets`
* `path.app` - Absolute path to the installation directory of the application named in `deployment.app`
* `path.plugin.kubernetes` - Absolute path to the installation directory of the plugin in `deployment.plugins.kubernetes`
* `path.plugin.observability` - Absolute path to the installation directory of the plugin in `deployment.plugins.observability`
* `path.plugin.alerts` - Absolute path to the installation directory of the plugin in `deployment.plugins.alerts`

#### <a name="context.get"></a>`context.get(key?: string)`

Get a value from the context object by its key path in the object. You can
retrieve the values of nested keys by using dot notation just like in
[`config.get()`](#config.get).

#### <a name="context.set"></a>`context.set(key?: string)`

Set a value in the context object by its key path in the object. You can set
the values of nested keys by using dot notation just like in
[`config.get()`](#config.get).


### <a name="logger"></a>`logger`

`logger` provides a standardized logger that can serialize objects, colorize
outputs based on log levels, display verbose metadata, and filter outputs by
log levels. Objects are serialized to JSON.

#### <a name="logger.debug"></a>`logger.debug(message: any)`

Write a log message that will appear only when `--log-level` is set to a value
that is greater than or equal to `debug`.

#### <a name="logger.info"></a>`logger.info(message: any)`

Write a log message that will appear only when `--log-level` is set to a value
that is greater than or equal to `info`.

#### <a name="logger.warn"></a>`logger.warn(message: any)`

Write a log message that will appear only when `--log-level` is set to a value
that is greater than or equal to `warn`.

#### <a name="logger.error"></a>`logger.error(message: any)`

Write a log message that will appear only when `--log-level` is set to a value
that is equal to `error`.


### <a name="rollout"></a>`rollout`

`rollout` rolls out a skaffold profile to the deployed Kubernetes cluster.

#### <a name="rollout.run()">rollout.run(opts: object)</a>

Roll out a skaffold profile to the deployed Kubernetes cluster.

What happens when this function is called:

1. `microbs-secrets` is deleted (using `kubectl delete secret`)
2. The state file is saved and overwritten (using [`state.save()`](#state.save))
3. The .env file is saved and overwritten (using [`utils.objToEnv()`](@utils.objToEnv))
4. `microbs-secrets` is deployed using the new .env file (using `kubectl create secret`)
5. The skaffold profile is deployed with `skaffold run`

`rollout.run()` can be controlled with an `opts` object:

* `opts.action` - Can be `"run"` or `"delete"` to invoke either `skaffold run` or `skaffold delete` (Default: `"run"`)
* `opts.profile` - Which skaffold profile to invoke from `skaffold.yaml` (Default: `"main"`)
* `opts.skaffoldFilepath` - Path to the `skaffold.yaml` file to use (Default: )


### <a name="state"></a>`state`

`state` provides a read-write interface to the microbs state file (`state.yaml`)
and stores its values in memory as a read-write object.

#### <a name="state.load"></a> `state.load(filepath?: string)`

Load, parse, and persist in memory the microbs state file, which is located by
`filepath`. By default, `filepath` is `$CWD/state.yaml`, where `$CWD` is the
current directory of the user running the microbs CLI. If the file doesn't exist,
then the default `filepath` is `$HOME/.microbs/confstateig.yaml`. Usually plugins
don't need to run `state.load()` except during tests, because the microbs CLI
will load the state file before it loads the plugins and store the filepath at
`context.get('path.state')`.

#### <a name="state.get"></a> `state.get(path?: string)`

Get a value from the state object by its key path in the object. You can
retrieve the values of nested keys by using dot notation just like in
[`config.get()`](#config.get).

#### <a name="state.set"></a> `state.set(path: string, value: string)`

Set a value from the state object by its key path in the object. You can
set the values of nested keys by using dot notation just like in
[`config.get()`](#config.get). Note that this will not persist to the state file
until you call [`state.save()`](#state.save)

#### <a name="state.save"></a> `state.save(filepath: string)`

Save the entire contents of the state object to the state file, optionally
located by its `filepath`. Usually plugins don't need to set `filepath` except
during tests, because the microbs CLI will locate the state file and store the
filepath at `context.get('path.state')`.


### <a name="utils"></a>`utils`

`utils` provides commonly used functions to simplify the development of plugins
and help ensure consistent behavior across plugins. The most commonly used
functions for plugins include:

* [`utils.http()`](#utils.http) - Submit an HTTP request
* [`utils.exec()`](#utils.exec) - Execute a synchronous command.
* [`utils.sanitize()`](#utils.sanitize) - Escape an input for safe usage in [`utils.exec()`](#utils.exec)
* [`utils.loadFile()`](#utils.loadFile) - Load the contents of file
* [`utils.loadJson()`](#utils.loadJson) - Load and parse the contents of a JSON file

#### <a name="utils.exec"></a> `utils.exec(command: string, hideStdout: boolean)`

Execute a synchronous command. The command will be logged if `--log-level` is
set to `debug`. Setting `hideStdout` to `true` lets you capture the contents
of `stdout` and `stderr`, which is recommended in most cases.

Returns a `result` object with the following properties:

* `result.code` - The exit code of the process
* `result.stdout` - The contents of stdout
* `result.stderr` - The contents of stderr if present
* `result.err` - The error object if an exception was thrown

Note: You should use [`utils.sanitize()`](#utils.sanitize) to escape potentially
unsafe characters from any inputs that you pass to the `command`. If your
`command` concatenates or interpolates other variables, those variables should
be escaped with [`utils.sanitize()`](#utils.sanitize).

Example usage:

```js
const { utils } = require('@microbs.io/core')
const result = utils.exec('echo "hello world"', true)
//result = { code: 0, stdout: 'hello world\n' }
```

#### <a name="utils.expandvars"></a> `utils.expandvars(str: string, values: object)`

Given a string (`str`) substitute the environment variables with an object of
values (`values`).

Example usage:

```js
const { utils } = require('@microbs.io/core')
const result = utils.expandvars('FOO=${BAR}', { BAR: 'BAZ' })
// result = 'FOO=BAZ'
```

#### <a name="utils.flatten">`utils.flatten(obj: object)`</a>

Convert a nested object to a flattened object. This function is not intended to
be used directly by plugins, but it can be used to test and understand the
behavior of the function. The microbs CLI uses this function when creating the
`.env` file for `microbs-secrets`, normalizing the nested contents of the
`config.yaml` and `state.yaml` files into a flat structure used for `.env`.

Example usage:

```js
const { utils } = require('@microbs.io/core')
const output = utils.flatten({
  'a': {
    'b': {
      'c.d': 'foo'
    }
  }
})
// output = { 'a.b.c.d': 'foo' }
```

#### <a name="utils.http"></a> `utils.http(opts?: object)` (async)

Submit an asynchronous HTTP request. `utils.http()` is a lightweight wrapper
around `axios.request()` that includes debugging logging for the request and
response when `--log-level` is set to `debug`.

Example usage:

```js
const { utils } = require('@microbs.io/core')
const result = await utils.http({
  method: 'get',
  url: 'https://microbs.io/'
})
```

#### <a name="utils.loadFile"></a> `utils.loadFile(filepath: string)`

Read the contents of a file located by its `filepath`.

#### <a name="utils.loadJson"></a> `utils.loadJson(filepath: string)`

Read and parse the contents of a JSON-formatted file located by its `filepath`.

#### <a name="utils.loadTemplate"></a> `utils.loadTemplate(filepath: string, values: object)`

Read the contents of a file located by its `filepath` and substitute any 
environment variables. [`utils.expandvars()`](#utils.expandvars) is what
performs the environment variable substitution.

#### <a name="utils.loadTemplateJson"></a> `utils.loadTemplateJson(filepath: string, values: object)`

Read and parse the contents of a JSON-formatted file located by its `filepath`
and substitute any  environment variables. [`utils.expandvars()`](#utils.expandvars)
is what performs the environment variable substitution.

#### <a name="utils.objToEnv"></a> `utils.objToEnv(obj: object)`

Serialize the contents of object to environment variable syntax suitable to be
saved as an `.env` file. Field names are flattened and uppercased, and dots are
replaced with underscores. This function is not intended to be used directly by
plugins, but it can be used to test and understand the behavior of the function.

Example usage:

```js
const { utils } = require('@microbs.io/core')
const output = utils.objToEnv({
  foo: {
    bar.baz: 'hello world'
  }
})
// output = 'FOO_BAR_BAZ=hello world'
```

#### <a name="utils.sanitize"></a> `utils.sanitize(value: string)`

Escape potentially unsafe characters in a string (`value`) so that the value can
be used safely as an input to [`utils.exec()`](#utils.exec).

Example usage:

```js
const { utils } = require('@microbs.io/core')
const output = utils.sanitize('foo;bar')
// output = 'foo\\;bar'
```

#### <a name="utils.sleep"></a> `utils.sleep(ms: number)`

Pause the execution of the current process by `ms` number of milliseconds.

Example usage:

```js
const { utils } = require('@microbs.io/core')
utils.sleep(1000) // Wait for 1 second
```
