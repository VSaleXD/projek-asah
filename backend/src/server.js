import "dotenv/config";
import { buatApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
buatApp().listen(port, () => console.log(`API berjalan di http://localhost:${port}/api/v1`));
