const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

async function run() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('http://localhost:5173');

    await driver.findElement(By.xpath("//button[contains(text(),'Notifications')]")).click();

    let firstNotif = await driver.wait(
      until.elementLocated(By.css('.notif-item')),
      5000
    );
    await firstNotif.click();

    try {
      await driver.wait(until.elementLocated(By.css('.modal')), 8000);
    } catch (e) {
      // Debug: capture what the page actually looked like at the moment of failure
      let screenshot = await driver.takeScreenshot();
      fs.writeFileSync('selenium-tests/debug-failure.png', screenshot, 'base64');
      console.log('RESULT: FAIL - modal never appeared. Screenshot saved to selenium-tests/debug-failure.png');
      return;
    }

    let viewButtons = await driver.findElements(By.xpath("//button[text()='View in Inventory']"));
    if (viewButtons.length === 0) {
      console.log('RESULT: FAIL - No "View in Inventory" button found');
      return;
    }
    await viewButtons[0].click();

    await driver.wait(until.elementLocated(By.css('.tab-active')), 5000);
    let activeTabText = await driver.findElement(By.css('.tab-active')).getText();

    console.log('RESULT:', activeTabText.includes('Food Inventory') ? 'PASS' : 'FAIL', '- Active tab:', activeTabText);
  } finally {
    await driver.quit();
  }
}

run();