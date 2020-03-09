import {Link} from "./Link.js";
import {Task} from "./Task.js";
import {TaskType} from "./TaskType.js";

let nextId = 0;

function getNextId() {
    return nextId++;
}

class GanttData {

    constructor() {

        this.tasks = {};
        this.tasksList = [];
        this.links = {};
        this.linksList = [];
        this.taskTypes = {};
        this.startTime = 0;
        this.endTime = 0;

        /**
         * For each object, the start time of the first task associated with it.
         * @type {{}}
         * @private
         */
        this.objectCreationTimes = {};
    }

    clear() {
        this.tasks = {};
        this.tasksList = [];
    }

    createTaskType(typeId, name, color) {
        if (this.taskTypes[typeId]) {
            throw "TaskType already exists:" + typeId;
        }
        const taskType = new TaskType(typeId, name, color);
        this.taskTypes[taskType.typeId] = taskType;
        return taskType;
    }

    createTask(typeId, startTime, endTime) {

        if (startTime < 0) {
            throw "Invalid startTime - must not be less than zero";
        }

        if (endTime < 0) {
            throw "Invalid endTime - must not be less than zero";
        }

        if (startTime >= endTime) {
            throw "Invalid startTime and endTime - wrongly ordered or zero duration";
        }

        const task = new Task(getNextId(), typeId, startTime, endTime);

        this.tasks[task.taskId] = task;
        this.tasksList.push(task);

        if (this.tasksList.length === 0) {
            this.startTime = startTime;
            this.endTime = endTime;
        } else {
            if (this.startTime > startTime) {
                this.startTime = startTime;
            }
            if (this.endTime < endTime) {
                this.endTime = endTime;
            }
        }
        return task;
    }

    linkTask(taskId, objectId) {
        const task = this.tasks[taskId];
        if (!task) {
            throw "Task not found:" + taskId;
        }
        const link = new Link(getNextId(), taskId, objectId);
        this.links[link.linkId] = link;
        this.linksList.push(link);
        if (this.objectCreationTimes.hasOwnProperty(objectId)) {
            const objectCreationTime = this.objectCreationTimes[objectId];
            if (objectCreationTime > task.startTime) {
                this.objectCreationTimes[objectId] = task.startTime;
            }
        } else {
            this.objectCreationTimes[objectId] = task.startTime;
        }
        return link;
    }
}

export {GanttData};