# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.6.0](https://github.com/labor-digital/lab-cli/compare/v3.5.3...v3.6.0) (2021-02-23)


### Features

* allow to set protocol on lab up ([66e85a5](https://github.com/labor-digital/lab-cli/commit/66e85a5e623dd3db0cc747a6f88c1b91b7afed3e))


### Bug Fixes

* add missing :// to protocol ([3557bfa](https://github.com/labor-digital/lab-cli/commit/3557bfabb8da8254d973cd82192005cb3e3fda9d))

### [3.5.3](https://github.com/labor-digital/lab-cli/compare/v3.5.2...v3.5.3) (2020-12-02)


### Bug Fixes

* **Unison:** fix additionalArgs option ([3947cf7](https://github.com/labor-digital/lab-cli/commit/3947cf763d37e74de83e74ec45f867727a256bac))

### [3.5.2](https://github.com/labor-digital/lab-cli/compare/v3.5.1...v3.5.2) (2020-10-30)


### Bug Fixes

* **Unison:** fix --force option ([336913a](https://github.com/labor-digital/lab-cli/commit/336913a4769350029d8c85b4a8366593eb4c6aa9))

### [3.5.1](https://github.com/labor-digital/lab-cli/compare/v3.5.0...v3.5.1) (2020-09-28)


### Bug Fixes

* **CommandRegistry:** register defaults for platform definition ([6891c9f](https://github.com/labor-digital/lab-cli/commit/6891c9f9e562eebccc867a5a4e0ed79f240a8e53))
* **Docker:** make sure to find the correct docker desktop path after latest docker update ([acebbe4](https://github.com/labor-digital/lab-cli/commit/acebbe492d36ff29869fad8135c6e75af9afd995))
* rename "labor help" to "lab help" ([8bab380](https://github.com/labor-digital/lab-cli/commit/8bab38094cd00d8f84bf8f0c0312644f8c3818ee))

## [3.5.0](https://github.com/labor-digital/lab-cli/compare/v3.4.4...v3.5.0) (2020-09-11)


### Features

* provide mac osx support for most of the commands ([7726ed3](https://github.com/labor-digital/lab-cli/commit/7726ed358ac27d7b6e77f9bd52b5aa578a2bf78b))

### [3.4.4](https://github.com/labor-digital/lab-cli/compare/v3.4.3...v3.4.4) (2020-09-10)


### Bug Fixes

* multiple spaces are not recognized inside project name wizard ([528cc2b](https://github.com/labor-digital/lab-cli/commit/528cc2bd6b39d2f346ed746ba033f7ad56ab35f3))

### [3.4.3](https://github.com/labor-digital/lab-cli/compare/v3.4.2...v3.4.3) (2020-09-03)

### [3.4.2](https://github.com/labor-digital/lab-cli/compare/v3.4.1...v3.4.2) (2020-07-15)


### Bug Fixes

* **DockerAppInit:** fix broken IP calculation ([1e19ce2](https://github.com/labor-digital/lab-cli/commit/1e19ce234edebd90b51feed3bd653ca1d0738c6c))
* **DockerAppInit:** handle hosts file conflicts gracefully with a user prompt ([a3450d0](https://github.com/labor-digital/lab-cli/commit/a3450d06392125c1676a41d0ca72a9f2600a4d72))
* **DockerHosts:** parse directory path's with spaces correctly when reading the hosts file ([0daa5c3](https://github.com/labor-digital/lab-cli/commit/0daa5c3390195cd0a9631d43135c2d5b4f5799e0)), closes [#1](https://github.com/labor-digital/lab-cli/issues/1)
* minor code cleanup ([d92a9af](https://github.com/labor-digital/lab-cli/commit/d92a9af6e3505aa6beb64feaba92a9baacb356de))
* reimplement -v or --version options ([f17b7a0](https://github.com/labor-digital/lab-cli/commit/f17b7a007ee4bbe88b097688e7f3ad202d8b150d)), closes [#2](https://github.com/labor-digital/lab-cli/issues/2)

### [3.4.1](https://github.com/labor-digital/lab-cli/compare/v3.4.0...v3.4.1) (2020-07-15)

## [3.4.0](https://github.com/labor-digital/lab-cli/compare/v3.3.2...v3.4.0) (2020-07-10)


### Features

* implement "init" command ([ef7ae9e](https://github.com/labor-digital/lab-cli/commit/ef7ae9e2c98424e7fd20da947a2812696f6b3197))
* implement new greetings texts ([796da25](https://github.com/labor-digital/lab-cli/commit/796da2596e86c5d51ccd5706be6ecfc465b83571))
* make code PSR-2 compliant ([8ecd3be](https://github.com/labor-digital/lab-cli/commit/8ecd3be189afbb92ccb9be1cda026bab7cd773f2))
* update dependencies ([09ea9e8](https://github.com/labor-digital/lab-cli/commit/09ea9e84e6f14e868fc93293e8a27ef1bcf0318e))


### Bug Fixes

* **Config:** make sure unison runs with owner UID 33 by default ([c7d836e](https://github.com/labor-digital/lab-cli/commit/c7d836e6aa64f0d4e4cd376b8634868c6a0a06fa))
* **DockerAppInit:** make sure we remove underscores from the project name when generating the short name ([52f3bf2](https://github.com/labor-digital/lab-cli/commit/52f3bf251bb013575d8974098375839e39dcd499))
* **DockerEnv:** better handling for .env variables that contain "#" chars that are not comments ([2c5b105](https://github.com/labor-digital/lab-cli/commit/2c5b105486015cfe44fd9d44bfeceaa4bbcde778))

### [3.3.2](https://github.com/labor-digital/lab-cli/compare/v3.3.1...v3.3.2) (2020-05-11)


### Bug Fixes

* **unison:** don't copy perms.set files ([a148585](https://github.com/labor-digital/lab-cli/commit/a14858580dd05ea6d4801709f64a0f2e4728afb9))

### [3.3.1](https://github.com/labor-digital/lab-cli/compare/v3.3.0...v3.3.1) (2020-05-08)


### Bug Fixes

* **importExport:** the app must not be running to import or export the data ([5470069](https://github.com/labor-digital/lab-cli/commit/547006931c5e57ab6510bc5bb0923def96c3ad81))

## [3.3.0](https://github.com/labor-digital/lab-cli/compare/v3.2.1...v3.3.0) (2020-05-08)


### Features

* implement import and export commands ([9702fc2](https://github.com/labor-digital/lab-cli/commit/9702fc22db95088830caa8ae44edd397f0351986))

### [3.2.1](https://github.com/labor-digital/lab-cli/compare/v3.2.0...v3.2.1) (2020-04-20)


### Bug Fixes

* **DockerAppInit:** use a stronger password generator to satisfy mssql server ([7b8c5d7](https://github.com/labor-digital/lab-cli/commit/7b8c5d75b514edef53a763ecffeb3b419d1c11a1))

## [3.2.0](https://github.com/labor-digital/lab-cli/compare/v3.1.2...v3.2.0) (2020-04-13)


### Features

* **down:** add the option to remove the hosts file entry for an app when the "down" command is executed ([98c7b4f](https://github.com/labor-digital/lab-cli/commit/98c7b4fbc7e80be4daf21d31ac1b47beb2df2a79))

### [3.1.2](https://github.com/labor-digital/lab-cli/compare/v3.1.1...v3.1.2) (2020-04-07)


### Bug Fixes

* **DockerEnv:** remove unwanted console log ([6b15101](https://github.com/labor-digital/lab-cli/commit/6b15101e4e2e56d7751c8816249d1b9fce45c400))

### [3.1.1](https://github.com/labor-digital/lab-cli/compare/v3.1.0...v3.1.1) (2020-04-07)


### Bug Fixes

* **FileFinder:** add missing "package.json" when when it's path was resolved ([18c33c8](https://github.com/labor-digital/lab-cli/commit/18c33c8f846ce60a957760e5d36adb79ee23ae80))

## 3.1.0 (2020-04-07)


### Features

* initial public commit ([7c98e90](https://github.com/labor-digital/lab-cli/commit/7c98e90b72c93bc5e14f5b7753c1c61f3404129a))


### Bug Fixes

* fix issues with incorrect import casing ([dd18b0f](https://github.com/labor-digital/lab-cli/commit/dd18b0fa32bbc084ba0b62f3abb89a0a923f5818))
