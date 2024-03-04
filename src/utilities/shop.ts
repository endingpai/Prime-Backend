import fs from 'fs';
import path from 'path';
import Safety from './safety.js';
import { dirname } from 'dirname-filename-esm';
import { ShopResponse } from '../types/typings';
import fetch from 'node-fetch'; // Import fetch if not already imported
import { WebhookClient } from 'discord.js';

const __dirname = dirname(import.meta);
const webhook = new WebhookClient({ url: 'https://canary.discord.com/api/webhooks/1211210002405130270/MN7gWw-0Kg2gih1leGal9JeuZV_s7IHdiAruBG3MKogB0O7EL9FRTlnfqzfhf2dGr1uE' }); // Replace 'YOUR_WEBHOOK_URL' with your actual webhook URL

class Shop {

    public async updateShop(): Promise<ShopResponse[] | boolean[]> {
        const newItems: any[] = [];

        const [shopResponse, catalogString, catalogRaw] = await Promise.all([
            fetch(`https://fortnite.rest/shop/random/${Safety.env.MAIN_SEASON}`, {
                method: 'GET',
            }),
            await fs.promises.readFile(path.join(__dirname, "../../Config/catalog_config.json"), 'utf-8'),
            await fs.promises.readFile(path.join(__dirname, "../../responses/catalog.json"), 'utf-8')
        ]);

        if (!shopResponse) return [];

        const shopJSON = await shopResponse.json();

        if (shopJSON.error) {
            if (shopJSON.error === "Module shop not enabled for this loopkey") {
                return [false];
            }
        }

        const dailyItems = shopJSON.daily;
        const featuredItems = shopJSON.featured;
        const catalog = JSON.parse(catalogString);
        const catalogRawJSON = JSON.parse(catalogRaw);

        for (const [i, dailyItem] of dailyItems.entries()) {
            const { shopName, price } = dailyItem;

            catalog[`daily${i + 1}`].price = price;
            catalog[`daily${i + 1}`].itemGrants = [shopName];

            newItems.push(dailyItem);
        }

        for (const [i, featuredItem] of featuredItems.entries()) {
            const { shopName, price } = featuredItem;

            catalog[`featured${i + 1}`].price = price;
            catalog[`featured${i + 1}`].itemGrants = [shopName];

            newItems.push(featuredItem);
        }

        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(24, 0, 0, 0)
        const todayOneMinuteBeforeMidnight = new Date(todayAtMidnight.getTime() - 60000);
        const isoDate = todayOneMinuteBeforeMidnight.toISOString();

        catalogRawJSON.expiration = isoDate

        await Promise.all([
            fs.promises.writeFile(path.join(__dirname, "../../Config/catalog_config.json"), JSON.stringify(catalog, null, 4)),
            fs.promises.writeFile(path.join(__dirname, "../../responses/catalog.json"), JSON.stringify(catalogRawJSON, null, 4))
        ]);

        // Sending update to Discord webhook
        const message = `Prime Item shop has been updated. New items:\n${newItems.map(item => `- ${item.shopName} - Price: ${item.price}`).join('\n')}`;
        webhook.send(message);

        return newItems;
    }

    constructor() {
        this.watchCatalogConfig();
    }

    private async watchCatalogConfig() {
        const catalogConfigPath = path.join(__dirname, "../../Config/catalog_config.json");

        fs.watchFile(catalogConfigPath, async () => {
            console.log("item shop file has changed.");
            // Trigger updateShop method when catalog_config.json changes
            await this.updateShop();
        });
    }
}

export default new Shop();
