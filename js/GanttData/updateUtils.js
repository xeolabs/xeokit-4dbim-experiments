/**
 * Gets a list of object appearance updates from a Gantt chart for the given time instant.
 * List is null if there are no updates for that instant.
 */
function getUpdates(ganttModel, time, viewer, updates) {

    let numUpdates = 0;

    const objects = viewer.scene.objects;

    const tasks = ganttModel.tasks;
    const types = ganttModel.types;
    const links = ganttModel.links;

    for (let i = 0, len = tasks.length; i < len; i++) {
        const task = tasks[i];

        if (task.startTime <= time && time <= task.endTime) {

            for (let j = 0, lenj = links.length; j < lenj; j++) {

                const link = links[j];

                if (task.id === link.taskId) {

                    const typeId = task.typeId;
                    const type = types[typeId];
                    const color = type.color;
                    const objectId = link.objectId;
                    const entity = objects[objectId];

                    if (!entity) {
                        console.error("Object not found: " + objectId);
                        continue;
                    }

                    const update = {
                        object: entity,
                        color: color
                    };

                    updates[numUpdates++] = update;
                }
            }
        }
    }

    return numUpdates;
}

/**
 * Applies the given list of object appearance updates.
 */
function applyUpdates(updates, numUpdates) {

    for (let i = 0, len = numUpdates; i < len; i++) {

        const update = updates[i];
        const objectId = update.objectId;
        const entity = update.object;
        const color = update.color;

        entity.colorize = color;
        entity.xrayed = false;
    }
}

/**
 * Un-applies the given list of object appearance updates.
 */
function removeUpdates(updates, numUpdates) {

    for (let i = 0, len = numUpdates; i < len; i++) {

        const update = updates[i];
        const entity = update.object;

        entity.colorize = null;
        entity.xrayed = true;
    }
}

export {getUpdates, applyUpdates, removeUpdates};