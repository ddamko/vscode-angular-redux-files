'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AddDumbComponent } from './add-dumb-component';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "angular-redux-files" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let addDumbCompnent = vscode.commands.registerCommand('extension.addDumbCompnent', (args) => {
    const addFiles: AddDumbComponent = new AddDumbComponent();
    addFiles.showFileNameDialog(args)
      .then(addFiles.createFolder)
      .then(addFiles.createFiles)
      .then(addFiles.openFileInEditor)
      .catch((err) => {
        if (err) {
          vscode.window.showErrorMessage(err);
        }
      });
  });

  context.subscriptions.push(addDumbCompnent);
}

// this method is called when your extension is deactivated
export function deactivate() {
}