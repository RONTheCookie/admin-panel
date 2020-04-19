const express = require("express");
const app = express();
const child = require("mz/child_process");
const port = process.env.PORT || 3000;
require("log-node")();
const log = require("log");
const dbOpts = {
    db: process.env.db || `sdab`,
};
if (process.env.DB_ADDR)
    dbOpts.servers = [
        {
            host: process.env.DB_ADDR.split(":")[0],
            port: parseInt(process.env.DB_ADDR.split(":")[1], 10),
        },
    ];
const r = require(`rethinkdbdash`)(dbOpts); // Connect to RethinkDB
app.use(express.static("assets"));
app.set("view engine", "ejs");

async function getContainerLogs(containerName) {
    try {
        return (await child.exec(`docker logs ${containerName} --tail 10`))
            .map((a) => a.toString())
            .join("");
    } catch (err) {
        return "ERROR: couldn't get watchtower logs.";
    }
}
async function getBuilds() {
    return await r.table("builds").orderBy(r.desc("createdAt")).limit(10).run();
}

app.get("/", async (req, res) => {
    const builds = await getBuilds();
    const watchtowerLogs = await getContainerLogs("new_watchtower_1");
    const sdabLogs = await getContainerLogs("new_sdab_1");
    res.render("index", { builds, watchtowerLogs, sdabLogs });
});

app.listen(port, () => log(`Listening on port ${port}`));
