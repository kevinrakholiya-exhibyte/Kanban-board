//Add A New Task
function AddTask(status) {
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
        alert("Task Added Successfully")
        undoStack.push({
            type: "create",
            id: newId
        })
        document.getElementById('taskInput').value = ""
        LoadTask();
    };
    addRequest.onerror = (event) => {
        console.error('Error adding item:', event.target.error);
    };

}
//Update An Existing Task's Details Using its ID And The Updated Task Data
function UpdateTask(id, tasks) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getData = store.get(id)
    getData.onsuccess = (event) => {
        const todoItem = event.target.result
        if (todoItem) {
            todoItem.task = tasks
            store.put(todoItem)
            alert("Task Updated SuccessFully")
        }
    }
}
//Update An Existing Task's Count Based On Status
function UpdateTaskCount(tasks) {
    let Todo = 0;
    let In_Progress = 0;
    let Done = 0;

    tasks.forEach(task => {
        if (task.status === "todo") {
            Todo++;
        } else if (task.status === "in-progress") {
            In_Progress++;
        } else if (task.status === "done") {
            Done++;
        }
    });
    document.getElementById('count-todo').textContent = Todo
    document.getElementById('count-in-progress').textContent = In_Progress
    document.getElementById('count-done').textContent = Done
}
//Enable Editing Mode For a Specific Task By ID
function EnableEditOn(id) {
    const taskItem = document.querySelector(`[data-id='${id}']`).parentNode
    const taskText = taskItem.querySelector('.task-text')
    taskText.contentEditable = true
    const UpdateBtn = taskItem.querySelector(".update-task-btn")
    UpdateBtn.textContent = 'save'
    UpdateBtn.setAttribute('onclick', `SaveTask (${id})`)
}
//Save Changes Made To a Task After Editing
function SaveTask(id) {
    const taskItem = document.querySelector(`[data-id='${id}']`).parentNode
    const taskText = taskItem.querySelector('.task-text').innerText
    UpdateTask(id, taskText)
    LoadTask();
}
//Update The Task's Status When Moved Between Columns
function UpdateTaskStatus(id, NewStatus) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getStatus = store.get(id)
    getStatus.onsuccess = () => {
        const task = getStatus.result;
        if (task) {
            const oldStatus = task.status
            if (oldStatus !== NewStatus) {
                undoStack.push({
                    type: 'move',
                    id,
                    from: oldStatus,
                    to: NewStatus
                })
            }
            task.status = NewStatus
            store.put(task).onsuccess = () => {
                LoadTask()
            }
        }
    }
}
//Delete a Task By its ID
function DeleteTask(id) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const DeletedData = store.get(id);
    DeletedData.onsuccess = () => {
        const deletedItem = DeletedData.result
        undoStack.push({
            type: "delete",
            data: deletedItem
        })
        store.delete(id)
        if (!isUndo) {
            alert("Task Deleted SuccessFully")
        }
        LoadTask();
    }
    DeletedData.onerror = (event) => {
        console.error('Error adding item:', event.target.error);
    };
}