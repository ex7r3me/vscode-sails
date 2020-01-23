"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const projectRoot = vscode.workspace.rootPath;
const helpersRoot = projectRoot + '/api/helpers';
const helpersList = [];
const toCamel = s => {
    return s.replace(/([-_][a-z])/gi, $1 => {
        return $1
            .toUpperCase()
            .replace('-', '')
            .replace('_', '');
    });
};
fs.readdir(helpersRoot, (err, files) => {
    files.forEach(file => {
        if (file.indexOf('.js') < 0 && file.indexOf('.') !== 0) {
            fs.readdir(helpersRoot + '/' + file, (err, subFiles) => {
                subFiles.forEach(subFile => {
                    const helperName = file + '.' + subFile;
                    helpersList.push(new vscode.CompletionItem(toCamel(helperName.split('.js')[0]), vscode.CompletionItemKind.Method));
                });
            });
        }
        else {
            helpersList.push(new vscode.CompletionItem(toCamel(file.split('.js')[0]), vscode.CompletionItemKind.Method));
        }
    });
});
function activate(context) {
    let provider1 = vscode.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems(document, position, token, context) {
            // a simple completion item which inserts `Hello World!`
            const sails = new vscode.CompletionItem('sails');
            const sailsHooks = new vscode.CompletionItem('sails.hooks');
            const sailsHelpers = new vscode.CompletionItem('sails.helpers');
            // a completion item that inserts its text as snippet,
            // the `insertText`-property is a `SnippetString` which will be
            // honored by the editor.
            const snippetCompletion = new vscode.CompletionItem('Good part of the day');
            snippetCompletion.insertText = new vscode.SnippetString('Good ${1|morning,afternoon,evening|}. It is ${1}, right?');
            snippetCompletion.documentation = new vscode.MarkdownString('Inserts a snippet that lets you select the _appropriate_ part of the day for your greeting.');
            // a completion item that can be accepted by a commit character,
            // the `commitCharacters`-property is set which means that the completion will
            // be inserted and then the character will be typed.
            const commitCharacterCompletion = new vscode.CompletionItem('console');
            commitCharacterCompletion.commitCharacters = ['.'];
            commitCharacterCompletion.documentation = new vscode.MarkdownString('Press `.` to get `console.`');
            // a completion item that retriggers IntelliSense when being accepted,
            // the `command`-property is set which the editor will execute after
            // completion has been inserted. Also, the `insertText` is set so that
            // a space is inserted after `new`
            const commandCompletion = new vscode.CompletionItem('new');
            commandCompletion.kind = vscode.CompletionItemKind.Keyword;
            commandCompletion.insertText = 'new ';
            commandCompletion.command = {
                command: 'editor.action.triggerSuggest',
                title: 'Re-trigger completions...'
            };
            // return all completion items as array
            return [sails, sailsHooks, sailsHelpers, commandCompletion];
        }
    });
    const provider2 = vscode.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems(document, position) {
            // get all text until the `position` and check if it reads `console.`
            // and if so then complete if `log`, `warn`, and `error`
            let linePrefix = document.lineAt(position).text.substr(0, position.character);
            if (!linePrefix.endsWith('sails.helpers.')) {
                return undefined;
            }
            return helpersList;
        }
    }, '.' // triggered whenever a '.' is being typed
    );
    context.subscriptions.push(provider1, provider2);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map