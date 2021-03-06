/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import * as fs from 'fs';
const projectRoot = vscode.workspace.rootPath;
const helpersRoot = projectRoot + '/api/helpers';
const helpersPathList = {};
const helpersCompletionList = [];
const toCamel = s => {
	return s.replace(/([-_][a-z])/gi, $1 => {
		return $1
			.toUpperCase()
			.replace('-', '')
			.replace('_', '');
	});
};
fs.readdir(helpersRoot, (err, files: string[]) => {
	files.forEach(file => {
		if (file.indexOf('.js') < 0 && file.indexOf('.') !== 0) {
			fs.readdir(helpersRoot + '/' + file, (err, subFiles: string[]) => {
				subFiles.forEach(subFile => {
					const helperName = file + '.' + subFile;
					const fileName = helperName.split('.js')[0];
					const word = toCamel(fileName)
					const path = helpersRoot+'/'+file+'/'+subFile;
					helpersPathList[toCamel(subFile.split('.js')[0])] = 
					{	
						prefix: toCamel(file),
						path
					};
					helpersCompletionList.push(
						new vscode.CompletionItem(
							word,
							vscode.CompletionItemKind.Method
						)
					);
				});
			});
		} else {
			helpersCompletionList.push(
				new vscode.CompletionItem(
					toCamel(file.split('.js')[0]),
					vscode.CompletionItemKind.Method
				)
			);
		}
	});
});
export function activate(context: vscode.ExtensionContext) {
	let provider1 = vscode.languages.registerCompletionItemProvider('javascript', {
		provideCompletionItems(
			document: vscode.TextDocument,
			position: vscode.Position,
			token: vscode.CancellationToken,
			context: vscode.CompletionContext
		) {
			// a simple completion item which inserts `Hello World!`
			const sails = new vscode.CompletionItem('sails');
			const sailsHooks = new vscode.CompletionItem('sails.hooks');
			const sailsHelpers = new vscode.CompletionItem('sails.helpers');

			// a completion item that inserts its text as snippet,
			// the `insertText`-property is a `SnippetString` which will be
			// honored by the editor.
			const snippetCompletion = new vscode.CompletionItem('Good part of the day');
			snippetCompletion.insertText = new vscode.SnippetString(
				'Good ${1|morning,afternoon,evening|}. It is ${1}, right?'
			);
			snippetCompletion.documentation = new vscode.MarkdownString(
				'Inserts a snippet that lets you select the _appropriate_ part of the day for your greeting.'
			);

			// a completion item that can be accepted by a commit character,
			// the `commitCharacters`-property is set which means that the completion will
			// be inserted and then the character will be typed.
			const commitCharacterCompletion = new vscode.CompletionItem('console');
			commitCharacterCompletion.commitCharacters = ['.'];
			commitCharacterCompletion.documentation = new vscode.MarkdownString(
				'Press `.` to get `console.`'
			);

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

	const provider2 = vscode.languages.registerCompletionItemProvider(
		'javascript',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				// get all text until the `position` and check if it reads `console.`
				// and if so then complete if `log`, `warn`, and `error`
				let linePrefix = document.lineAt(position).text.substr(0, position.character);
				if (!linePrefix.endsWith('sails.helpers.')) {
					return undefined;
				}

				return helpersCompletionList;
			}
		},
		'.' // triggered whenever a '.' is being typed
	);
	const provider3 = vscode.languages.registerDefinitionProvider(
		'javascript',
		{
			provideDefinition(document: vscode.TextDocument, position: vscode.Position) {
				// get all text until the `position` and check if it reads `console.`
				// and if so then complete if `log`, `warn`, and `error`
				const currentWord = document.getWordRangeAtPosition(position);

				const wordStart = currentWord.start.character;
				const wordLength = currentWord.end.character - wordStart;
				const word = document.lineAt(position).text.substr(wordStart, wordLength);
				const helper = helpersPathList[word];
				const prefixLength = 15 + helper.prefix.length;
				const prefixStart = currentWord.start.character-prefixLength;
				let linePrefix = document.lineAt(position).text.substr(prefixStart, prefixLength);
				if (!linePrefix.startsWith('sails.helpers')) {
					return undefined;
				}
				const sampleFile = vscode.Uri.file(helper.path);
				const sampleLocation = new vscode.Location(sampleFile,new vscode.Position(0,0));

				return sampleLocation;
			}
		},
	);

	context.subscriptions.push(provider1, provider2, provider3);
}
