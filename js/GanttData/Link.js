/**
 * Links a {@link Task} to an object within a model.
 */
class Link {

    constructor(linkId, taskId, objectId) {

        this.linkId = linkId;

        this.taskId = taskId;

        this.objectId = objectId;
    }
}

export {Link};