/**
 * A task type within a Gantt chart.
 */
class TaskType {

    constructor(typeId, name, color) {

        this.typeId = typeId;

        this.name = name;

        this.color = color;
    }
}

export {TaskType};