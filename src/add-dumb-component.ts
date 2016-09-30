import { window, workspace, TextEditor } from 'vscode';
import { IFiles } from './file';
import * as fs from 'fs';
import * as path from 'path';
import * as Q from 'q';

export class AddDumbComponent {

  constructor() { }

  public showFileNameDialog(args): Q.Promise<string> {
    const deferred: Q.Deferred<string> = Q.defer<string>();

    let clickedFolderPath: string;
    if (args) {
      clickedFolderPath = args.fsPath
    }
    else {
      if (!window.activeTextEditor) {
        deferred.reject('Please open a file first.. or just right-click on a file/folder and use the context menu!');
        return deferred.promise;
      } else {
        clickedFolderPath = path.dirname(window.activeTextEditor.document.fileName);
      }
    }
    let newFolderPath: string = fs.lstatSync(clickedFolderPath).isDirectory() ? clickedFolderPath : path.dirname(clickedFolderPath);

    if (workspace.rootPath === undefined) {
      deferred.reject('Please open a project first. Thanks! :-)');
    }
    else {
      window.showInputBox({
        prompt: 'What\'s the name of the new folder?',
        value: 'folder'
      }).then(
        (fileName) => {
          if (!fileName || /[~`!#$%\^&*+=\[\]\\';,/{}|\\":<>\?\s]/g.test(fileName)) {
            deferred.reject('That\'s not a valid name! (no whitespaces or special characters)');
          } else {
            deferred.resolve(path.join(newFolderPath, fileName));
          }
        },
        (error) => console.error(error)
      );
    }
    return deferred.promise;
  }

  // Create the new folder
  public createFolder(folderName): Q.Promise<string> {
    const deferred: Q.Deferred<string> = Q.defer<string>();

    fs.exists(folderName, (exists) => {
      if (!exists) {
        fs.mkdirSync(folderName);
        deferred.resolve(folderName);
      } else {
        deferred.reject('Folder already exists');
      }
    });
    return deferred.promise;
  }

  // Get file contents and create the new files in the folder 
  public createFiles(folderName: string): Q.Promise<string> {
    const deferred: Q.Deferred<string> = Q.defer<string>();
    let inputName: string = path.parse(folderName).name;

    // create an IFiles array including file names and contents
    let files: IFiles[] = [
      {
        name: path.join(folderName, `${inputName}.component.ts`),
        content: this.componentContent(inputName, false)
      },
      {
        name: path.join(folderName, `${inputName}.component.spec.ts`),
        content: this.specContent(inputName)
      }
    ];

    // write files
    this.writeFiles(files).then((errors) => {
      if (errors.length > 0) {
        window.showErrorMessage(`${errors.length} file(s) could not be created. I'm sorry :-(`);
      }
      else {
        deferred.resolve(folderName);
      }
    });

    return deferred.promise;
  }

  public writeFiles(files: IFiles[]): Q.Promise<string[]> {
    const deferred: Q.Deferred<string[]> = Q.defer<string[]>();
    let errors: string[] = [];
    files.forEach(file => {
      fs.writeFile(file.name, file.content, (err) => {
        if (err) { errors.push(err.message) }
        deferred.resolve(errors);
      });
    });
    return deferred.promise;
  }

  // Open the created component in the editor
  public openFileInEditor(folderName): Q.Promise<TextEditor> {
    const deferred: Q.Deferred<TextEditor> = Q.defer<TextEditor>();
    let inputName: string = path.parse(folderName).name;;
    let fullFilePath: string = path.join(folderName, `${inputName}.component.ts`);

    workspace.openTextDocument(fullFilePath).then((textDocument) => {
      if (!textDocument) { return; }
      window.showTextDocument(textDocument).then((editor) => {
        if (!editor) { return; }
        deferred.resolve(editor);
      });
    });

    return deferred.promise;
  }

  private camelCase(input: string): string {
    return input.replace(/-([a-z])/ig, function (all, letter) {
      return letter.toUpperCase();
    });
  }

  public componentContent(inputName: string, template: boolean, ...options: Array<string>): string {
    let inputUpperCase: string;
    inputUpperCase = inputName.charAt(0).toUpperCase() + inputName.slice(1);
    inputUpperCase = this.camelCase(inputUpperCase);

    let componentContent: string = 
      "import { Component, " + options + "} from '@angular/core';\n" +
      "\n" +
      "@Component({\n" +
      "\tselector: 'app-" + inputName + "',\n" +
      ((template) ? "\ttemplateUrl: '" + inputName + ".component.html'\n" : "\ttemplate: ``\n") +
      "})\n" +
      "\n" +
      "export class " + inputUpperCase + "Component {\n" +
      "\n" +
      "\t\n" +
      "}";

    return componentContent;
  }

  public specContent(inputName: string): string {
    let inputUpperCase: string;
    inputUpperCase = inputName.charAt(0).toUpperCase() + inputName.slice(1);
    inputUpperCase = this.camelCase(inputUpperCase);

    let specContent: string = 
      "import { TestBed, inject } from '@angular/core/testing';\n\n" +
      "import { " + inputUpperCase + "Component } from './" + inputName + ".component';\n" +
      "\n" +
      "describe('a " + inputName + " component', () => {\n" +
      "\tlet component: " + inputUpperCase + "Component;\n" +
      "\n" +
      "\t// register all needed dependencies\n" +
      "\tbeforeEach(() => {\n" +
      "\t\tTestBed.configureTestingModule({\n" +
      "\t\t\tproviders: [\n" +
      "\t\t\t\t" + inputUpperCase + "Component\n" +
      "\t\t\t]\n" +
      "\t\t});\n" +
      "\t});\n" +
      "\n" +
      "\t// instantiation through framework injection\n" +
      "\tbeforeEach(inject([" + inputUpperCase + "Component], (" + inputUpperCase + "Component) => {\n" +
      "\t\tcomponent = " + inputUpperCase + "Component;\n" +
      "\t}));\n" +
      "\n" +
      "\tit('should have an instance', () => {\n" +
      "\t\texpect(component).toBeDefined();\n" +
      "\t});\n" +
      "});";
    return specContent;
  }
}