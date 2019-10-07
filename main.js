const core = require('@actions/core');
const shell = require('shelljs');
const fs = require('fs');

function run() {
    try {
        const lane = core.getInput('lane', { required: true });
        const optionsInput = core.getInput('options', { required: false });
        const subdirectory = core.getInput('subdirectory', { required: false });

        console.log(`Executing lane ${lane}.`);

        if (subdirectory) {
            if (subdirectory.startsWith("/")) {
                setFailed(new Error("Specified subdirectory path is not relative."));
                return;
            }

            if (fs.existsSync(`${process.cwd()}/${subdirectory}`)) {
                console.log(`Moving to subdirectory ${subdirectory}`);
                shell.cd(subdirectory);
            } else {
                setFailed(new Error(`Specified subdirectory ${subdirectory} does not exist.`));
                return;
            }
        }

        let deserializedOptions;
        if (optionsInput) {
            try {
                deserializedOptions = JSON.parse(optionsInput);
            } catch(e) {
                setFailed(new Error(`Input value "options" cannot be parsed into a JSON object.`));
                return;
            }
        } else {
            deserializedOptions = {};
        }

        let fastlaneOptions = [];
        for (let optionKey in deserializedOptions) {
            if (Object.prototype.hasOwnProperty.call(deserializedOptions, optionKey)) {
                fastlaneOptions.push(`${optionKey}:"${deserializedOptions[optionKey]}"`);
            }
        }

        let fastlaneExecutionResult;
        if (fastlaneOptions.length === 0) {
            fastlaneExecutionResult = shell.exec(`fastlane ${lane}`);
        } else {
            fastlaneExecutionResult = shell.exec(`fastlane ${lane} ${fastlaneOptions.join(" ")}`);
        }

        if (fastlaneExecutionResult.code !== 0) {
            setFailed(new Error(`Executing lane ${lane} failed.`));
        }
    } catch (error) {
        setFailed(error);
    }
}

function setFailed(error) {
    core.error(error);
    core.setFailed(error.message);
}

run();