// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
	const vscode = acquireVsCodeApi();

	/** @type {Array<{ value: string, done: boolean }>} */
	let tasks = [];

	document.querySelector('.add-task-button')?.addEventListener('click', () => {
		addTask();
	});

	document.querySelector('.clear-tasks-button')?.addEventListener('click', () => {
		clearTasks();
	});

	// Handle messages sent from the extension to the webview
	window.addEventListener('message', event => {
		// The json data that the extension sent
		switch (event.data.type) {
			case 'initTasks':
				tasks = event.data.value;
				updateTaskList(tasks);
				break;
			case 'addTask':
				addTask();
				break;
			case 'clearTasks':
				clearTasks();
				break;
		}
	});

	/**
	 * Build and append all list items
	 * @param {Array<{ value: string, done: boolean }>} tasks
	 */
	function updateTaskList(tasks) {
		const ul = document.querySelector('.task-list');
		ul.textContent = '';
		for (const task of tasks) {
			// init list entry for task
			const li = document.createElement('li');
			li.className = 'task-item';

			// checkbox to show state of task (unfinished or done)
			const check = document.createElement('div');
			check.className = 'task-state';
			if (task.done) {
				check.classList.add('checked');
			} else {
				check.classList.remove('checked');
			}
			check.addEventListener('click', () => {
				check.classList.toggle('checked');
				task.done = check.classList.contains('checked');
				updateTaskList(tasks);
			});

			// input field for task description
			const description = document.createElement('input');
			description.className = 'task-input';
			description.type = 'text';
			description.value = task.value;
			description.addEventListener('change', (e) => {
				task.value = e.target.value;
				updateTaskList(tasks);
			});

			// clear icon to remove single task
			const clear = document.createElement('div');
			clear.className = 'task-remove';
			clear.textContent = '×';
			clear.addEventListener('click', () => {
				tasks.splice(tasks.indexOf(task), 1);
				updateTaskList(tasks);
			});

			// build list entry and append it to list
			li.appendChild(check);
			li.appendChild(description);
			li.appendChild(clear);
			ul.appendChild(li);
		}
		tasksChanged(tasks);
	}

	/**
	 * Add an empty task
	 */
	function addTask() {
		tasks.unshift({ value: '', done: false });
		updateTaskList(tasks);
		let item = document.querySelector('.task-input');
		item.focus();
	}

	/**
	 * Remove all existing tasks, leaving an empty list
	 */
	function clearTasks() {
		tasks = [];
		updateTaskList(tasks);
	}

	/** 
	 * Post message about changed tasks
	 * @param {Array<{ value: string, done: boolean }>} tasks 
	 */
	function tasksChanged(tasksChanged) {
		// Update the saved state
		tasks = tasksChanged;
		// Post updates
		vscode.postMessage({type: 'tasksOpen', value: tasksChanged.filter(t => !t.done).length });
		vscode.postMessage({type: 'tasksSave', value: tasksChanged });
	}

}());
