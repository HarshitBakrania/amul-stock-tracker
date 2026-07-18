import express from "express";
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

const app = express();
const PORT = 3000;
const ROSE_LASSI = "rose-lassi"
const BUTTERMILK = "buttermilk"

chromium.use(stealth);

async function getProductData(product, pincode) {
    let browser;
    try {
        browser = await chromium.launch({ headless: false })
        const page = await browser.newPage();

        await page.goto(`https://shop.amul.com/en/product/${product}`);
        const responsePromise = page.waitForResponse(reponse => reponse.url().includes("ms.products") && reponse.status() === 200);

        const selector = "#search";
        await page.waitForSelector(selector);
        await page.focus(selector);
        await page.fill(selector, pincode);
        await page.waitForTimeout(1000);
        await page.locator(selector).press("Enter");

        const response = await responsePromise;
        const data = await response.json();
        return data;

    } catch (error) {
        console.log("Error fetching the data!", error);
        return error;
    } finally {
        if (browser) {
            browser.close();
        }
    }
}


app.get("/", (req, res) => {
    res.send("HELLO WORLD!")
})

app.get("/api/stock/:productName", async (req, res) => {
    console.log("Received a request to check the stock");
    const productName = req.params.productName;
    const pincode = req.query.pincode || "400001"
    console.log(`Fetching data for ${productName} at pincode ${pincode}`);
    const productResult = await getProductData(productName, pincode);
    if (productResult && productResult.data && productResult.data.length > 0) {
        const product = productResult.data[0];
        const productName = product.name;
        const productPrice = product.price;
        const productAvailability = product.available;
        res.json({
            name: productName,
            price: productPrice,
            availability: productAvailability
        })
    } else {
        res.status(404).json({ error: "Error fetching data, check the URL" })
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
})