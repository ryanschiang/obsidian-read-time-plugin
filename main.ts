import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	Menu,
} from "obsidian";

interface ReadTimePluginSettings {
	wpm: number;
}

const DEFAULT_SETTINGS: ReadTimePluginSettings = {
	wpm: 130,
};

export default class MyPlugin extends Plugin {
	settings: ReadTimePluginSettings;
	timeToRead: string = "0m 0s read time";
	statusBar: HTMLElement;

	async onload() {
		await this.loadSettings();

		this.statusBar = this.addStatusBarItem();
		this.updateStatusBar();

		this.registerInterval(
			window.setInterval(() => {
				const editor =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (editor) {
					const selection = editor.editor.getSelection();
					let words = selection.split(" ").length;

					// If no selection, use the whole document
					if (!selection.trim()) {
						words = editor.editor.getValue().split(" ").length;
					}

					// Calculate read time
					const wpm = this.settings.wpm;
					const minutes = words / wpm;

					const minutesDisplay = Math.floor(minutes);
					const seconds = Math.floor((minutes - minutesDisplay) * 60);
					const time = `${minutesDisplay}m ${seconds}s read time`;
					this.timeToRead = time;
				}
				this.updateStatusBar();
			}, 500)
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MySettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	updateStatusBar() {
		this.statusBar.setText(this.timeToRead);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class MySettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Settings for Words-to-Read-Time Plugin.",
		});

		new Setting(containerEl)
			.setName("Reading Speed")
			.setDesc(
				"Words per minute (wpm)\nSlow: 100\nAverage: 130\nFast: 160"
			)
			.addExtraButton((button) =>
				button
					.setTooltip("Reset to default")
					.setIcon("reset")
					.onClick(async () => {
						this.plugin.settings.wpm = DEFAULT_SETTINGS.wpm;
						this.display();
						await this.plugin.saveSettings();
					})
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.wpm.toString())
					.setPlaceholder("Words per minute")
					.onChange(async (value) => {
						const num = parseInt(value);
						if (isNaN(num)) {
							new Notice("Please enter a number");
							return;
						}
						if (num < 0) {
							new Notice("Please enter a positive number");
							return;
						}

						this.plugin.settings.wpm = num;
						await this.plugin.saveSettings();
					})
			);
	}
}
