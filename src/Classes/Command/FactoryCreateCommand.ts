import chalk from 'chalk';
import {Command} from 'commander';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {AppContext} from '../Core/AppContext';
import {Doppler} from '../Api/Doppler';

export class FactoryCreateCommand
{
    public async execute(...args: any[]): Promise<void>
    {
        // The last argument is always the commander Command object
        const cmd = args[args.length - 1] as Command;
        const context = args[1] as AppContext;

        const projectName = cmd.args[0];
        
        if (!projectName) {
            console.error(chalk.red('Project name is required.'));
            process.exit(1);
        }

        const options = cmd.opts();
        const isJson = options.json === true;
        const isForce = options.force === true;
        const templatePathArg = options.templatePath || '../factory-core/templates';

        const targetDir = path.resolve(process.cwd(), projectName);

        // Verify Doppler CLI is available and authenticated
        const doppler = new Doppler(context);

        if (!doppler.isInstalled()) {
            const msg = 'Doppler CLI is not installed. Please install it first: https://docs.doppler.com/docs/install-cli';
            if (isJson) {
                console.log(JSON.stringify({ status: 'error', message: msg }));
            } else {
                console.error(chalk.red(msg));
            }
            process.exit(1);
        }

        if (!doppler.isLoggedIn) {
            const msg = 'Doppler CLI is not authenticated. Please run: doppler login';
            if (isJson) {
                console.log(JSON.stringify({ status: 'error', message: msg }));
            } else {
                console.error(chalk.red(msg));
            }
            process.exit(1);
        }

        // Handle --force: delete existing Doppler project and target directory
        if (isForce) {
            const hasDir = fs.existsSync(targetDir);
            const hasDoppler = doppler.projectExists(projectName);

            if (hasDir || hasDoppler) {
                if (!isJson) {
                    console.log('');
                    console.log(chalk.bgRed.white.bold('  ⚠  WARNING: --force will destroy existing resources!  '));
                    console.log('');
                    if (hasDir) {
                        console.log(chalk.red(`  → Directory: ${targetDir}`));
                    }
                    if (hasDoppler) {
                        console.log(chalk.red(`  → Doppler project: ${projectName}`));
                    }
                    console.log('');
                    console.log(chalk.yellow('  Proceeding in 10 seconds... Press Ctrl+C to abort.'));
                    console.log('');
                }

                // 10 second countdown to allow abort
                await new Promise(resolve => setTimeout(resolve, 10000));

                if (hasDoppler) {
                    try {
                        doppler.deleteProject(projectName);
                        if (!isJson) {
                            console.log(chalk.yellow(`Deleted Doppler project: ${projectName}`));
                        }
                    } catch (error: any) {
                        const msg = `Failed to delete Doppler project: ${error.message || 'Unknown error'}`;
                        if (isJson) {
                            console.log(JSON.stringify({ status: 'error', message: msg }));
                        } else {
                            console.error(chalk.red(msg));
                        }
                        process.exit(1);
                    }
                }

                if (hasDir) {
                    fs.rmSync(targetDir, { recursive: true, force: true });
                    if (!isJson) {
                        console.log(chalk.yellow(`Deleted directory: ${targetDir}`));
                    }
                }
            }
        } else {
            if (fs.existsSync(targetDir)) {
                if (isJson) {
                    console.log(JSON.stringify({
                        status: 'error',
                        message: `Target directory already exists: ${targetDir}`
                    }));
                } else {
                    console.error(chalk.red(`Error: Target directory already exists at ${targetDir}`));
                }
                process.exit(1);
            }
        }

        // Create Doppler project (default environments dev/stg/prd are created automatically)
        try {
            doppler.createProject(projectName);
        } catch (error: any) {
            const msg = `Failed to create Doppler project: ${error.message || 'Unknown error'}`;
            if (isJson) {
                console.log(JSON.stringify({ status: 'error', message: msg }));
            } else {
                console.error(chalk.red(msg));
            }
            process.exit(1);
        }

        // Seed default secrets into the dev config
        try {
            const secrets: Record<string, string> = {
                'APP_ENCRYPTION_KEY': crypto.randomBytes(48).toString('hex'),
                'APP_INSTALL_TOOL_PASSWORD': '$argon2id$v=19$m=65536,t=4,p=1$SVE3eVUxS1VnUUF5VXQ0bw$jAw8MUNiCjRARsovanN/dFH4OuT8i2pt9hQS250PMAY',
            };

            // Merge --secret overrides (e.g. --secret APP_ENCRYPTION_KEY=abc)
            const secretOverrides: string[] = options.secret || [];
            for (const entry of secretOverrides) {
                const eqIdx = entry.indexOf('=');
                if (eqIdx > 0) {
                    secrets[entry.substring(0, eqIdx)] = entry.substring(eqIdx + 1);
                }
            }

            doppler.setSecrets(projectName, 'dev', secrets);
            if (!isJson) {
                console.log(chalk.green('Doppler dev secrets seeded (APP_ENCRYPTION_KEY, APP_INSTALL_TOOL_PASSWORD).'));
            }
        } catch (error: any) {
            const msg = `Warning: Failed to seed Doppler secrets: ${error.message || 'Unknown error'}`;
            if (!isJson) {
                console.warn(chalk.yellow(msg));
            }
        }

        try {
            // Create directories
            fs.mkdirSync(targetDir, { recursive: true });
            
            const backendAppDir = path.join(targetDir, 'backend', 'app');
            const frontendAppDir = path.join(targetDir, 'frontend', 'app');
            
            fs.mkdirSync(backendAppDir, { recursive: true });
            fs.mkdirSync(frontendAppDir, { recursive: true });

            // Resolve template path
            const resolvedTemplatePath = path.resolve(process.cwd(), templatePathArg);
            const backendTemplateDir = path.join(resolvedTemplatePath, 'backend');
            const frontendTemplateDir = path.join(resolvedTemplatePath, 'frontend');

            // Copy templates
            if (fs.existsSync(backendTemplateDir)) {
                fs.cpSync(backendTemplateDir, backendAppDir, { recursive: true });
            } else if (!isJson) {
                console.warn(chalk.yellow(`Warning: Backend template directory not found at ${backendTemplateDir}`));
            }

            if (fs.existsSync(frontendTemplateDir)) {
                fs.cpSync(frontendTemplateDir, frontendAppDir, { recursive: true });
            } else if (!isJson) {
                console.warn(chalk.yellow(`Warning: Frontend template directory not found at ${frontendTemplateDir}`));
            }

            // Replace placeholders
            this.replacePlaceholders(targetDir, projectName);

            // Initialize Client Config
            const factoryJsonPath = path.join(targetDir, 'factory.json');
            fs.writeFileSync(factoryJsonPath, JSON.stringify({
                core_version: "1.0.0",
                active_components: []
            }, null, 4));

            // Output success
            if (isJson) {
                console.log(JSON.stringify({
                    status: "success",
                    project: projectName,
                    path: targetDir,
                    message: "Factory project scaffolded successfully."
                }));
            } else {
                console.log(chalk.green(`\nSuccess! Factory project "${projectName}" scaffolded successfully at:\n${targetDir}\n`));
            }

        } catch (error: any) {
            if (isJson) {
                console.log(JSON.stringify({
                    status: 'error',
                    message: error.message || 'An error occurred during scaffolding.'
                }));
            } else {
                console.error(chalk.red(`\nError: ${error.message || 'An error occurred during scaffolding.'}\n`));
            }
            process.exit(1);
        }
    }

    private replacePlaceholders(dir: string, projectName: string) {
        const replacements: Record<string, string> = {
            '{{PROJECT_NAME}}': projectName,
            '{{DOPPLER_PROJECT}}': projectName,
            '{{DOPPLER_CONFIG}}': 'dev'
        };
        this.replaceInDir(dir, replacements);
    }

    private replaceInDir(dir: string, replacements: Record<string, string>) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                this.replaceInDir(filePath, replacements);
            } else if (stat.isFile()) {
                try {
                    let content = fs.readFileSync(filePath, 'utf-8');
                    let changed = false;
                    for (const [placeholder, value] of Object.entries(replacements)) {
                        if (content.includes(placeholder)) {
                            content = content.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
                            changed = true;
                        }
                    }
                    if (changed) {
                        fs.writeFileSync(filePath, content, 'utf-8');
                    }
                } catch (e) {
                    // Ignore files that can't be read as utf-8 (e.g. binaries)
                }
            }
        }
    }
}
