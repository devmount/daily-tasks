// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Status bar entry to show number of open tasks
let tasksStatusBarItem: vscode.StatusBarItem;

// this method is called when extension is activated
// extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const provider = new TasksViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(TasksViewProvider.viewType, provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('tasks.addTask', () => {
			provider.addTask();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('tasks.clearTasks', () => {
			provider.clearTasks();
		})
	);

	// create a new status bar item that we can now manage
	tasksStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	context.subscriptions.push(tasksStatusBarItem);
}

class TasksViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'tasks.list';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'tasksOpen':
					updateStatusBarItem(data.value);
					break;
			}
		});
	}

	public addTask() {
		if (this._view) {
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.postMessage({ type: 'addTask' });
		}
	}

	public clearTasks() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'clearTasks' });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				
				<title>Daily Tasks</title>
			</head>
			<body>
				<button class="icon-button add-task-button">
					<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
					<span>Add Task</span>
				</button>
				<ul class="task-list"></ul>
				<button class="icon-button clear-tasks-button">
					<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
						<path d="M8 6h12" />
						<path d="M6 12h12" />
						<path d="M4 18h12" />
					</svg>
					<span>Clear Tasks</span>
				</button>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function updateStatusBarItem(n: number): void {
	if (n > 0) {
		tasksStatusBarItem.text = `$(checklist) ${n} TASKS OPEN`;
		tasksStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
		tasksStatusBarItem.show();
	} else {
		tasksStatusBarItem.hide();
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
