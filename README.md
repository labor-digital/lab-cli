# LABOR.digital | LAB-CLI
This toolset is intended to make your everyday work with your docker infrastructure easier. It will also help you to set up your development environment with the tools you need.

Currently, this tool works only on windows but can be easily extended to work on other platforms as well (get in touch).

## Installation
Install this package using npm, to update the script just run the same command again

```
npm install -g @labor-digital/lab-cli
```

## What does it do:
```
Usage: index [options] [command]

Options:
  -h, --help                              display help for command

Commands:
  npm|run <npmRunCommand> [otherArgs...]  works like "npm run" would, but is aware of the current app's directory structure. It also works with period prefix, like: "lab .watch"
  up|start [options]                      starts and restarts the current project composition (docker-compose up)
  stop [options]                          stops the current application (docker-compose stop)
  logs [options]                          displays the tail of your app container's log (docker-compose logs)
  shell|sh [options]                      attaches you to the shell of the current apps master container, or one of the running child containers
  restart                                 performs a hard restart of the current project composition (docker-compose stop && docker-compose up)
  down                                    destroys the current app's containers and removes their images if required (docker-compose down)
  sync [options]                          runs a unison sync into your application. Useful if the volume-mount is to slow!
  open                                    opens the current apps main container in your default browser window
  stop-all                                stops >ALL< currently running container instances
  start-engine                            starts the docker engine, if it is currently not running
  restart-engine                          restarts the docker engine
  status|ps                               checks if the app is currently running or not
  stop-engine [options]                   stops the docker engine, if it is currently running
  import                                  triggers the import process using the LABOR import/export container
  export                                  triggers the export process using the LABOR import/export container
  init                                    initializes a new application stub based on our boilerplate
  help [command]                          display help for command
```

**Good to know:** Every command that has an "[options]" behind it (like "shell" for example) can be used with the "-h" option to show additional help about the possible values. 

## Apps and Projects
The basic concept we use for our projects is to work with "apps". Each app has it's own docker-compose file that defines
the local development environment. 

Each app follows a particular convention that start's with a directory structure:

- C:\\work This is a generic path that defines the root of all your code
- C:\\work\\$customer The name of the client you are working on
- C:\\work\\$customer\\$project The name of the project you are working on (like Website Relaunch, Onlineshop)
- C:\\work\\$customer\\$project\\$appName The name of your app that you are currently working on (like website, shop,...)

This is the main structure, now every app has it's own sub-structure:

- ...\\$appName\\app This is the directory where your docker-compose.yml or package.json lives
- ...\\$appName\\app\\src The main source code of your app that is mounted into your container
- ...\\$appName\\app\\opt Additional scripts to be added to your container (mostly in the /opt directory)
- ...\\$appName\\data This is a directory tha can be mounted as volume to the containers to store persisted data
- ...\\$appName\\import The directory for our [Import/Export container](https://github.com/labor-digital/docker-import-export)
- ...\\$appName\\logs A directory to store apache/nginx logs ect from the container
- ...\\$appName\\ssh An optional directory to store ssh credentials for the container

Those directories are used in our (currently not public - working on it) boilerplates.

By default, each of those apps receives a unique IP and a domain that is mapped to the services using
the docker-compose port mappings. 

## Configuration
You can configure every aspect of the builtin commands using configuration files.
The configuration is compiled based on the following options:

1. Use the default options as a starting point
2. Look in the $HOME directory if there is a lab.config.json. If so, merge it into the config
3. Look in the root directory (where your docker-compose.yml or your package.json lives),
if there is a lab.config.json. If so, merge it into the config
4. Look in the current working directory (CWD). If there is a lab.config.json, merge it into the config.

The default config looks like this:

```javascript
const config = {
 
  // The list of extensions to load
  extensions: [],
  
  // Docker related configuration
  docker: {
    // The shell to use when attaching to a container
    shell: "bash",
    
    // The docker-compose service key to attach to.
    // Can be used to overwrite the default container name set by the docker app
    // NOTE: This overrides "containerName"!
    serviceKey: undefined,
    
    // The name of the container to attach to.
    // Can be used to overwrite the default container name set by the docker app
    // NOTE: This is overwritten by "serviceKey"
    containerName: undefined,
    
    // The local socket to connect with docker
    socketPath: context.platform.choose({
      windows: "//./pipe/docker_engine",
      linux: "/var/run/docker.sock"
    })
  },
  
  // Configuration of the docker network architecture
  network: {
    
    // configuration for the domain creation
    domain: {
      // The base domain for the generated project domains
      base: ".localmachine.space"
    },
    
    // Defines the path of the hosts file on your platform
    hostsFilePath: context.platform.choose({
      windows: "C:\\Windows\\System32\\Drivers\\etc\\hosts",
      linux: "/etc/hosts"
    })
  },
  
  // Unison related configuration options
  unison: {
    
    // Configuration for the sync host
    host: {
      // The local directory to sync with unison
      directory: undefined
    },
    
    // Configuration for the sync target
    target: {
      // The target ip of the unison server
      ip: undefined,
      // The remote unison port to sync with
      port: 5000
    },
    
    // True to include node modules into the sync
    allowNodeModules: false,
    // Additional arguments as a string
    additionalArgs: "",
    
    // Configuration for the unison migration
    migration: {
      targetVolume: "/var/www/html/",
      definition: {
        container_name: "${COMPOSE_PROJECT_NAME}-docker-unison",
        image: "labordigital/unison:2.48.4",
        depends_on: [],
        volumes_from: [],
        environment: [
          "APP_VOLUME=/var/www/html/",
          "OWNER_UID=1000",
          "GROUP_ID=33"
        ],
        ports: []
      }
    },      
    // Project init
    projectInit: {
      // The git repository to clone and find boilerplates in
      boilerplateRepository: 'https://github.com/labor-digital/docker-base-images.git'
    }
  }
};
```

## Initialize a new app
To create your first project with lab cli you can open your command line tool in a new, >empty directory< and simply type "lab init" there.
The script will first ask you for a "name" for your app using a (hopefully) self-explanatory wizard.

After you have provided an app name the script will clone the configured "boilerplateRepository"
and search all boilerplates in it. By default the script uses our [Docker Base Image repository](https://github.com/labor-digital/docker-base-images).

You can now select one of the possible boilerplates using the wizard, which will be prepared and ready to run in the current working directory.

Simply call "lab up" and start coding :)

## Initialize an existing app
When you first start a project using the "up" command or if you changed one of the docker related config files,
the script will automatically check if your .env file is set up correctly.
It first checks if your .env file exists; if not, it will check if you have a .env.template. If the script finds a .env.template file, it will create a copy
called .env. If it fails to find a .env.template, it will create a new, empty .env file.

After the script validated that the .env file exists, it will iterate the variables in the data.
The following variables will be created if they don't exist yet: 
- COMPOSE_PROJECT_NAME: (Shows a wizard) A unique name for your App/Project
- PROJECT_ENV: (default: dev) Defines the environment of the project 
- APP_IP: (default: 127.088.xxx.xxx) Defines the local IP in the 127.088.xxx.xxx range that should be mapped for this app
- APP_DOMAIN: ($COMPOSE_PROJECT_NAME.localmachine.space) Defines a unique domain that will be mapped for this project in your hosts file.
You can use this domain to access your project in the browser.

The following variables will be filled if their key exist and are empty:
- APP_MYSQL_DATABASE: A valid database name like: cli_pro_app_d
- APP_MYSQL_USER: A valid database user name like: cli_pro_app_d
- APP_MYSQL_PASS: A random password
- APP_MYSQL_PORT: 3306
- MYSQL_ROOT_PASSWORD: A random password
- APP_SQL_DATABASE: A valid database name like: cli_pro_app_d
- APP_SQL_PASS: A random password 
- APP_SQL_PORT: 1433
- APP_PROTOCOL: https://

The following directories will automatically filled if their key exist and are empty:
- APP_ROOT_DIR: ...\\$appName\\app
- APP_PARENT_DIR: ...\\$appName
- APP_WORKING_DIR: ...\\$appName\\app\\src
- APP_DATA_DIR: ...\\$appName\\data
- APP_LOG_DIR: ...\\$appName\\logs
- APP_IMPORT_DIR: ...\\$appName\\import
- APP_SSH_DIR: ...\\$appName\\ssh
- APP_OPT_DIR: ...\\$appName\\app\\opt

Note: All variables that are defined like APP_..._DIR: will be seen as directories
and will be created on your hard drive automatically if they don't exist yet.

### Template generation
After the .env file has been filled the .env.template file is generated.
It will strip out all values of the .env file and save an empty version of it as .env.template.
You can safely commit the .env.template to your repository while your .env should be on the ignore list.

If you want to keep certain values of the .env file in your .env.template, define them as comma-separated list as 
"LAB_CLI_KEEP=PROJECT_ENV,APP_SQL_DATABASE...". Those keys will then be kept when the template is generated.

## Sync
Docker volumes have the issue that they are really slow on windows and OSX. 
In bigger projects (like TYPO3) or in projects that depend on inotify events when a file changes
you probably want another solution for your development.
 
The ```sync``` command can be used if you deal with those projects. It utilizes unison under the hood to sync the files from your host machine into your container. 

When your project is not yet set up to work with unison, the ```sync``` command will show you the instructions on how to modify your docker-compose file.

You can configure how unison works using the configuration

## Npm commands
The CLI comes with a special wrapper for npm commands. If your package.json lives either in your root directory
or in your app/src directory, you can simply call ```lab install``` or ```lab i``` to run the npm command but no matter on your current CWD in the shell. You can also run every registered script in your package JSON by prefixing it with a period like: ```lab .build```.

## Postcardware
You're free to use this package, but if you use it regularly, we highly appreciate you sending us a postcard from your hometown, mentioning which of our package(s) you are using.

Our address is: LABOR.digital - Fischtorplatz 21 - 55116 Mainz, Germany.

We publish all received postcards on our [company website](https://labor.digital).
