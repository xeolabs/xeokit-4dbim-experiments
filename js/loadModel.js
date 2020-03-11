function loadModel(xktLoader, modelId, done) {

    if (!modelId) {
        throw "modelId expected";
    }

    switch (modelId) {

        case "duplex":
            xktLoader.load({
                src: "./data/duplex/geometry.xkt",
                metaModelSrc: "./data/duplex/metadata.json",
                edges: true
            }).on("loaded", done);
            break;

        case "schependomlaan":
            xktLoader.load({
                src: "./data/schependomlaan/geometry.xkt",
                metaModelSrc: "./data/schependomlaan/metadata.json",
                edges: true
            }).on("loaded", done);
            break;

        case "hospital":
            xktLoader.load({
                src: "./data/WestRiverSideHospital/mechanical/geometry.xkt",
                metaModelSrc: "./data/WestRiverSideHospital/mechanical/metadata.json",
                edges: true
            }).on("loaded", () => {
                xktLoader.load({
                    src: "./data/WestRiverSideHospital/plumbing/geometry.xkt",
                    metaModelSrc: "./data/WestRiverSideHospital/plumbing/metadata.json",
                    edges: true
                }).on("loaded", () => {
                    xktLoader.load({
                        src: "./data/WestRiverSideHospital/electrical/geometry.xkt",
                        metaModelSrc: "./data/WestRiverSideHospital/electrical/metadata.json",
                        edges: true
                    }).on("loaded", () => {
                        xktLoader.load({
                            src: "./data/WestRiverSideHospital/fireAlarms/geometry.xkt",
                            metaModelSrc: "./data/WestRiverSideHospital/fireAlarms/metadata.json",
                            edges: true
                        }).on("loaded", () => {
                            xktLoader.load({
                                src: "./data/WestRiverSideHospital/sprinklers/geometry.xkt",
                                metaModelSrc: "./data/WestRiverSideHospital/sprinklers/metadata.json",
                                edges: true
                            }).on("loaded", () => {
                                xktLoader.load({
                                    src: "./data/WestRiverSideHospital/structure/geometry.xkt",
                                    metaModelSrc: "./data/WestRiverSideHospital/structure/metadata.json",
                                    edges: true
                                }).on("loaded", () => {
                                    xktLoader.load({
                                        src: "./data/WestRiverSideHospital/architectural/geometry.xkt",
                                        metaModelSrc: "./data/WestRiverSideHospital/architectural/metadata.json",
                                        edges: true
                                    }).on("loaded", done);
                                });
                            });
                        });
                    });
                });
            });
            break;
        default:
            throw "modelId not recognized: " + modelId;
    }
}

export {loadModel};