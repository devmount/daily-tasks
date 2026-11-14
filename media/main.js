// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
	const vscode = acquireVsCodeApi();

	const oldState = vscode.getState() || { tasks: [] };

	/** @type {Array<{ value: string, done: boolean, details?: string, expanded?: boolean }>} */
	let tasks = oldState.tasks;
	updateTaskList(tasks, false);

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
				updateTaskList(tasks, true);
				break;
			case 'addTask':
				addTask();
				break;
			case 'clearTasks':
				clearTasks();
				break;
		}
	});

	/** index of the task currently being dragged */
	let dragIndex = -1;

	/** list item made draggable by pressing its handle */
	let draggableItem = null;

	// Release the item if the mouse is let go anywhere without a drag having started,
	// so it doesn't stay draggable (a started drag is cleaned up by dragend instead)
	document.addEventListener('mouseup', () => {
		if (draggableItem && dragIndex < 0) {
			draggableItem.draggable = false;
		}
		draggableItem = null;
	});

	/**
	 * Create a small icon button for task actions
	 * @param {string} className
	 * @param {string} text
	 * @param {string} title
	 * @param {() => void} onClick
	 */
	function actionButton(className, text, title, onClick) {
		const btn = document.createElement('div');
		btn.className = 'task-action ' + className;
		btn.textContent = text;
		btn.title = title;
		btn.addEventListener('click', onClick);
		return btn;
	}

	/**
	 * Move a task from one index to another
	 * @param {number} from
	 * @param {number} to
	 */
	function moveTask(from, to) {
		if (to < 0 || to >= tasks.length || from === to) {
			return;
		}
		const [moved] = tasks.splice(from, 1);
		tasks.splice(to, 0, moved);
		updateTaskList(tasks, true);
	}

	/**
	 * Build and append all list items
	 * @param {Array<{ value: string, done: boolean, details?: string, expanded?: boolean }>} tasks
	 * @param {Boolean} save
	 */
	function updateTaskList(tasks, save) {
		const ul = document.querySelector('.task-list');
		ul.textContent = '';
		tasks.forEach((task, index) => {
			// init list entry for task
			const li = document.createElement('li');
			li.className = 'task-item';

			// drag and drop reordering (dragging only starts from the handle)
			li.addEventListener('dragstart', (e) => {
				// ignore drags not started from the handle (e.g. dragging selected text)
				if (!li.draggable) { return; }
				dragIndex = index;
				e.dataTransfer.effectAllowed = 'move';
				// custom type only, so dropping outside the list (e.g. into an editor) pastes nothing
				e.dataTransfer.setData('application/x-daily-task', String(index));
				li.classList.add('dragging');
			});
			li.addEventListener('dragend', () => {
				dragIndex = -1;
				li.draggable = false;
				li.classList.remove('dragging');
				document.querySelectorAll('.drop-before, .drop-after')
					.forEach(el => el.classList.remove('drop-before', 'drop-after'));
			});
			li.addEventListener('dragover', (e) => {
				if (dragIndex < 0) { return; }
				e.preventDefault();
				const rect = li.getBoundingClientRect();
				const before = e.clientY < rect.top + rect.height / 2;
				li.classList.toggle('drop-before', before);
				li.classList.toggle('drop-after', !before);
			});
			li.addEventListener('dragleave', () => {
				li.classList.remove('drop-before', 'drop-after');
			});
			li.addEventListener('drop', (e) => {
				if (dragIndex < 0) { return; }
				e.preventDefault();
				const rect = li.getBoundingClientRect();
				let target = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
				if (dragIndex < target) { target--; }
				const from = dragIndex;
				dragIndex = -1;
				moveTask(from, target);
			});

			// main row: handle, checkbox, description, actions
			const row = document.createElement('div');
			row.className = 'task-row';

			const handle = document.createElement('div');
			handle.className = 'task-handle';
			handle.textContent = '⋮⋮';
			handle.title = 'Drag to reorder';
			handle.addEventListener('mousedown', () => {
				li.draggable = true;
				draggableItem = li;
			});

			// checkbox to show state of task (unfinished or done)
			const check = document.createElement('div');
			check.className = 'task-state';
			if (task.done) {
				check.classList.add('checked');
			}
			check.addEventListener('click', () => {
				check.classList.toggle('checked');
				task.done = check.classList.contains('checked');
				updateTaskList(tasks, true);
			});

			// input field for task description
			const description = document.createElement('input');
			description.className = 'task-input';
			description.type = 'text';
			description.value = task.value;
			description.addEventListener('change', (e) => {
				task.value = e.target.value;
				updateTaskList(tasks, true);
			});

			// hover actions: details toggle, move up, move down, remove
			const actions = document.createElement('div');
			actions.className = 'task-actions';
			const toggle = actionButton('task-details-toggle', task.expanded ? '▾' : '▸', 'Show/hide details', () => {
				task.expanded = !task.expanded;
				updateTaskList(tasks, true);
			});
			if (task.details) {
				toggle.classList.add('has-details');
			}
			const up = actionButton('task-up', '↑', 'Move up', () => moveTask(index, index - 1));
			const down = actionButton('task-down', '↓', 'Move down', () => moveTask(index, index + 1));
			if (index === 0) { up.classList.add('disabled'); }
			if (index === tasks.length - 1) { down.classList.add('disabled'); }
			// clear icon to remove single task
			const clear = actionButton('task-remove', '×', 'Remove task', () => {
				tasks.splice(tasks.indexOf(task), 1);
				updateTaskList(tasks, true);
			});
			actions.append(toggle, up, down, clear);

			row.append(handle, check, description, actions);
			li.appendChild(row);

			// optional details, hidden below the task name until expanded
			if (task.expanded) {
				const details = document.createElement('textarea');
				details.className = 'task-details';
				details.rows = 3;
				details.placeholder = 'Details…';
				details.value = task.details || '';
				details.addEventListener('change', (e) => {
					task.details = e.target.value;
					updateTaskList(tasks, true);
				});
				li.appendChild(details);
			}
			ul.appendChild(li);
		});
		if (save) {
			tasksChanged(tasks);
		}
	}

	/**
	 * Add an empty task
	 */
	function addTask() {
		tasks.unshift({ value: '', done: false });
		updateTaskList(tasks, true);
		let item = document.querySelector('.task-input');
		item.focus();
	}

	/**
	 * Remove all existing tasks, leaving an empty list
	 */
	function clearTasks() {
		tasks = [];
		updateTaskList(tasks, true);
	}

	/**
	 * Post message about changed tasks
	 * @param {Array<{ value: string, done: boolean, details?: string, expanded?: boolean }>} tasksChanged
	 */
	function tasksChanged(tasksChanged) {
		// Update the saved state
		tasks = tasksChanged;
		vscode.setState({ tasks: tasksChanged });
		// Post updates
		vscode.postMessage({
			type: 'tasksOpen',
			open: tasksChanged.filter(t => t.done).length,
			total: tasksChanged.length
		});
		vscode.postMessage({
			type: 'tasksSave',
			value: tasksChanged
		});
	}

}());
