import * as fs from 'fs';
import * as path from 'path';

// export { Armor } from "./classes/Armor";
// export { Battle } from "./classes/Battle";
// export { Fighter } from "./classes/Fighter";
// export { Pet } from "./classes/Pet";
// export { Player } from "./classes/Player";
// export { Skill } from "./classes/Skill";
// export { Weapon } from "./classes/Weapon";
// export { TeamBattle } from "./classes/TeamBatle";

const commands = [];
const commandsFoldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsFoldersPath);


// for (const folder of commandFolders) {
    // const commandsPath = path.join(commandsFoldersPath,folder);
    const commandFiles = fs.readdirSync(commandsFoldersPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsFoldersPath, file));
        commands.push(command);
    }
// }

const classes = [];
const classesFoldersPath = path.join(__dirname, 'classes');
const slassesFolders = fs.readdirSync(classesFoldersPath);


// for (const folder of slassesFolders) {
//     const classesPath = path.join(classesFoldersPath,folder);
    const classesFiles = fs.readdirSync(classesFoldersPath).filter(file => file.endsWith('.js'));
    for (const file of classesFiles) {
        const classe = require(path.join(classesFoldersPath, file));
        classes.push(classe);
    }
// }

module.exports = { commands, classes };
