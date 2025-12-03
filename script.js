const request = indexedDB.open("todo_Database", 2)
const STORE_NAME = "todo_store"
let db;
let undoStack = [];


request.onupgradeneeded = (event) => {
    db = event.target.result
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('status', 'status', { unique: false });
    }
};

request.onsuccess = function (event) {
    db = event.target.result;
    LoadData();

}
request.onerror = function (event) {
    console.error("Database error: " + event.target.errorCode);
}

function addTask(status) {

    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const taskInput = document.getElementById('taskInput').value;
    const taskObject = {
        task: taskInput,
        status: status
    };
    if (taskObject.task == "") {
        alert("Please Add Valid Description");
        return false
    }
    let addRequest = store.add(taskObject);
    addRequest.onsuccess = function (event) {
        const newId = event.target.result

        console.log("Data added sucessfully");
        undoStack.push({
            type: "create",
            id: newId
        })
        document.getElementById('taskInput').value = ""

        LoadData();

    };
    addRequest.onerror = (event) => {
        console.error('Error adding item:', event.target.error);
    };

}


function LoadData() {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => {
        const task = event.target.result;
        console.log(task);
        console.log("Data Loaded sucessfully");
        renderBoard(task)
    }
}

function renderBoard(tasks) {
    document.querySelectorAll(".task-container").forEach((column) => (column.innerHTML = ""));

    tasks.forEach(task => {

        const taskDiv = document.createElement('div');
        taskDiv.classList.add('task-item');
        taskDiv.setAttribute('draggable', 'true');
        taskDiv.id = `task-${task.id}`;


        taskDiv.innerHTML = `
            <span class="task-text">${task.task}</span>
            <button class="update-task-btn" data-id="${task.id}" onclick="enableEdit(${task.id})")">Update</button>
            <button class="delete-task-btn" data-id="${task.id}" onclick="deleteTask(${task.id})">Delete</button>
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


function deleteTask(id) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const DeletedData = store.get(id);
    console.log(DeletedData);

    DeletedData.onsuccess = () => {
        const deletedItem = DeletedData.result

        undoStack.push({
            type: "delete",
            data: deletedItem
        })
        store.delete(id)
        console.log("Data Deleted sucessfully");

        LoadData();

    }
    DeletedData.onerror = (event) => {
        console.error('Error adding item:', event.target.error);
    };
}

function UpdateTask(id, tasks) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getData = store.get(id)

    getData.onsuccess = (event) => {
        const todoItem = event.target.result
        console.log(todoItem);

        if (todoItem) {
            todoItem.task = tasks
            store.put(todoItem)
        }
    }
}

function enableEdit(id) {
    const taskItem = document.querySelector(`[data-id='${id}']`).parentNode
    const taskText = taskItem.querySelector('.task-text')
    taskText.contentEditable = true
    const UpdateBtn = taskItem.querySelector(".update-task-btn")
    UpdateBtn.textContent = 'save'
    UpdateBtn.setAttribute('onclick', `saveTask (${id})`)
}

function saveTask(id) {
    const taskItem = document.querySelector(`[data-id='${id}']`).parentNode
    const taskText = taskItem.querySelector('.task-text').innerText
    UpdateTask(id, taskText)
    LoadData();
}


function UpdateTaskStatus(id, newStatus) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getStatus = store.get(id)
    console.log(getStatus);


    getStatus.onsuccess = () => {
        const task = getStatus.result;
        if (task) {
            const oldStatus = task.status
            if (oldStatus !== newStatus) {
                undoStack.push({
                    type: 'move',
                    id,
                    from: oldStatus,
                    to: newStatus
                })
            }
            task.status = newStatus
            store.put(task).onsuccess = () => {
                LoadData()
            }
        }
    }
}

const dragColumns = document.querySelectorAll('.column')
dragColumns.forEach((dragColumn) => {
    dragColumn.addEventListener('dragover', (e) => {
        e.preventDefault()
    })

    dragColumn.addEventListener('drop', (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        const newStatus = dragColumn.getAttribute("data-status");
        console.log(newStatus);

        const id = Number(taskId.replace("task-", ""))
        UpdateTaskStatus(id, newStatus)
    })
})

function undoAction() {
    if (undoStack.length === 0) {
        alert("Nothing to Undo")
        console.log("nothing to undo");
        return
    }
    const action = undoStack.pop()

    switch (action.type) {
        case "create":
            undoCreate(action)
            break;

        case "delete":
            undoDelete(action)
            break;

        case "move":
            undoMove(action)
            break;

        default:
            console.log("unknow Action", action);

    }

}

function undoCreate(action) {
    deleteTask(action.id)
}

function undoDelete(action) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.put(action.data).onsuccess = () => {
        LoadData()
    }
}

function undoMove(action) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const getStatusData = store.get(action.id)

    getStatusData.onsuccess = () => {
        const task = getStatusData.result

        if (task) {
            task.status = action.from
            store.put(task).onsuccess = () => {
                LoadData()
            }
        }
    }

}