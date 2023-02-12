import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	const provider = new DvdBounceViewProvider(context.extensionUri);

	// command to start DVD Bouncer
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-dvd-bouncer.showInPanel', () => {
			provider.show(context.extensionUri);
			vscode.window.showInformationMessage('Started DVD Bouncer!');
		})
	);

	// register WebviewView
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(DvdBounceViewProvider.viewType, provider)
	);

	// listen to configuration change
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('DvdBouncer.customText')) {
			provider.update();
		}
	}));
}


class DvdBounceViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'dvdBouncerView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public show(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		const panel = vscode.window.createWebviewPanel(
			DvdBounceViewProvider.viewType,
			"DVD Bouncer",
			column || vscode.ViewColumn.One
		);

		panel.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};
		panel.webview.html = this._getHtmlForWebview(panel.webview);
	}

	public update(){
		if (this._view) {
			this._view.webview.html = this._getHtmlForWebview(this._view.webview);
		}
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		token: vscode.CancellationToken,
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
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// media uri
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();
		const displayText = vscode.workspace.getConfiguration('DvdBouncer').get('customText');

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<!--
				Use a content security policy to only allow loading styles from our extension directory,
				and only allow scripts that have a specific nonce.
				(See the 'webview-sample' extension sample for img-src content security policy examples)
			-->
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link href="${styleUri}" rel="stylesheet">
		</head>
		<body>
			<script nonce="${nonce}" src="${scriptUri}"></script>
			<div id="displayText">${displayText}</div>
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

export function deactivate() {}
