const request = indexedDB.open("todo_Database", 2)
const STORE_NAME = "todo_store"
let db;

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
    window.location.reload()
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const taskInput = document.getElementById('taskInput').value;
    console.log(taskInput);
    const taskObject = {
        task: taskInput,
        status: status
    };

    console.log(taskObject);

    let addRequest = store.add(taskObject);

    addRequest.onsuccess = function () {
        console.log("Data added sucessfully");

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
    const containers = document.querySelector('.task-container');
    containers.innerHTML = "";

    tasks.forEach(task => {

        const taskDiv = document.createElement('div');
        taskDiv.classList.add('task-item');
        taskDiv.setAttribute('draggable', 'true');

        taskDiv.innerHTML = `
            <span class="task-text">${task.task}</span>
            <button class="update-task-btn" data-id="${task.id}" onclick="UpdateTask(${task.id})">Update</button>
            <button class="delete-task-btn" data-id="${task.id}" onclick="deleteTask(${task.id})">Delete</button>

        `;
        containers.appendChild(taskDiv);
    });
}

function deleteTask(id) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id)
    console.log(request);


    request.onsuccess = () => {
        console.log("Data Deleted sucessfully");
        LoadData();

    }

    request.onerror = (event) => {
        console.error('Error adding item:', event.target.error);
    };
}

function UpdateTask(id, tasks) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getData = store.get(id)

    getData.onsuccess = (event) => {
        const todoItem = event.target.result

        if (todoItem) {
            console.log(todoItem);
            todoItem.task = tasks

            const Update_Todo = store.put(todoItem)

            Update_Todo.onsuccess = function () {
                console.log("Todo item updated successfully:", todoItem);
            };

            Update_Todo.onerror = function () {
                console.error("Error updating item:", putRequest.error);
            }
        }
    }
}

function initializeDragAndDrop() {
    const containers = document.querySelectorAll('.tasks-container');

    containers.forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        container.addEventListener('dragleave', handleDragLeave);
    });
}

