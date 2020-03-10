/**
 * A task within a Gantt chart.
 */
class Task {

    constructor(taskId, typeId, name, startTime, endTime) {

        this.taskId = taskId;

        this.name = name;

        this.typeId = typeId;

        this.startTime = startTime;

        this.endTime = endTime;
    }
}

export {Task};