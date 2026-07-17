# LABOR.digital | LAB-CLI

`lab` is a command line tool that makes your everyday work with a docker based development
environment easier. It wraps `docker compose`, wires up per-app domains, IPs and hosts-file
entries, manages your `.env` files and Doppler secrets, and gives you a set of convenience
commands to start, inspect and tear down your applications.

It runs on **macOS, Linux and Windows** (a few commands are currently Windows-only — see the
platform notes in the [command reference](#command-reference)).

---

## Table of contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Getting help](#getting-help) — including machine-readable output for scripts & AI agents
- [Command reference](#command-reference)
- [Concept: apps & projects](#concept-apps--projects)
- [Environment files (`.env` / `.env.template`)](#environment-files-env--envtemplate)
- [Git worktrees (new in 4.0.0)](#git-worktrees-new-in-400)
- [Configuration](#configuration)
- [File sync (unison)](#file-sync-unison)
- [Troubleshooting](#troubleshooting)
- [Postcardware](#postcardware)

---

## Requirements

- **Node.js 22+** — the CLI is installed and run with node/npm.
- **Docker** with the **`docker compose` plugin v2.29 or newer** and a running docker engine.
  On macOS/Windows this is Docker Desktop; on Linux the docker daemon.
- **Doppler CLI** — *only* required for apps that use Doppler-managed secrets
  (`DOPPLER_*` variables in their `.env`). Apps without Doppler do not need it.
- **git** — required for `lab init` and for the git-worktree isolation described below.

## Installation

Install the package globally with npm. To update, run the exact same command again:

```bash
npm install -g @labor-digital/lab-cli
```

Verify the installation:

```bash
lab --version
```

## Quick start

```bash
# 1. create a new app from a boilerplate in an empty directory
mkdir my-app && cd my-app
lab init

# 2. start it (creates .env, domain, IP and hosts entry on first run)
lab up

# 3. see whether it is running / read its logs / open a shell
lab status
lab logs -f
lab shell

# 4. open it in the browser, then stop it again
lab open
lab stop
```

## Getting help

`lab help` prints a **grouped overview of every command** that is available on your platform,
together with the prerequisites and a short explanation of the git-worktree behavior. It is the
fastest way to get oriented if you have never used the CLI before:

```bash
lab help
```

For **scripts and AI agents**, the same information is available as JSON. This lists every
command with its aliases, options and supported platforms, without having to scrape formatted
text:

```bash
lab help --json
```

You can also get detailed help (including all options) for a single command with the standard
`-h` / `--help` flag:

```bash
lab up --help
```

---

## Command reference

Unless noted otherwise, every command is run from inside your app directory (the directory that
contains your `docker-compose.yml` / `docker-compose.dev.yml`, or a parent of it — see
[apps & projects](#concept-apps--projects)).

> **Platform support.** Every command runs on macOS, Linux and Windows, except `sync`
> (macOS + Windows only) and the `up --separateWindow` flag (Windows only).

> **Non-interactive / AI-agent use.** Commands that would otherwise prompt for confirmation
> accept **`-y, --yes`** to proceed with the defaults without asking: `up`, `restart`, `down`,
> `stop-all`, `test`, `import`, `export`, `open`. Run **`lab unlock`** once (see below) so the
> privileged setup (macOS loopback alias, hosts-file write) stops prompting for a `sudo`
> password too. Combine with `lab help --json` for a machine-readable command overview.
> (Doppler-based apps still need a pre-authenticated Doppler CLI.)

### Run & inspect your app

#### `up` (alias `start`)
Starts and (re)creates the current project composition — the equivalent of `docker compose up`.
On the very first run (or whenever a docker/env file changes) it also initializes the app: it
creates the `.env` file, allocates a domain + IP and writes the hosts-file entry.

Options:
- `-f, --follow` — follow the container output like `docker compose up` (no `-d`).
- `-p, --pull` — pull the newest image versions before starting.
- `-y, --yes` — accept all defaults without prompting (create directories, pick the default service, …).
- `-i, --import` — trigger the import process (database / user creation) during startup.
- `--domain <domain>` — override the app domain (run an isolated instance, e.g. in CI or a worktree).
- `--ip <ip>` — override the app loopback ip (run an isolated instance, e.g. in CI or a worktree).
- `-w, --separateWindow` — _Windows only_ — open the docker process in a new window.

```bash
lab up             # start in the background
lab up -f          # start and follow the logs
lab up -p -y       # pull latest images and accept all defaults
```

#### `restart`
Performs a hard restart (`docker compose stop && docker compose up`) of the current composition.
- `-y, --yes` — accept all defaults without prompting.

#### `stop`
Stops the current application (`docker compose stop`).
- `-f, --force` — force-kill the application instead of gracefully stopping it.

#### `down`
Destroys the current app's containers and removes their images if required (`docker compose down`).
- `-y, --yes` — proceed non-interactively (destroy the app; keep the hosts entry).

#### `status` (alias `ps`)
Checks whether the app is currently running.

```bash
lab status
```

#### `logs`
Displays the tail of the app container's log (`docker compose logs`).
- `-l, --lines <lines>` — number of lines to show from the end of each log (default `15`; use `all` for the full log).
- `-f, --follow` — follow the log output.

```bash
lab logs                 # last 15 lines
lab logs -l all          # the whole log
lab logs -f              # follow
```

#### `shell` (alias `sh`)
Attaches you to the shell of the app's master container (or a running child container).
- `--shell <shell>` — the shell to attach to (default from config, usually `bash`).
- `-s, --select` — show a prompt to choose which container to attach to.

```bash
lab shell
lab sh --shell sh -s
```

#### `open`
Opens the app's main container in your default browser.
- `-p, --protocol <protocol>` — the protocol to use (default `https`).
- `-y, --yes` — if the app isn't running, start it automatically (non-interactively) and then open it.

#### `sync`  _(macOS + Windows only)_
Runs a [unison](#file-sync-unison) sync into your application. Useful when the bind-mount is too
slow (large projects, inotify-heavy tooling).
- `--force` — run without existing archives (helps recover from a previous mess-up).

### Docker engine

#### `start-engine`
Starts the docker engine if it is not already running.

#### `stop-engine`
Stops the docker engine if it is running.
- `--force` — ignore the current "running" state of the engine.

#### `restart-engine`
Restarts the docker engine.

#### `stop-all`
Stops **all** currently running containers (not just the current app's).
- `-y, --yes` — proceed non-interactively (skip the confirmation).

### Project setup & data

#### `init`
Initializes a new application stub from a boilerplate. Run it in a new, empty directory.
- `-n, --name <name>` — the project name (e.g. `customer-project-app`).
- `-b, --boilerplate <boilerplate>` — the boilerplate to use.
- `-f, --force` — initialize even if the directory is not empty (**deletes existing files**).

```bash
lab init
lab init --name "my-project-name" --boilerplate "PHP 8.4" --force
```

The command clones the configured `boilerplateRepository`
([Docker Base Images](https://github.com/labor-digital/docker-base-images-v2) by default),
lets you pick a boilerplate, prepares it in the current directory and initializes a fresh git
repository. Then just run `lab up`.

#### `import`
Triggers the import process using the
[LABOR import/export container](https://github.com/labor-digital/docker-import-export).
- `-c, --copyFromTest` — copy import data from the test-data directory first (**overwrites existing files**).
- `-y, --yes` — proceed non-interactively (skip the confirmation).

#### `export`
Triggers the export process using the LABOR import/export container.
- `-c, --copyToTest` — copy the exported files into the test-data directory if it exists (**overwrites existing files**).
- `-y, --yes` — proceed non-interactively (skip the confirmation).

#### `test`
Runs the test process using the LABOR jest-puppeteer container.
- `-u, --update` — run `test-update` instead of `test` (usually updates reference snapshots).
- `-y, --yes` — proceed non-interactively (skip the confirmation).

#### `installCa`
Installs our root CA ([`@labor-digital/ssl-certs`](https://www.npmjs.com/package/@labor-digital/ssl-certs))
as a trusted SSL root certificate, so the generated `https` domains are trusted by your browser.

### Utilities

#### `npm` (alias `run`)
Works like `npm run`, but is aware of your app's directory structure regardless of your current
working directory (it finds the `package.json` in the app root or `app/src`). Also supports a
period-prefix shorthand for scripts.

```bash
lab npm install
lab run build
lab .watch          # shorthand for "lab run watch"
```

#### `unlock` / `lock`  _(macOS + Linux)_
`lab unlock` grants lab **passwordless `sudo` for only its own privileged setup** — the macOS
loopback alias and the hosts-file write — so the CLI can run non-interactively (CI, AI agents,
terminals where nobody can type a password). You are asked for your password **once**.

How it works: it installs a small **root-owned** helper (`/usr/local/lib/lab-cli/lab-elevate.sh`)
that performs only those two validated actions, and a `visudo`-validated
`/etc/sudoers.d/lab-cli` rule granting `NOPASSWD` for **only that helper** — not blanket root.

```bash
lab unlock     # one password prompt; afterwards `lab up` never prompts for sudo
lab lock       # reverts it (removes the sudoers rule + helper)
```

On **Windows** lab uses a UAC prompt that can't be pre-authorized this way; run your terminal
“as Administrator” to avoid repeated prompts.

#### `help`
Shows the grouped overview of all commands (see [Getting help](#getting-help)).
- `--json` — output the overview as JSON for scripts and AI agents.

#### Built-in flags
- `-v, --version` — print the installed version.
- `-h, --help` — print commander's usage for the CLI or a single command.

---

## Concept: apps & projects

The core concept is an **"app"**. Each app has its own docker compose file describing its local
development environment, and follows a directory convention:

```
<work>/<customer>/<project>/<appName>/
├── app/            # docker-compose.yml or package.json lives here (the "root directory")
│   ├── src/        # your source code, mounted into the container
│   └── opt/        # extra scripts added to the container (usually /opt)
├── data/           # persisted data, mounted as a volume
├── import/         # working dir for the import/export container
├── logs/           # apache/nginx/... logs from the container
└── ssh/            # optional ssh credentials for the container
```

`lab` discovers the **root directory** by walking up from your current directory until it finds a
`docker-compose.dev.yml`, `docker-compose.yml`, `package.json` or `lab.config.json`. Every command
then operates relative to that root.

By default each app receives a **unique IP** and a **domain** that is mapped to its services via
docker compose port mappings and written to your hosts file.

## Environment files (`.env` / `.env.template`)

When you first `lab up` an app (or after you change a docker-related config file), `lab` makes sure
your `.env` file is set up correctly. If there is no `.env`, it is created from `.env.template`
(or as an empty file). Then the following variables are generated if missing:

- `COMPOSE_PROJECT_NAME` — a unique name for your app (a wizard asks for it on first run).
- `PROJECT_ENV` — the project environment (default `dev`).
- `APP_IP` — a unique local IP (in the `127.088.x.x` range) mapped for this app.
- `APP_DOMAIN` — a unique domain (`<short-name>.labor.systems` by default) written to your hosts
  file so you can open the app in the browser.

These are filled **only if their key already exists and is empty** (so a boilerplate decides which
of them an app uses):

- `APP_MYSQL_DATABASE`, `APP_MYSQL_USER`, `APP_MYSQL_PASS`, `APP_MYSQL_PORT`
- `MYSQL_ROOT_PASSWORD`, `APP_SQL_DATABASE`, `APP_SQL_PASS`, `APP_SQL_PORT`
- `APP_PROTOCOL`
- `DOPPLER_PROJECT`, `DOPPLER_CONFIG`, `DOPPLER_TOKEN` (for Doppler-based apps)

And these directory variables are filled and **created on disk** if missing:
`APP_ROOT_DIR`, `APP_PARENT_DIR`, `APP_WORKING_DIR`, `APP_DATA_DIR`, `APP_LOG_DIR`,
`APP_IMPORT_DIR`, `APP_SSH_DIR`, `APP_OPT_DIR`.

### Template generation & `LAB_CLI_KEEP`

After the `.env` file is filled, a `.env.template` is generated with all values **stripped out**.
Commit `.env.template` to your repository and keep `.env` on the ignore list.

To keep specific values in the template, list them in the `.env` as a comma-separated
`LAB_CLI_KEEP=PROJECT_ENV,APP_SQL_DATABASE,...`. Those keys keep their value when the template is
regenerated.

## Git worktrees (new in 4.0.0)

`lab` is **git-worktree aware**. When you run it from inside a
[linked git worktree](https://git-scm.com/docs/git-worktree), the app is given its **own isolated
identity** so it can run **side by side with your main checkout** without clashing — perfect for
spinning up a feature branch next to `main`.

Concretely, inside a worktree `lab` resolves an isolated identity **at runtime** and injects it into
docker compose / the hosts file / the loopback alias — it does **not** rewrite your `.env`:

- suffixes `COMPOSE_PROJECT_NAME` with the worktree directory name (e.g. `my-project` →
  `my-project-featurex`), so all **containers, networks and volumes** are separate;
- derives a separate **`APP_DOMAIN`** and allocates a separate, stable **`APP_IP`** (so the host
  **port bind doesn't collide** with the main app) and writes its own **hosts-file entry** (kept in
  sync with that ip on every `lab up`);
- repoints the app's **directory bind-mounts** (`APP_ROOT_DIR`, `APP_WORKING_DIR`, `APP_OPT_DIR`,
  data/logs/…) at the **worktree's own paths**, so the container serves the **worktree's code**, not
  the main checkout's;
- **keeps `DOPPLER_PROJECT` pointed at the main project**, so the worktree shares its secrets with
  the main checkout;
- leaves your **`.env` and `.env.template` untouched** — this works even when `.env` is committed or
  read-only, and your worktree stays clean in `git status`.

Because the identity is a runtime overlay (not written to `.env`), it works regardless of whether
`.env` is git-ignored or committed. Your **main checkout is completely unaffected**: detection is
based on git's `--git-dir` vs `--git-common-dir`, and if git is unavailable or you are in the main
working tree, behavior is exactly as before. You can also set the identity explicitly with
`lab up --domain <domain> --ip <ip>` (handy in CI).

### Example

```bash
# from your main checkout (e.g. .../my-project/app running as "my-project" on 127.88.0.4:443)
git worktree add ../my-project-featurex featurex
cd ../my-project-featurex/app

lab up            # comes up as "my-project-featurex" with its OWN domain + ip (e.g. 127.88.0.5) + containers
lab status        # operates on the isolated worktree instance
```

Both apps run at the same time, each on its own IP/port and reachable under its own domain — no
manual `.env` editing required.

## Configuration

Every aspect of the built-in commands can be configured with `lab.config.json` files. The config is
merged from the following sources (**later sources override earlier ones**):

1. the built-in default config;
2. `~/lab.config.json` (your home directory);
3. `<root>/lab.config.json` (the app root directory);
4. `<root>/../lab.config.json` (the app's parent directory);
5. `<cwd>/lab.config.json` (the current working directory, if different from the root).

Persistent state is stored in `~/lab.registry.json` (per-app data such as the allocated IP counter
and the selected default service) and global settings in `~/lab.config.json`.

The default config:

```javascript
const config = {

    // The list of extensions to load
    extensions: [],

    // Docker related configuration
    docker: {
        // The shell to use when attaching to a container
        shell: "bash",

        // The docker compose service key to attach to.
        // Overwrites the default container name set by the docker app.
        // NOTE: This overrides "containerName"!
        serviceKey: undefined,

        // The name of the container to attach to.
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
            base: ".labor.systems"
        },

        // Defines the path of the hosts file on your platform
        hostsFilePath: context.platform.choose({
            windows: "C:\\Windows\\System32\\Drivers\\etc\\hosts",
            linux: "/etc/hosts"
        })
    },

    // Unison related configuration options
    unison: {
        host: { directory: undefined },
        target: { ip: undefined, port: 5000 },
        allowNodeModules: false,
        additionalArgs: "",
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
        projectInit: {
            // The git repository to clone and find boilerplates in
            boilerplateRepository: 'https://github.com/labor-digital/docker-base-images-v2.git'
        }
    }
};
```

## File sync (unison)

Docker bind-mounts can be slow on macOS and Windows. For big projects (e.g. TYPO3) or projects that
rely on inotify events, use the [`sync`](#sync-macos--windows-only) command. It uses
[unison](https://github.com/bcpierce00/unison) under the hood to sync files from your host into the
container. If your project is not yet set up for unison, `lab sync` prints the instructions to
adjust your docker compose file. Configure it under the `unison` config key.

## Troubleshooting

- **Docker engine is not running** — run `lab start-engine`, or start Docker Desktop / the docker
  daemon manually.
- **`docker compose` not found / too old** — make sure the compose plugin v2.29+ is installed
  (`docker compose version`).
- **Hosts-file conflict** — if a domain is already mapped in your hosts file, `lab` asks whether to
  overwrite the entry. Fix the hosts file if you decline.
- **Doppler token expired / missing secrets** — for Doppler-based apps, `lab up` regenerates the
  service token; make sure you are logged in with the Doppler CLI. In a git worktree the Doppler
  project is intentionally shared with the main checkout.
- **The SSL certificate is not trusted** — run `lab installCa` once to trust the LABOR root CA.

## Postcardware

You're free to use this package, but if you use it regularly, we highly appreciate you sending us a
postcard from your hometown, mentioning which of our package(s) you are using.

Our address is: LABOR.digital - Fischtorplatz 21 - 55116 Mainz, Germany.

We publish all received postcards on our [company website](https://labor.digital).
