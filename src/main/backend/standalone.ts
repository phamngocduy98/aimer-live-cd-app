import "dotenv/config";
import { initLogger } from "./utils/log.js";
import { startServer } from "./index.js";

const PORT = parseInt(process.env.PORT || "3001", 10);
initLogger();
startServer(PORT).then(() => console.log(`Server: http://localhost:${PORT}`));
