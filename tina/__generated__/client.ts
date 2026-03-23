import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ cacheDir: 'C:/dev/LBGF/LesBiGulfFriends/tina/__generated__/.cache/1774283696824', url: 'https://content.tinajs.io/1.6/content/YOUR_TINA_CLIENT_ID/github/main', token: 'YOUR_TINA_READWRITE_TOKEN', queries,  });
export default client;
  