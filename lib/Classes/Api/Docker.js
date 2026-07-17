"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Docker = void 0;
const ForEachHelper_1 = require("../Core/Utils/ForEachHelper");
const chalk_1 = __importDefault(require("chalk"));
const childProcess = __importStar(require("child_process"));
const dockerode_1 = __importDefault(require("dockerode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ElevatedProcess_1 = require("./ElevatedProcess");
const Processes_1 = require("./Processes");
class Docker {
    /**
     * Docker Constructor
     * @param context
     */
    constructor(context) {
        this._context = context;
        this._api = new dockerode_1.default({
            socketPath: context.config.get('docker.socketPath')
        });
    }
    /**
     * Returns true if docker is installed, false if not
     */
    get isInstalled() {
        try {
            return this._context.platform.choose({
                windows: () => {
                    return childProcess.execSync('where docker', { 'stdio': 'pipe' })
                        .toString('utf8').indexOf('docker.exe') !== -1;
                },
                linux: () => {
                    return childProcess.execSync('which docker', { 'stdio': 'pipe' })
                        .toString('utf8').indexOf('docker') !== -1;
                }
            })();
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Returns true if the docker engine is currently running
     */
    get isRunning() {
        try {
            return childProcess.execSync('docker ps', { 'stdio': 'pipe' })
                .toString('utf8').indexOf('CONTAINER ID') === 0;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Will start the docker engine (vm and "Docker for Windows") if it is currently not running.
     */
    startEngine() {
        return new Promise((resolve, reject) => {
            // Start the process
            this._context.platform.choose({
                windows: () => {
                    // Find the docker root path
                    const options = [];
                    (0, ForEachHelper_1.forEach)(['docker', 'docker compose'], function (executable) {
                        const executableParts = childProcess.execSync('WHERE ' + executable, { 'stdio': 'pipe' })
                            .toString('utf8')
                            .split(/\r?\n/);
                        const rootPath = path.dirname(path.dirname(path.dirname(executableParts[0].trim()))) + path.sep;
                        options.push(rootPath + 'Docker Desktop.exe');
                        options.push(rootPath + 'Docker for Windows.exe');
                    });
                    // Check if we can find an executable
                    let executablePath = null;
                    for (let i = 0; i < options.length; i++) {
                        if (!fs.existsSync(options[i]) || !fs.statSync(options[i]).isFile()) {
                            continue;
                        }
                        executablePath = options[i];
                        break;
                    }
                    if ((executablePath === null)) {
                        throw new Error('Could not find a matching docker executable!');
                    }
                    // Prepare command
                    childProcess.exec('start /b "" "' + executablePath + '"', () => {
                    });
                },
                darwin: () => {
                    childProcess.exec('open "/Applications/Docker.app"', () => {
                    });
                },
                linux: () => {
                    const elevator = new ElevatedProcess_1.ElevatedProcess(this._context);
                    try {
                        elevator.exec('/etc/init.d/docker start');
                    }
                    catch (e) {
                        try {
                            elevator.exec('service docker start');
                        }
                        catch (e) {
                            try {
                                elevator.exec('systemctl start docker');
                            }
                            catch (e) {
                                throw new Error('Failed to start docker engine!');
                            }
                        }
                    }
                }
            })();
            // Wait until the process is up and running
            console.log('Waiting until docker engine is started...');
            let interval = 0;
            let timeout = 200;
            interval = setInterval(() => {
                if (--timeout < 0) {
                    clearTimeout(interval);
                    return reject(new Error('Timeout while starting docker engine!'));
                }
                if (!this.isRunning) {
                    return;
                }
                clearInterval(interval);
                console.log(chalk_1.default.greenBright('Docker engine successfully started!'));
                setTimeout(() => {
                    console.log('Stopping all autostarted containers...');
                    this.stopAllContainers().then(() => {
                        resolve();
                    }).catch(reject);
                }, 2000);
            }, 5000);
        });
    }
    /**
     * Stops the docker engine and the hyper-v vm
     * @param force Set true to ignore the current "running" state
     */
    stopEngine(force) {
        return this.timeoutHandler(() => {
            return new Promise((resolve, reject) => {
                this._context.platform.choose({
                    windows: () => {
                        if (force !== true && !this.isRunning) {
                            return resolve();
                        }
                        // Stop the vm and restart the docker service
                        console.log('Stopping VM and docker service...');
                        var commands = [
                            'powershell -command "& {&\'Stop-VM\' MobyLinuxVM -ErrorAction SilentlyContinue}";',
                            'powershell -command "& {&\'Stop-VM\' DockerDesktopVM -ErrorAction SilentlyContinue}";',
                            'powershell -command "& {&\'restart-service\' com.docker.service}";'
                        ];
                        (new ElevatedProcess_1.ElevatedProcess(this._context)).execMultiple(commands);
                        console.log('Stopping docker processes...');
                        Processes_1.Processes.killByFilter('ImageName eq docker*').then(() => resolve()).catch(reject);
                    }
                })();
            });
        }, 60 * 2 * 1000);
    }
    /**
     * Stops the docker engine if it is currently running and starts it again.
     */
    restartEngine() {
        return this.stopEngine().then(() => this.startEngine());
    }
    /**
     * Attaches the cli to the shell of a given container
     * @param containerName The container name of the container to attach to
     * @param shell The name of the shell to attach to
     */
    attachToContainerShell(containerName, shell) {
        return new Promise((resolve, reject) => {
            console.log(chalk_1.default.yellowBright('Attaching to shell of: ' + containerName + ' - To close the shell type "exit" and hit enter.'));
            try {
                const command = 'docker exec -ti ' + containerName + ' ' + shell;
                childProcess.execSync(command, { stdio: 'inherit' });
                resolve();
            }
            catch (e) {
                if (e.status !== 1) {
                    return resolve();
                }
                return reject(e);
            }
        });
    }
    /**
     * Stops all currently running containers
     */
    stopAllContainers() {
        return this.timeoutHandler(() => {
            return this._api.listContainers()
                .then((containers) => {
                const promises = [];
                (0, ForEachHelper_1.forEach)(containers, (container) => {
                    console.log('Stopping container: ' + container.Id + '...');
                    promises.push(this._api.getContainer(container.Id).stop());
                });
                return Promise.all(promises);
            });
        }, 60 * 1000);
    }
    /**
     * Internal helper to call a callback that times out after a given number of milli seconds
     * @param callback The callback to execute
     * @param timeout the timout after which the script fails (milli seconds)
     */
    timeoutHandler(callback, timeout) {
        return new Promise((resolve, reject) => {
            const eventName = 'timeout-' + Math.random() + Math.random();
            const timeoutId = setTimeout(() => {
                reject(new Error('The action took too long and exceeded the timeout: ' + timeout));
                this._context.eventEmitter.unbindAll(eventName);
            }, timeout);
            this._context.eventEmitter.bind(eventName, function () {
                return callback();
            });
            this._context.eventEmitter.emitHook(eventName, {}).then(() => {
                clearTimeout(timeoutId);
                this._context.eventEmitter.unbindAll(eventName);
                resolve();
            }).catch(reject);
        });
    }
}
exports.Docker = Docker;
//# sourceMappingURL=Docker.js.map