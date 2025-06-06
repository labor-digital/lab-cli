# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.16.1](https://github.com/labor-digital/lab-cli/compare/v3.16.0...v3.16.1) (2025-05-07)


### Bug Fixes

* we need to make sure to remove the orphan containers upon our new test call ([161ed2c](https://github.com/labor-digital/lab-cli/commit/161ed2c623a42e8c6dd22db106f23d9d91df49a2))

## [3.16.0](https://github.com/labor-digital/lab-cli/compare/v3.15.1...v3.16.0) (2025-05-06)


### Features

* adding a new test command to run our test container ([d4abe06](https://github.com/labor-digital/lab-cli/commit/d4abe06458b28c6d7267d1f880b1e0753c938b8f))

### [3.15.1](https://github.com/labor-digital/lab-cli/compare/v3.15.0...v3.15.1) (2024-12-02)


### Bug Fixes

* refactoring the hostname-retrieval and adding the DEFAULT_OWNER env var to the .env.app from the system ([e8e9a29](https://github.com/labor-digital/lab-cli/commit/e8e9a291cbe7abf4c43d00f8de92099b08605eba))

## [3.15.0](https://github.com/labor-digital/lab-cli/compare/v3.14.2...v3.15.0) (2024-11-29)


### Features

* refactoring the hostname-retrieval and adding the DEFAULT_OWNER env var to the .env.app from the system ([23ed3bb](https://github.com/labor-digital/lab-cli/commit/23ed3bbc26b6910a9e130388a48ade43135d8e44))


### Bug Fixes

* adding nvmrc and updating some packages ([52b194b](https://github.com/labor-digital/lab-cli/commit/52b194bba06514bee3366109f4745b84a2370b26))

### [3.14.2](https://github.com/labor-digital/lab-cli/compare/v3.14.1...v3.14.2) (2024-10-24)


### Bug Fixes

* the lab-cli will now pre-fill DOPPLER_CONFIG, DOPPLER_PROJECT correctly and will also pull DOPPLER_TOKEN from doppler cli automatically ([64325f1](https://github.com/labor-digital/lab-cli/commit/64325f1c655f99dd03a02606f567428d6e54bdab))

### [3.14.1](https://github.com/labor-digital/lab-cli/compare/v3.14.0...v3.14.1) (2024-10-24)


### Bug Fixes

* the lab-cli will now pre-fill DOPPLER_CONFIG, DOPPLER_PROJECT correctly and will also pull DOPPLER_TOKEN from doppler cli automatically ([6097ec0](https://github.com/labor-digital/lab-cli/commit/6097ec0af4ec9a0850e047dcec678420f6bf03b1))

## [3.14.0](https://github.com/labor-digital/lab-cli/compare/v3.13.0...v3.14.0) (2024-10-23)


### Features

* the lab-cli will now pre-fill DOPPLER_CONFIG, DOPPLER_PROJECT correctly and will also pull DOPPLER_TOKEN from doppler cli automatically ([ae2c213](https://github.com/labor-digital/lab-cli/commit/ae2c213161c58c9b9015128835e843cbceca411d))

## [3.13.0](https://github.com/labor-digital/lab-cli/compare/v3.12.1...v3.13.0) (2024-10-22)


### Features

* the lab-cli will now pre-fill DOPPLER_CONFIG, DOPPLER_PROJECT correctly and will also ask for the DOPPLER_TOKEN ([735eee8](https://github.com/labor-digital/lab-cli/commit/735eee8f833c4f4091d1e10979096e77ecf2a799))

### [3.12.1](https://github.com/labor-digital/lab-cli/compare/v3.12.0...v3.12.1) (2024-09-02)

## [3.12.0](https://github.com/labor-digital/lab-cli/compare/v3.11.1...v3.12.0) (2023-12-06)


### Features

* add new base domain ([09ce9b7](https://github.com/labor-digital/lab-cli/commit/09ce9b726dd8fc8a57c50af95a6c5fa5cec0ec60))

### [3.11.1](https://github.com/labor-digital/lab-cli/compare/v3.11.0...v3.11.1) (2023-11-30)

## [3.11.0](https://github.com/labor-digital/lab-cli/compare/v3.10.1...v3.11.0) (2023-11-30)


### Features

* change docker-base-image repository to docker-base-image-v2 ([3280beb](https://github.com/labor-digital/lab-cli/commit/3280bebae9012f1e3cee03d4e7625417ba9ab96a))

### [3.10.1](https://github.com/labor-digital/lab-cli/compare/v3.10.0...v3.10.1) (2021-10-04)


### Bug Fixes

* **init:** ensure mkdirRecursiveSync and rmdirRecursiveSync are imported from the correct directory ([9d0a464](https://github.com/labor-digital/lab-cli/commit/9d0a4642356e1b75cccbf78d716ea1a07daa86ee))

## [3.10.0](https://github.com/labor-digital/lab-cli/compare/v3.9.1...v3.10.0) (2021-08-17)


### Features

* install dockerode types ([8af8177](https://github.com/labor-digital/lab-cli/commit/8af8177450ed5056e9a70787ba64ff325cd17c0e))
* update dependencies ([b8aa7f9](https://github.com/labor-digital/lab-cli/commit/b8aa7f97b04007092c51025bdebf41b9c0a4e45d))


### Bug Fixes

* use new node package of helferlein ([04c53ae](https://github.com/labor-digital/lab-cli/commit/04c53aecfc73882e7492cb9a1b93eb19c1aeb452))
* **DockerCompose:** use new --ansi never flag instead of deprecated --no-ansi when possible ([50b8514](https://github.com/labor-digital/lab-cli/commit/50b8514a8ae82385591b02d9be8a9c83af59c188))

### [3.9.1](https://github.com/labor-digital/lab-cli/compare/v3.9.0...v3.9.1) (2021-05-11)


### Bug Fixes

* only write linux line endings for .env and git files ([035083c](https://github.com/labor-digital/lab-cli/commit/035083c785e0eb368404965882538a778c9f6f1b))

## [3.9.0](https://github.com/labor-digital/lab-cli/compare/v3.8.0...v3.9.0) (2021-04-08)


### Features

* implement installCa command to install our root ca ([6905a32](https://github.com/labor-digital/lab-cli/commit/6905a32ae6e6199c63e9f50a66c063d12cd39af9))

## [3.8.0](https://github.com/labor-digital/lab-cli/compare/v3.7.1...v3.8.0) (2021-04-08)


### Features

* support .env.app and .env.app.template files in a project ([20a3e8f](https://github.com/labor-digital/lab-cli/commit/20a3e8faced13fee6b335a8694b1eb4f5c217b59))


### Bug Fixes

* **DockerApp:** reinitialize app if .env.app changed ([c3c6d4c](https://github.com/labor-digital/lab-cli/commit/c3c6d4cf2b4da17ee06e23ba8c126d056b100e1b))
* **DockerEnv:** remove all whitespaces at the top and bottom of .env files ([ee2c4bd](https://github.com/labor-digital/lab-cli/commit/ee2c4bd8df0aca036ceb7b40655033298704fba2))

### [3.7.1](https://github.com/labor-digital/lab-cli/compare/v3.7.0...v3.7.1) (2021-03-04)


### Bug Fixes

* **DockerComposeOpen:** fix jonas' bug where he did not check if the protocol is undefined!!! ([a056a73](https://github.com/labor-digital/lab-cli/commit/a056a738f480777da524a539b24c5fd6f2b65029))

## [3.7.0](https://github.com/labor-digital/lab-cli/compare/v3.6.0...v3.7.0) (2021-02-23)


### Features

* update dependencies ([c932259](https://github.com/labor-digital/lab-cli/commit/c932259b448f0231e76a6ea1e6a3081c2919fa82))

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
