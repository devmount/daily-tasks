# DailyTasks

This VS Code extension allows to quickly manage tasks on a daily basis.

![daily_tasks_vscode](https://user-images.githubusercontent.com/5441654/180646165-635d1e35-d78f-48d1-a20c-cb4b9c8dfaef.gif)


## Features

- Tasks can be created by command, button or click on the status bar item.
- The task description can be edited anytime (even when the task is completed)
- Tasks can be marked as done and removed. Also all existing tasks can be wiped at once.
- Tasks are kept even when changing workspaces

## Commands

This extension contributes the following commands to the Command palette.

- _Daily Tasks: Focus on List View_ (`tasks.list.focus`): Opens and focuses the task list
- _Daily Tasks: Add Task_ (`tasks.addTask`): Creates a new empty task on top
- _Daily Tasks: Clear Tasks_ (`tasks.clearTasks`): Wipes all existing tasks (cannot be undone)

<!--## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.
-->

## Shortcuts

VS Code provides configuration of shortcuts for all commands.
However I recommend setting at least the following shortcut for easily adding new tasks:

![dailytasks_shortcut](https://github.com/devmount/daily-tasks/assets/5441654/2fbd41db-3b42-4558-a44e-156916cd5a62)


## Release Notes

Here is an overview of the changes that were made in each version.

### v0.2.0

➕ Task list is now stored globally and now is shown even after refresh or workspace change  
💚 Status bar is now enhanced with status colora, tooltip and new-task command

### v0.1.0

🚀 Initial release of DailyTasks.

**Enjoy!**
