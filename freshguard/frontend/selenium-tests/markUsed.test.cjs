const { Builder, By, until } = require('selenium-webdriver');

async function run() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('http://localhost:5173');
    await driver.findElement(By.xpath("//button[contains(text(),'Food Inventory')]")).click();

    // Find the "Milk" row and click its "Mark Used" button
    let milkRow = await driver.wait(
      until.elementLocated(By.xpath("//tr[td[contains(text(),'Milk')]]")),
      5000
    );
    let markUsedBtn = await milkRow.findElement(By.xpath(".//button[text()='Mark Used']"));
    await markUsedBtn.click();

    // Wait briefly for the table to refresh, then check the row's status
    await driver.sleep(1000);
    let updatedRow = await driver.findElement(By.xpath("//tr[td[contains(text(),'Milk')]]"));
    let statusText = await updatedRow.findElement(By.css('.status')).getText();

    console.log('RESULT:', statusText.trim().toLowerCase() === 'used' ? 'PASS' : 'FAIL', '- Status shows:', statusText);
  } finally {
    await driver.quit();
  }
}

run();