"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectTestCommand = void 0;
const ForEachHelper_1 = require("../Core/Utils/ForEachHelper");
const inquirer_1 = __importDefault(require("inquirer"));
const Bugfixes_1 = require("../Core/Bugfixes");
const DockerApp_1 = require("../Core/DockerApp/DockerApp");
class ProjectTestCommand {
    execute(cmd, context, stack) {
        return (new DockerApp_1.DockerApp(context)).initialize().then(app => {
            // Check if we have a test container
            let hasTestContainer = false;
            (0, ForEachHelper_1.forEach)(app.dockerCompose.getServiceList(), (container) => {
                if (container.key === 'test') {
                    hasTestContainer = true;
                }
            });
            if (!hasTestContainer) {
                return Promise.reject(Error('It seems like your composition does not have an "test" container. Make sure your docker compose override file defines a service with key: "test" which uses the LABOR jest-puppeteer container!'));
            }
            if (!app.dockerCompose.isRunning) {
                return Promise.reject(Error('It seems like your composition is not running. Please make sure to start your composition via "lab up" first.'));
            }
            return this.askForConsent(context).then(execute => {
                if (!execute) {
                    return Promise.resolve();
                }
                return app.dockerCompose.stop()
                    .then(() => {
                    console.log("Writing env var PROJECT_DEV_TEST and restart the project...");
                    app.env.set('PROJECT_DEV_TEST', 'yes');
                    return app.dockerCompose.up();
                })
                    .then(() => {
                    return app.dockerCompose.test(cmd.opts().update === true).catch(() => { });
                })
                    .then(() => {
                    return app.dockerCompose.stop();
                })
                    .then(() => {
                    console.log("Removing env var PROJECT_DEV_TEST again and restart the project...");
                    app.env.set('PROJECT_DEV_TEST', 'no');
                    return app.dockerCompose.up();
                });
            });
        });
    }
    /**
     * Asks the user for consent to stop all containers
     */
    askForConsent(context) {
        return new Promise((resolve) => {
            inquirer_1.default.prompt({
                name: 'ok',
                type: 'confirm',
                message: "Do you have everything in place to run the tests (Assets built, ...)? This will restart the current project. Do you want to proceed?"
            }).then((answers) => {
                Bugfixes_1.Bugfixes.inquirerChildProcessReadLineFix();
                if (!answers.ok) {
                    return resolve(false);
                }
                resolve(true);
            });
        });
    }
}
exports.ProjectTestCommand = ProjectTestCommand;
//# sourceMappingURL=ProjectTestCommand.js.map