const request = indexedDB.open("Kanban_Database", 2)
const STORE_NAME = "Kanban_Store"
let db;
let undoStack = [];
let isUndo = false  

request.onupgradeneeded = (event) => {
    db = event.target.result
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('status', 'status', { unique: false });
    }
};
request.onsuccess = function (event) {
    db = event.target.result;
    LoadTask();
}
request.onerror = function (event) {
    console.error("Database error: " + event.target.errorCode);
}
//Load All Tasks From Storage And Render Them On The Board
function LoadTask() {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = (event) => {
        const task = event.target.result;
        RenderTasks(task);
        UpdateTaskCount(task);
    }
}
//Render The Provided List Of Tasks
function RenderTasks(tasks) {
    document.querySelectorAll(".task-container").forEach((column) => (column.innerHTML = ""));
    tasks.forEach(task => {

        const taskDiv = document.createElement('div');
        taskDiv.classList.add('task-item');
        taskDiv.setAttribute('draggable', 'true');
        taskDiv.id = `task-${task.id}`;

        taskDiv.innerHTML = `
            <span class="task-text">${task.task}</span>
            <button class="update-task-btn" data-id="${task.id}" onclick="EnableEditOn(${task.id})")">Update</button>
            <button class="delete-task-btn" data-id="${task.id}" onclick="DeleteTask(${task.id})">Delete</button>
        `;
        const column = document.querySelector(`.column[data-status="${task.status}"] .task-container`);
        column.appendChild(taskDiv);

        taskDiv.addEventListener('dragstart', (e) => {
            taskDiv.classList.add('is-dragging')
            e.dataTransfer.setData("text/plain", taskDiv.id);
        })

        taskDiv.addEventListener('dragend', (e) => {
            taskDiv.classList.remove('is-dragging')
        })
    });
}
//Handle Drag And Drop For All Task Columns
const DragColumns = document.querySelectorAll('.column')
DragColumns.forEach((dragColumn) => {
    dragColumn.addEventListener('dragover', (e) => {
        e.preventDefault()
    })
    dragColumn.addEventListener('drop', (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        const NewStatus = dragColumn.getAttribute("data-status");
        const id = Number(taskId.replace("task-", ""))
        UpdateTaskStatus(id, NewStatus)
    })
})
//Perform An Undo Operation By The Action Type
function UndoAction() {
    if (undoStack.length === 0) {
        alert("Nothing to Undo")
        return
    }
    const ConfirmUndo = confirm("Are You Sure Want to Undo Last Action ?");
    if (!ConfirmUndo) return;
    const action = undoStack.pop()
    switch (action.type) {
        case "create":
            UndoCreate(action)
            break;

        case "delete":
            UndoDelete(action)
            break;

        case "move":
            UndoMove(action)
            break;

        default:
            console.log("unknow Action", action);
    }
}
//Undo Creation Of a Task (Remove The Previously Created Task)
function UndoCreate(action) {
    isUndo = true
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.delete(action.id).onsuccess = () => {
        LoadTask()
        isUndo = false
    }
}
//Undo Deletion Of a Task (Restore The Previously Deleted Task)
function UndoDelete(action) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(action.data).onsuccess = () => {
        LoadTask()
    }
}
//Undo Moving A Task Between Columns (Restore its Old Status)
function UndoMove(action) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getStatusData = store.get(action.id)
    getStatusData.onsuccess = () => {
        const task = getStatusData.result

        if (task) {
            task.status = action.from
            store.put(task).onsuccess = () => {
                LoadTask()
            }
        }
    }

}