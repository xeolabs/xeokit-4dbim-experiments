import {math} from "@xeokit/xeokit-sdk/src/viewer/scene/math/math.js";

/** Populates a GanttData with random data for whatever is in the given xeokit Viewer.
 */
function buildGanttData(viewer, ganttData) {

    const scene = viewer.scene;
    const metaScene = viewer.metaScene;
    const camera = scene.camera;

    // Get a list of IfcBuildingStoreys, sorted from bottom to top

    const storeyMetaObjects = metaScene.metaObjectsByType["IfcBuildingStorey"];
    const storeyMetaObjectsList = [];

    for (let objectId in storeyMetaObjects) {

        const storeyMetaObject = storeyMetaObjects[objectId];

        const storeyItem = {
            metaObject: storeyMetaObject,
            aabb: scene.getAABB(metaScene.getObjectIDsInSubtree(storeyMetaObject.id)),
            subObjectBins: {}
        };

        storeyMetaObjectsList.push(storeyItem);

        const subObjectIds = storeyMetaObject.getObjectIDsInSubtree();
        for (var i = 0, len = subObjectIds.length; i < len; i++) {
            const subObjectId = subObjectIds[i];
            const entity = scene.objects[subObjectId];
            if (!entity) {
                continue;
            }
            const subMetaObject = metaScene.metaObjects[subObjectId];
            const subMetaObjectType = subMetaObject.type;
            if (!storeyItem.subObjectBins[subMetaObjectType]) {
                storeyItem.subObjectBins[subMetaObjectType] = [];
            }
            storeyItem.subObjectBins[subMetaObjectType].push({
                entity: entity
            });
        }
    }

    storeyMetaObjectsList.sort((item1, item2) => {
        let idx = 0;
        if (camera.xUp) {
            idx = 0;
        } else if (camera.yUp) {
            idx = 1;
        } else {
            idx = 2;
        }
        if (item1.aabb[idx] < item2.aabb[idx]) {
            return -1;
        }
        if (item1.aabb[idx] > item2.aabb[idx]) {
            return 1;
        }
        return 0;
    });

    for (var i = 0, len = storeyMetaObjectsList.length; i < len; i++) {
        const storeyMetaObject = storeyMetaObjectsList[i];
        for (var type in storeyMetaObject.subObjectBins) {
            const bin = storeyMetaObject.subObjectBins[type];

            bin.sort((item1, item2) => {
                let idx = 0;
                if (camera.xUp) {
                    idx = 1;
                } else if (camera.yUp) {
                    idx = 2;
                } else {
                    idx = 0;
                }
                if (item1.entity.aabb[idx] < item2.entity.aabb[idx]) {
                    return -1;
                }
                if (item1.entity.aabb[idx] > item2.entity.aabb[idx]) {
                    return 1;
                }
                return 0;
            });
        }
    }


    //--------------------------------------------------------------------------------
    // Create Gantt data
    //--------------------------------------------------------------------------------

    ganttData.createTaskType("construct", "construct", [1, 0, 0]);

    let time = 0;

    for (var i = 0, len = storeyMetaObjectsList.length; i < len; i++) {
        const storeyMetaObject = storeyMetaObjectsList[i];
        for (var type in storeyMetaObject.subObjectBins) {
            const bin = storeyMetaObject.subObjectBins[type];

            for (var j = 0, lenj = bin.length; j < lenj; j++) {

                const item = bin[j];
                const entity = item.entity;
                const objectId = entity.id;
                const task = ganttData.createTask("construct", time, time + 1);

                ganttData.linkTask(task.taskId, objectId);

                time++;
            }
        }
    }

    debugger;
}


export {buildGanttData};

