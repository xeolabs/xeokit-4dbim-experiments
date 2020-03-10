/**
 * Loads the West RiverSide Hospital Model
 * @param xktLoader
 * @param done
 */
function loadDuplexModel(xktLoader, done) {

    const model = xktLoader.load({
        id: "duplex",
        src: "./data/duplex/geometry.xkt",
        metaModelSrc: "./data/duplex/metadata.json",
        edges: true
    });

    model.on("loaded", () => {
        done();
    })
}

export {loadDuplexModel};