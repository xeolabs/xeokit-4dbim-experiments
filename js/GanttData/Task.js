/**
 * A task within a Gantt chart.
 */
class Task {

    constructor(taskId, typeId, startTime, endTime) {

        this.taskId = taskId;

        this.typeId = typeId;

        this.startTime = startTime;

        this.endTime = endTime;
    }
}

export {Task};